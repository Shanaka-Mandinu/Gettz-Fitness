import express from "express";

import {
  createPromotionalNotification,
  createNotificationForUser,
  deleteNotification,
  markAsRead,
  updateNotification,
  viewNotifications,
  getMyNotifications,
  filterNotifications
} from "../controller/notificatinController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", viewNotifications);
notificationRouter.get("/mine", getMyNotifications);
notificationRouter.post("/add",createPromotionalNotification);
notificationRouter.post("/addOne", createNotificationForUser); 
notificationRouter.put("/update/:id", updateNotification);
notificationRouter.delete("/delete/:id", deleteNotification);
notificationRouter.put("/markasread", markAsRead);
notificationRouter.get("/filter", filterNotifications)

export default notificationRouter;
