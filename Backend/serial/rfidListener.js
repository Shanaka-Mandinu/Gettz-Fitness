// rfidListener.js
import { SerialPort, ReadlineParser } from "serialport";
import User from "../model/user.js";                       // users collection
import Member from "../model/memberModel.js";             // optional mapping model (if you have it)
import Subscription from "../model/Subscription_Model.js";
import Attendance from "../model/attendanceModel.js";

export default function initRFIDListener(io) {
  const port = new SerialPort({ path: "COM5", baudRate: 9600 });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

  parser.on("data", async (raw) => {
    const line = String(raw || "").trim();
    if (!line) return;

    // Accept either:
    // 1) "SEND UID|USERID"  (from Arduino write-mode)
    // 2) "UID"              (if Arduino only sends UID)
    let uid = "";
    let suppliedUserId = "";

    if (line.startsWith("SEND ")) {
      const payload = line.substring(5);
      const parts = payload.split("|").map(p => p.trim());
      uid = (parts[0] || "").toUpperCase();
      suppliedUserId = parts[1] || "";
    } else {
      // Accept plain UID
      uid = line.toUpperCase();
    }

    if (!uid) return;
    console.log(`📡 Scanned Card: UID=${uid} | suppliedUserId=${suppliedUserId}`);

    try {
      // 1) Try to find user by UID mapping in the DB (preferred)
      //    your members/users collection may hold the mapping field 'rfid'
      let user = await User.findOne({ rfid: uid });      // common pattern
      if (!user) {
        // If you have a separate Member model (mapping table), try it:
        const memberMap = await Member.findOne({ rfid: uid });
        if (memberMap && memberMap.user_id) {
          user = await User.findById(memberMap.user_id);
        }
      }

      // 2) If still not found, but Arduino supplied a userId use that as fallback
      if (!user && suppliedUserId) {
        user = await User.findById(suppliedUserId).lean();
        if (!user) {
          console.log("❌ Supplied userId not found in DB");
        }
      }

      if (!user) {
        console.log("❌ Unknown member (no mapping found)");
        port.write("UNKNOWN\n");
        return;
      }

      // resolved user id to use for attendance checks
      const userId = String(user._id);
      console.log("Resolved userId:", userId, "user:", user.firstName || user.email || user._id);

      // 3) Check active subscription for that user
      const subscription = await Subscription.findOne({
        user_id: userId,
        status: "active",
      }).sort({ end_date: -1 });

      if (!subscription) {
        console.log("⚠️ No active subscription for user:", userId);
        port.write("INACTIVE\n");
        return;
      }
      if (subscription.end_date && subscription.end_date < new Date()) {
        console.log("⚠️ Subscription expired:", subscription.end_date);
        port.write("EXPIRED\n");
        return;
      }

      // 4) Only one attendance per user per day (use userId, not card UID)
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const already = await Attendance.findOne({
        userId: userId,
        time: { $gte: start, $lte: end },
      });

      if (already) {
        console.log("⚠️ Already attended today for user:", userId);
        port.write("ALREADY\n"); // you can use INACTIVE as well
        return;
      }

      // 5) Save attendance
      const record = await Attendance.create({
        rfid: uid,
        memberName: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user.name || user.email || ""),
        userId: userId,
        time: new Date(),
      });

      console.log("✅ Attendance saved for:", record.memberName || userId);

      // 6) Emit realtime event and respond to Arduino
      io.emit("attendanceUpdate", {
        rfid: uid,
        userId,
        memberName: record.memberName,
        time: record.time,
      });

      port.write("ACTIVE\n");
    } catch (err) {
      console.error("❌ RFID handler error:", err);
      try { port.write("ERROR\n"); } catch (e) {}
    }
  });

  port.on("open", () => console.log("🔌 SerialPort connected to Arduino"));
  port.on("error", (err) => console.error("❌ SerialPort error:", err.message));
}
