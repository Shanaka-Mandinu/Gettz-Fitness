import express from "express";
import { markAttendance, getAttendance, getUserAttendance } from "../controller/attendanceController.js";
import  verifyJWT from "../middleware/auth.js";

const router = express.Router();

router.post("/mark", markAttendance);
router.get("/allAtend", getAttendance);
router.get("/user/:userId", verifyJWT, getUserAttendance);

export default router;
