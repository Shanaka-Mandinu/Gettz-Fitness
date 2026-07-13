import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import verifyJWT from './middleware/auth.js';
import userRouter from './routes/userRouter.js';
import customerRouter from './routes/customerSupporterRouter.js';
import trainerRouter from './routes/trainerRoute.js';
import adminRouter from './routes/adminRoute.js';
import loggingRouter from './routes/loggingRoute.js';
import equipmentManagerRouter from './routes/equipmentManagerRoute.js';
import subscriptionRouter from './routes/subscriptionRouter.js';
import planRouter from './routes/plansRouter.js';
import leaderboardRouter from './routes/leaderboardRouter.js'
import challengeRouter from './routes/challengeRouter.js'
import comPostRouter from './routes/comPostRouter.js'
import equipmentRouter from './routes/equipmentRoute.js';
import supplementRouter from './routes/supplementRoute.js';
import orderRouter from './routes/orderRoute.js';
import maintenanceLogsRouter from './routes/maintenanceLogsRoute.js';
import purchaseRouter from './routes/purchaseRoute.js';
import authRoutes from './routes/auth.js';
import videoRouter from './routes/videoRoute.js';
import paymentRouter from './routes/paymentRoute.js';
import cron from "node-cron";
import { expirePastEndDates } from "./jobs/expireSubscriptions.js";

import mealPlanRouter from './routes/mealPlanRoute.js';
import employeeSalaryRouter from './routes/employeeSalaryRoute.js';
import employeeSalaryRecordsRouter from './routes/employeeSalaryRecordsRoute.js';
import mealRequestRouter from './routes/mealRequestRouter.js';
import notificationRouter from './routes/notificationRouter.js';

import { googleLogin } from './controller/userController.js';
import sessionRouter from './routes/liveSessionRoute.js';
import webhookRoutes from './routes/webHookRoute.js';
import cardRouter from './routes/cardRouter.js';
import inqRouter from './routes/inquiryRoute.js';
import memberRoutes from "./routes/memberRoutes.js";
import { SerialPort, ReadlineParser } from "serialport";
import { createServer } from "http";
import { Server } from "socket.io";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import Member from "./model/memberModel.js";
import Attendance from "./model/attendanceModel.js";
import mealTemplateRouter from "./routes/mealTemplateRouter.js"
import feedbackRouter from "./routes/feedbackRoute.js"
import statsRouter from "./routes/statsRoute.js"
import revenueRouter from "./routes/revenueRoute.js"
import savedVideoRouter from "./routes/savedVideoRoute.js"
import savedMealTemplateRouter from "./routes/savedMealTemplateRoute.js";
import path from "path";
import initRFIDListener from "./serial/rfidListener.js"; 


dotenv.config();

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use((req, res, next) => {
  req.io = io;
  next();
});

mongoose.connect(process.env.MONGO_URL).then(
  () => { console.log('Connected to MongoDB'); }
).catch(
  ()=>{ console.error('Failed to connect to MongoDB'); }
)

// Every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    await expirePastEndDates();
  } catch (err) {
    console.error("Failed to expire subscriptions:", err);
  }
});
app.use(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

app.use(bodyParser.json());
app.use(verifyJWT);




app.use("/api/user",userRouter);
app.use("/api/customerSupporter", customerRouter);
app.use("/api/trainer", trainerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/logging",loggingRouter);
app.use("/api/equipmentManager",equipmentManagerRouter);


app.use("/api/mealPlan", mealPlanRouter);
app.use("/api/employeeSalary", employeeSalaryRouter);
app.use("/api/employeeSalarayRecords", employeeSalaryRecordsRouter);
app.use("/api/mealRequest", mealRequestRouter);
app.use("/api/mealTemplate",mealTemplateRouter);

app.use("/api/equipment",equipmentRouter);
app.use("/api/supplement",supplementRouter);
app.use("/api/order", orderRouter);
app.use("/api/purchase",purchaseRouter);
app.use("/api/maintenanceLogs",maintenanceLogsRouter);

app.use("/api/plan",planRouter);
app.use("/api/sub",subscriptionRouter);
app.use('/api/auth', authRoutes); 
app.use("/api/video",videoRouter);
app.use("/api/pay",paymentRouter);

app.use("/api/leaderboard", leaderboardRouter)
app.use("/api/challenge", challengeRouter)
app.use("/api/comfeed", comPostRouter)
app.use("/api/livesession", sessionRouter)
app.use("/api/card",cardRouter);

app.use("/api/inquiry",inqRouter);

app.use('/api/notification',notificationRouter)
app.use("/api/members", memberRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/feedback", feedbackRouter);
app.use("/api/stats", statsRouter);
app.use("/api/revenue", revenueRouter);
app.use("/api/saved-videos", savedVideoRouter);
app.use("/api/saved-meal-templates", savedMealTemplateRouter);

io.on("connection", (socket) => {
  console.log("🟢 Dashboard connected");
  socket.on("disconnect", () => console.log("🔴 Dashboard disconnected"));
});
if (process.env.ENABLE_RFID_LISTENER === "true") {
  initRFIDListener(io);
} else {
  console.log("RFID listener disabled");
}

app.post('/api/auth/google', googleLogin);

// Use httpServer instead of app for socket.io compatibility
const port = process.env.PORT || 3000;

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Socket.io server is ready');
});


app.post("/chatbot", async (req, res) => {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + process.env.GOOGLE_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});