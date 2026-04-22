const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const TutorSession = require('../models/TutorSession');
const Appointment = require('../models/Appointment');
const SessionChatMessage = require('../models/SessionChatMessage');
const { createNotification, setNotificationEmitter } = require('./notificationService');

let ioInstance = null;
const onlineSocketCounts = new Map();

const getUserIdFromToken = (socket) => {
  const tokenFromAuth = socket.handshake.auth?.token || '';
  const tokenFromHeader = (socket.handshake.headers?.authorization || '').replace('Bearer ', '');
  return tokenFromAuth || tokenFromHeader;
};

const increaseOnlineCount = (userId) => {
  const current = onlineSocketCounts.get(userId) || 0;
  onlineSocketCounts.set(userId, current + 1);
};

const decreaseOnlineCount = (userId) => {
  const current = onlineSocketCounts.get(userId) || 0;
  if (current <= 1) {
    onlineSocketCounts.delete(userId);
    return;
  }
  onlineSocketCounts.set(userId, current - 1);
};

const isUserOnline = (userId) => {
  if (!userId) return false;
  return (onlineSocketCounts.get(String(userId)) || 0) > 0;
};

const canAccessSession = async (user, sessionId) => {
  if (!user || !sessionId) return false;

  if (user.role === 'tutor') {
    const ownedSession = await TutorSession.findOne({ _id: sessionId, tutor: user.id }).select('_id');
    return Boolean(ownedSession);
  }

  if (user.role === 'student') {
    const booking = await Appointment.findOne({
      tutorSession: sessionId,
      student: user.id,
      status: { $in: ['booked', 'completed'] }
    }).select('_id');
    return Boolean(booking);
  }

  return false;
};

const getSessionOnlineUserIds = async (sessionId) => {
  if (!ioInstance || !sessionId) return [];
  const sockets = await ioInstance.in(`session:${sessionId}`).fetchSockets();
  const userIds = new Set();
  sockets.forEach((socket) => {
    if (socket.user?.id) userIds.add(String(socket.user.id));
  });
  return Array.from(userIds);
};

const emitSessionPresence = async (sessionId) => {
  if (!ioInstance || !sessionId) return;

  const session = await TutorSession.findById(sessionId).select('tutor');
  if (!session) return;

  const onlineUserIds = await getSessionOnlineUserIds(sessionId);
  const tutorId = String(session.tutor);

  ioInstance.to(`session:${sessionId}`).emit('chat:presence', {
    sessionId: String(sessionId),
    tutorId,
    tutorOnline: onlineUserIds.includes(tutorId),
    activeUserIds: onlineUserIds
  });
};

const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: '*'
    }
  });

  setNotificationEmitter((recipientId, payload) => {
    ioInstance.to(`user:${recipientId}`).emit('notification:new', payload);
  });

  ioInstance.use((socket, next) => {
    try {
      const token = getUserIdFromToken(socket);
      if (!token) {
        return next(new Error('Unauthorized'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: String(decoded.id), role: decoded.role, name: decoded.name || '' };
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });

  ioInstance.on('connection', (socket) => {
    increaseOnlineCount(socket.user.id);
    socket.join(`user:${socket.user.id}`);

    socket.on('chat:join_session', async ({ sessionId }) => {
      if (!sessionId) return;
      const allowed = await canAccessSession(socket.user, sessionId);
      if (!allowed) {
        socket.emit('chat:error', { message: 'Unauthorized for this session chat' });
        return;
      }

      socket.join(`session:${sessionId}`);
      await emitSessionPresence(sessionId);
    });

    socket.on('chat:leave_session', async ({ sessionId }) => {
      if (!sessionId) return;
      socket.leave(`session:${sessionId}`);
      await emitSessionPresence(sessionId);
    });

    socket.on('chat:send_message', async ({ sessionId, text }) => {
      const messageText = String(text || '').trim();
      if (!sessionId || !messageText) return;

      const allowed = await canAccessSession(socket.user, sessionId);
      if (!allowed) {
        socket.emit('chat:error', { message: 'Unauthorized for this session chat' });
        return;
      }

      const created = await SessionChatMessage.create({
        session: sessionId,
        sender: socket.user.id,
        text: messageText,
        updatedAt: Date.now()
      });

      const populated = await SessionChatMessage.findById(created._id)
        .populate('sender', 'name role')
        .lean();

      ioInstance.to(`session:${sessionId}`).emit('chat:new_message', {
        _id: String(populated._id),
        session: String(populated.session),
        text: populated.text,
        sender: {
          _id: String(populated.sender?._id || ''),
          name: populated.sender?.name || 'User',
          role: populated.sender?.role || ''
        },
        editedAt: populated.editedAt,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt
      });

      const session = await TutorSession.findById(sessionId)
        .populate('subject', 'name')
        .populate('tutor', 'name')
        .lean();

      if (session) {
        const senderId = String(socket.user.id);
        const senderName = socket.user.name || populated.sender?.name || 'User';
        const subjectName = session.subject?.name || 'session';

        if (socket.user.role === 'tutor') {
          const bookings = await Appointment.find({ tutorSession: sessionId, status: 'booked' }).select('student');
          await Promise.all(bookings.map((booking) => {
            if (String(booking.student) === senderId) return null;
            return createNotification({
              recipient: booking.student,
              type: 'session_message',
              title: 'New message in session chat',
              message: `${senderName} sent a new message in ${subjectName}.`,
              link: '/appointments',
              metadata: { sessionId: String(sessionId) }
            });
          }));
        } else if (String(session.tutor?._id || session.tutor) !== senderId) {
          await createNotification({
            recipient: session.tutor?._id || session.tutor,
            type: 'session_message',
            title: 'New message in session chat',
            message: `${senderName} sent a new message in ${subjectName}.`,
            link: '/sessions',
            metadata: { sessionId: String(sessionId) }
          });
        }
      }
    });

    socket.on('disconnect', async () => {
      decreaseOnlineCount(socket.user.id);
      const roomNames = Array.from(socket.rooms).filter((room) => room.startsWith('session:'));
      await Promise.all(
        roomNames.map((roomName) => emitSessionPresence(roomName.replace('session:', '')))
      );
    });
  });

  return ioInstance;
};

const getIO = () => ioInstance;

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
  canAccessSession,
  getSessionOnlineUserIds,
  emitSessionPresence
};
