import Leaderboard from "../model/leaderboard.js";
import User from "../model/user.js";

export async function viewLeaderboard(req, res) {
  try {
    // Primary: use Leaderboard collection if present
    const leaderboard = await Leaderboard.find({})
      .maxTimeMS(5000)
      .populate("user_id", "firstName lastName createdAt point")
      .lean();

    let sorted = leaderboard
      .filter((row) => row.user_id) // drop nulls
      .sort((a, b) => (b.user_id.point || 0) - (a.user_id.point || 0));

    // Fallback: if no leaderboard entries exist, compute from Users directly
    if (!sorted || sorted.length === 0) {
      const users = await User.find({}, "firstName lastName createdAt point")
        .maxTimeMS(5000)
        .sort({ point: -1 })
        .lean();

      sorted = users.map((u) => ({ _id: u._id, user_id: u }));
    }

    res.json(sorted);
  } catch (err) {
    console.error("viewLeaderboard error:", err);
    res.status(500).json({ message: "Leaderboard not found!" });
  }
}
