// Backend: /Backend/serial/rfidListener.js
import { SerialPort, ReadlineParser } from "serialport";
import User from "../model/user.js";
import Subscription from "../model/Subscription_Model.js";
import Attendance from "../model/attendanceModel.js";

export default function initRFIDListener(io) {
  const port = new SerialPort({ path: "COM5", baudRate: 9600 });
  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

  parser.on("data", async (raw) => {
    const line = String(raw || "").trim();
    if (!line || !line.startsWith("SEND ")) return;

    const payload = line.substring(5);
    const [uid, userId] = payload.split("|").map((x) => x.trim());
    if (!uid || !userId) return;

    console.log(`📡 Scanned: UID=${uid} | user_id=${userId}`);

    try {
      const user = await User.findById(userId);
      if (!user) {
        console.log("❌ Unknown member");
        port.write("UNKNOWN\n");
        return;
      }

      // Check subscription
      const sub = await Subscription.findOne({ user_id: userId, status: "active" }).sort({ end_date: -1 });
      if (!sub) {
        console.log("⚠️ Inactive subscription");
        port.write("INACTIVE\n");
        return;
      }
      if (sub.end_date < new Date()) {
        console.log("⚠️ Subscription expired");
        port.write("EXPIRED\n");
        return;
      }

      // Prevent multiple entries
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);

      const already = await Attendance.findOne({ userId, time: { $gte: start, $lte: end } });
      if (already) {
        console.log("⚠️ Already attended today");
        port.write("ALREADY\n");
        return;
      }

      // Save attendance
      await Attendance.create({
        rfid: uid,
        userId,
        memberName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        time: new Date(),
      });

      console.log("✅ Attendance saved for:", user.firstName || user.email);
      io.emit("attendanceUpdate", { userId, rfid: uid, time: new Date() });
      port.write("ACTIVE\n");
    } catch (err) {
      console.error("❌ Error:", err.message);
      port.write("ERROR\n");
    }
  });

  port.on("open", () => console.log("🔌 Connected to Arduino"));
  port.on("error", (err) => console.error("❌ SerialPort error:", err.message));
}
