const SessionChatMessage = require('../models/SessionChatMessage');
const TutorSession = require('../models/TutorSession');
const { canAccessSession, getSessionOnlineUserIds, getIO } = require('../services/socket');

exports.getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const allowed = await canAccessSession(req.user, sessionId);

    if (!allowed) {
      return res.status(403).json({ message: 'Unauthorized for this session chat' });
    }

    const messages = await SessionChatMessage.find({ session: sessionId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 })
      .limit(300)
      .lean();

    res.status(200).json(
      messages.map((message) => ({
        _id: String(message._id),
        session: String(message.session),
        text: message.text,
        sender: {
          _id: String(message.sender?._id || ''),
          name: message.sender?.name || 'User',
          role: message.sender?.role || ''
        },
        editedAt: message.editedAt,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const newText = String(text || '').trim();

    if (!newText) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await SessionChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (String(message.sender) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    const allowed = await canAccessSession(req.user, message.session);
    if (!allowed) {
      return res.status(403).json({ message: 'Unauthorized for this session chat' });
    }

    message.text = newText;
    message.editedAt = new Date();
    message.updatedAt = Date.now();
    await message.save();

    const populated = await SessionChatMessage.findById(message._id)
      .populate('sender', 'name role')
      .lean();

    const payload = {
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
    };

    const io = getIO();
    if (io) {
      io.to(`session:${String(populated.session)}`).emit('chat:message_updated', payload);
    }

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await SessionChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (String(message.sender) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    const allowed = await canAccessSession(req.user, message.session);
    if (!allowed) {
      return res.status(403).json({ message: 'Unauthorized for this session chat' });
    }

    const sessionId = String(message.session);
    await SessionChatMessage.findByIdAndDelete(messageId);

    const io = getIO();
    if (io) {
      io.to(`session:${sessionId}`).emit('chat:message_deleted', {
        messageId: String(messageId),
        sessionId
      });
    }

    res.status(200).json({
      message: 'Message deleted successfully',
      messageId: String(messageId)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSessionPresence = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const allowed = await canAccessSession(req.user, sessionId);

    if (!allowed) {
      return res.status(403).json({ message: 'Unauthorized for this session chat' });
    }

    const session = await TutorSession.findById(sessionId).select('tutor');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const activeUserIds = await getSessionOnlineUserIds(sessionId);

    res.status(200).json({
      sessionId: String(sessionId),
      tutorId: String(session.tutor),
      tutorOnline: activeUserIds.includes(String(session.tutor)),
      activeUserIds
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
