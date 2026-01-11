import chalk from "chalk";
import Notification from "../models/Notification.js";

// 1. GET: Fetch user's notifications
export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.body; // Or from req.user if using middleware
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20); // Limit to last 20
    
    // Count unread
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// 2. PUT: Mark as read
export const markAsRead = async (req, res) => {
  try {

    const { notificationId } = req.body;
    console.log(chalk.blue("Notification id :: " + notificationId));
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error updating status" });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error updating all" });
  }
};

export const createNotification = async (req, res) => {
    const {userId, title, message, type = 'info'} = req.body;

    try {
        await Notification.create({ userId, title, message, type });
        console.log(`Notification created for ${userId}: ${title}`);
    } catch (err) {
        console.error("Failed to create notification", err);
    }
}