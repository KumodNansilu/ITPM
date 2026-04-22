const Notification = require('../models/Notification');

let notificationEmitter = null;

const setNotificationEmitter = (emitter) => {
  notificationEmitter = emitter;
};

const createNotification = async ({ recipient, type, title, message, link = '/dashboard', metadata = {} }) => {
  try {
    if (!recipient) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      link,
      metadata,
      updatedAt: Date.now()
    });

    const populated = await Notification.findById(notification._id)
      .populate('recipient', 'name email role')
      .lean();

    const payload = {
      _id: String(populated._id),
      recipient: String(populated.recipient?._id || recipient),
      type: populated.type,
      title: populated.title,
      message: populated.message,
      link: populated.link,
      metadata: populated.metadata || {},
      isRead: populated.isRead,
      createdAt: populated.createdAt,
      updatedAt: populated.updatedAt
    };

    if (notificationEmitter) {
      notificationEmitter(String(recipient), payload);
    }

    return payload;
  } catch (error) {
    console.error('Notification creation error:', error.message);
    return null;
  }
};

module.exports = { createNotification, setNotificationEmitter };
