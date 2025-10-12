import Attendance from "../model/attendanceModel.js";
import Subscription from "../model/Subscription_Model.js";
import Member from "../model/memberModel.js"; // simple table { rfid, user_id, name }

export const markAttendance = async (req, res) => {
  try {
    const { rfid, userIdFromCard } = req.body; // Arduino sends both UID + user_id read from block


    const member = await Member.findOne({ rfid, user_id: userIdFromCard });
    if (!member)
      return res.status(404).json({ message: "RFID not linked to this user" });

   
    const subscription = await Subscription.findOne({
      user_id: userIdFromCard,
      status: "active",
    }).sort({ end_date: -1 });

    if (!subscription)
      return res.status(403).json({ message: "No active subscription found" });


    const now = new Date();
    if (subscription.end_date < now)
      return res.status(403).json({ message: "Subscription expired" });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const already = await Attendance.findOne({
      rfid,
      time: { $gte: startOfDay, $lte: endOfDay },
    });
    if (already)
      return res.status(400).json({ message: "Already attended today" });

   
    const record = await Attendance.create({
      rfid,
      memberName: member.name,
      time: new Date(),
    });

    req.io.emit("attendanceUpdate", {
      rfid,
      memberName: member.name,
    });


    res.json({
      status: "ACTIVE",
      message: "Attendance marked",
      record,
      user_id: userIdFromCard,
    });
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(500).json({ error: err.message });
  }
};


export const getAttendance = async (req, res) => {
  try {
    const records = await Attendance.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
