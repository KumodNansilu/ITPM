const Appointment = require('../models/Appointment');
const TutorSession = require('../models/TutorSession');
const User = require('../models/User');

// ========== STUDENT: Book a session from available tutor sessions ==========

// Get available tutor sessions (students can view)
exports.getAvailableSessions = async (req, res) => {
  try {
    const { subject, date, topic } = req.query;

    const filter = {
      isAvailable: true,
      status: 'scheduled',
      sessionDate: {
        $gte: new Date(date || new Date())
      }
    };

    if (subject) {
      filter.subject = subject;
    }
    if (topic) {
      filter.topic = topic;
    }

    const sessions = await TutorSession.find(filter)
      .populate('tutor', 'name email specialization phone')
      .populate('subject', 'name')
      .populate('topic', 'name')
      .sort({ sessionDate: 1 });

    // Add information about whether session is full
    const sessionsWithCapacity = await Promise.all(
      sessions.map(async (session) => {
        const bookedCount = await Appointment.countDocuments({
          tutorSession: session._id,
          status: 'booked'
        });

        return {
          ...session.toObject(),
          bookedCount,
          availableSlots: session.maxCapacity - bookedCount,
          isFull: bookedCount >= session.maxCapacity
        };
      })
    );

    res.status(200).json(sessionsWithCapacity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single session details
exports.getSessionDetails = async (req, res) => {
  try {
    const session = await TutorSession.findById(req.params.sessionId)
      .populate('tutor', 'name email specialization phone')
      .populate('subject', 'name')
      .populate('topic', 'name');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const bookedCount = await Appointment.countDocuments({
      tutorSession: session._id,
      status: 'booked'
    });

    res.status(200).json({
      ...session.toObject(),
      bookedCount,
      availableSlots: session.maxCapacity - bookedCount,
      isFull: bookedCount >= session.maxCapacity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student: Book a session
exports.bookSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const studentId = req.user.id;

    // Get the session
    const session = await TutorSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if session is available
    if (!session.isAvailable || session.status !== 'scheduled') {
      return res.status(400).json({ message: 'Session is not available' });
    }

    // Check student not already booked
    const existingBooking = await Appointment.findOne({
      tutorSession: sessionId,
      student: studentId,
      status: 'booked'
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'You already booked this session' });
    }

    // Check capacity
    const bookedCount = await Appointment.countDocuments({
      tutorSession: sessionId,
      status: 'booked'
    });

    if (bookedCount >= session.maxCapacity) {
      return res.status(400).json({
        message: 'Session is full',
        type: 'capacity_full',
        maxCapacity: session.maxCapacity,
        bookedCount
      });
    }

    // Create appointment
    const appointment = new Appointment({
      tutorSession: sessionId,
      student: studentId,
      tutor: session.tutor,
      subject: session.subject,
      topic: session.topic,
      scheduledDate: session.sessionDate,
      duration: session.duration,
      meetingLink: session.meetingLink,
      status: 'booked'
    });

    await appointment.save();

    // Update booked count
    session.bookedCount = bookedCount + 1;
    if (session.bookedCount >= session.maxCapacity) {
      session.isAvailable = false;
    }
    await session.save();

    res.status(201).json({
      message: 'Session booked successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's booked sessions
exports.getStudentSessions = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      student: req.user.id,
      status: 'booked'
    })
      .populate('tutor', 'name email phone specialization')
      .populate('subject', 'name')
      .populate('topic', 'name')
      .populate('tutorSession')
      .sort({ scheduledDate: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student: Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const studentId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (appointment.student.toString() !== studentId) {
      return res.status(403).json({ message: 'Unauthorized to cancel this appointment' });
    }

    // Check if can still cancel (e.g., not past session time)
    if (new Date() > new Date(appointment.scheduledDate)) {
      return res.status(400).json({ message: 'Cannot cancel past sessions' });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    appointment.updatedAt = Date.now();
    await appointment.save();

    // Update session capacity
    const session = await TutorSession.findById(appointment.tutorSession);
    if (session) {
      session.bookedCount = Math.max(0, session.bookedCount - 1);
      session.isAvailable = true; // Re-open if was full
      await session.save();
    }

    res.status(200).json({
      message: 'Booking cancelled successfully',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========== TUTOR: Create and manage sessions ==========

// Tutor: Create new session
exports.createSession = async (req, res) => {
  try {
    const { subject, topic, sessionDate, duration, maxCapacity, meetingLink, description } = req.body;
    const tutorId = req.user.id || req.user._id;

    if (!subject || !sessionDate || !maxCapacity) {
      return res.status(400).json({ message: 'Subject, date, and capacity are required' });
    }

    const sessionData = {
      tutor: tutorId,
      subject,
      sessionDate,
      duration: duration || 60,
      maxCapacity
    };

    // Only add optional fields if provided
    if (topic) sessionData.topic = topic;
    if (meetingLink) sessionData.meetingLink = meetingLink;
    if (description) sessionData.description = description;

    const session = new TutorSession(sessionData);
    await session.save();

    const populatedSession = await TutorSession.findById(session._id)
      .populate('subject', 'name')
      .populate('topic', 'name');

    res.status(201).json({
      message: 'Session created successfully',
      session: populatedSession
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Tutor: Get all their sessions
exports.getTutorSessions = async (req, res) => {
  try {
    const sessions = await TutorSession.find({ tutor: req.user.id })
      .populate('subject', 'name')
      .populate('topic', 'name')
      .sort({ sessionDate: 1 });

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tutor: Get single session with student list
exports.getSessionWithStudents = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await TutorSession.findById(sessionId)
      .populate('subject', 'name')
      .populate('topic', 'name');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check tutor owns this session
    if (session.tutor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get all booked students
    const bookings = await Appointment.find({
      tutorSession: sessionId,
      status: 'booked'
    }).populate('student', 'name email phone university');

    res.status(200).json({
      session,
      bookings,
      bookedCount: bookings.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tutor: Update session
exports.updateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sessionDate, maxCapacity, meetingLink, description, status } = req.body;

    const session = await TutorSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check authorization
    if (session.tutor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Cannot reduce capacity below already booked count
    if (maxCapacity && maxCapacity < session.bookedCount) {
      return res.status(400).json({
        message: `Cannot reduce capacity below ${session.bookedCount} (current bookings)`
      });
    }

    if (sessionDate) session.sessionDate = sessionDate;
    if (maxCapacity !== undefined) {
      session.maxCapacity = maxCapacity;
      session.isAvailable = session.bookedCount < maxCapacity;
    }
    if (meetingLink) session.meetingLink = meetingLink;
    if (description) session.description = description;
    if (status) session.status = status;

    session.updatedAt = Date.now();
    await session.save();

    res.status(200).json({
      message: 'Session updated successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tutor: Cancel session (cascades to all bookings)
exports.cancelSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await TutorSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check authorization
    if (session.tutor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Cancel all bookings for this session
    await Appointment.updateMany(
      { tutorSession: sessionId, status: 'booked' },
      { status: 'cancelled' }
    );

    // Mark session as cancelled
    session.status = 'cancelled';
    session.isAvailable = false;
    session.updatedAt = Date.now();
    await session.save();

    res.status(200).json({
      message: 'Session cancelled successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tutor: Mark session completed
exports.completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await TutorSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check authorization
    if (session.tutor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    session.status = 'completed';
    session.isAvailable = false;
    session.updatedAt = Date.now();
    await session.save();

    // Mark all bookings as completed
    await Appointment.updateMany(
      { tutorSession: sessionId, status: 'booked' },
      { status: 'completed' }
    );

    res.status(200).json({
      message: 'Session marked as completed',
      session
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tutor: Remove a student from session
exports.removeStudentFromSession = async (req, res) => {
  try {
    const { sessionId, appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check authorization
    if (appointment.tutor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update appointment
    appointment.status = 'cancelled';
    await appointment.save();

    // Update session capacity
    const session = await TutorSession.findById(sessionId);
    if (session) {
      session.bookedCount = Math.max(0, session.bookedCount - 1);
      session.isAvailable = true;
      await session.save();
    }

    res.status(200).json({
      message: 'Student removed from session',
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tutor: Reschedule session
exports.rescheduleSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { newDate } = req.body;

    if (!newDate) {
      return res.status(400).json({ message: 'New date is required' });
    }

    const session = await TutorSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check authorization
    if (session.tutor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const oldDate = session.sessionDate;
    session.sessionDate = newDate;
    session.updatedAt = Date.now();
    await session.save();

    // Update all appointments
    await Appointment.updateMany(
      { tutorSession: sessionId },
      { scheduledDate: newDate }
    );

    res.status(200).json({
      message: 'Session rescheduled successfully',
      session,
      oldDate,
      newDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
