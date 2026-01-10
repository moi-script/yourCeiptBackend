import express from "express";
import { getNotifications, markAsRead, markAllRead, createNotification } from "../controllers/notificationController.js";
// import { createNotification } from "../controllers/notificationController.js";
const notif = express.Router();

notif.post("/get", getNotifications);
notif.put("/read", markAsRead);
notif.put("/read-all", markAllRead);

notif.post("/post", createNotification);

export default notif;   