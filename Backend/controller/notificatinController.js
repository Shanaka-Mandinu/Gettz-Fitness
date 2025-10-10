import mongoose from 'mongoose';
import Notification from '../model/notification.js';
import UserNotification from '../model/userNotification.js';
import User from '../model/user.js';

export function viewNotifications(req, res) {
  Notification.find().sort({ sentDate: -1 })
    .then((notifi) => res.json(notifi))
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: 'Notification loading failed' });
    });
}

export async function getMyNotifications(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    //if (req.user.role !== 'member') return res.status(403);
    
    const userId =
      typeof req.user._id === 'string'
        ? new mongoose.Types.ObjectId(req.user._id)
        : req.user._id;

    const rows = await UserNotification.aggregate([
      { $match: { user_id: userId } },
      {
        $lookup: {
          from: 'notifications',
          localField: 'NIC',
          foreignField: '_id',
          as: 'notification'
        }
      },
      { $unwind: '$notification' },
      {
        $project: {
          _id: 1,
          isRead: 1,
          createdAt: 1,
          'notification._id': 1,
          'notification.title': 1,
          'notification.body': 1,
          'notification.type': 1,
          'notification.sentDate': 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    const data = rows.map(r => ({
      id: r._id,               
      title: r.notification.title,
      body: r.notification.body,
      type: r.notification.type,
      createdAt: r.notification.sentDate || r.createdAt,
      isRead: r.isRead
    }));

    res.json(data);
  } catch (e) {
    console.error('getMyNotifications error:', e);
    res.status(500).json({ message: 'Failed to load notifications', error: e.message });
  }
}

export async function createPromotionalNotification(req, res) {
  try {
    const { title, body, type = "promotional" } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: "Please provide title and body." });
    }

    // Get admin name from req.user (adjust as needed)
    const adminName = req.user?.firstName && req.user?.lastName
      ? req.user.firstName + ' ' + req.user.lastName
      : req.user?.name || req.user?.username || 'Admin';

    const notification = new Notification({
      title,
      body,
      type,
      status: "sent",
      deliveryTo: "All Members",
      sentDate: new Date(),
      createdBy: adminName,
    });

    await notification.save();

    const members = await User.find({ role: { $in: ["user", "member"] } });
    const bulk = members.map((m) => ({
      insertOne: {
        document: { NIC: notification._id, user_id: m._id, isRead: false },
      },
    }));
    if (bulk.length) await UserNotification.bulkWrite(bulk);

    res.status(201).json({
      message: "Notification created and attached to all members",
      notificationId: notification._id,
      affectedMembers: members.length,
    });
  } catch (error) {
    console.error("createPromotionalNotification error:", error);
    res.status(500).json({ message: "Internal server error.", error: error.message });
  }
}

export async function createNotificationForUser(req, res) {
  try {
    const { title, body, type, userId, deliveryTo } = req.body;
    if (!title || !body || !userId || !type) {
      return res.status(400).json({ message: 'title, body, userId, and type are required' });
    }
    // Get user name for deliveryTo
    let userName = deliveryTo;
    if (!userName) {
      const user = await User.findById(userId);
      userName = user ? (user.firstName + ' ' + user.lastName) : userId;
    }
    // Get admin name
    const adminName = req.user?.firstName && req.user?.lastName
      ? req.user.firstName + ' ' + req.user.lastName
      : req.user?.name || req.user?.username || 'Admin';

    const notification = new Notification({
      title,
      body,
      type,
      status: 'sent',
      deliveryTo: userName,
      sentDate: new Date(),
      createdBy: adminName
    });
    await notification.save();

    await new UserNotification({ NIC: notification._id, user_id: userId }).save();

    res.status(201).json({ message: 'Notification created for user', notificationId: notification._id });
  } catch (e) {
    console.error('createNotificationForUser error:', e);
    res.status(500).json({ message: 'Internal server error', error: e.message });
  }
}


export function updateNotification(req, res) {
  const id = req.params.id;

  Notification.findOneAndUpdate(
    { $or: [{ _id: id }, { notificationID: id }] }, 
    req.body,
    { new: true }
  )
    .then((notifi) => {
      if (!notifi) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification Updated Successfully", notifi });
    })
    .catch((err) => {
      console.error("Notification update failed:", err);
      res.status(500).json({ message: "Notification update failed" });
    });
}


export function deleteNotification(req, res) {
  Notification.findOneAndDelete({ _id: req.params.id })
    .then(() => res.json({ message: 'Notification was Deleted' }))
    .catch(() => res.status(500).json({ message: 'Notification deletion failed' }));
}


export async function markAsRead(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    const userId =
      typeof req.user._id === 'string'
        ? new mongoose.Types.ObjectId(req.user._id)
        : req.user._id;

    const result = await UserNotification.updateMany(
      { user_id: userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, modified: result.modifiedCount ?? result.nModified ?? 0 });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
