import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { Megaphone } from "lucide-react";

export default function AnnouncementAdd() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("promotional");
  const [targetUser, setTargetUser] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) {
      return toast.error("Title and body are required");
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const payload = { title: title.trim(), body: body.trim(), type };

      let url = `${import.meta.env.VITE_BACKEND_URL}/api/notification/add`;

      if (targetUser.trim()) {
        payload.userId = targetUser.trim();
        url = `${import.meta.env.VITE_BACKEND_URL}/api/notification/addOne`;
      }

      await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Announcement created successfully");
      navigate("/admin/announcements");
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to create announcement"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-2xl border border-black/10 bg-white shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e30613] text-white">
              <Megaphone size={18} />
            </div>
            <div>
              <h1 className="font-semibold">Add Announcement</h1>
              <p className="text-xs text-neutral-500">
                Send a message to all members or a specific user.
              </p>
            </div>
          </div>
          <Link to="/admin/announcements" className="text-sm text-[#e30613] hover:underline">
            View all
          </Link>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New Gym Schedule"
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-[#e30613]/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="We have updated our workout schedule for next week..."
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-[#e30613]/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            >
              <option value="promotional">Promotional</option>
              <option value="warning">Warning</option>
              <option value="alert">Alert</option>
            </select>
          </div>

          {/* <div>
            <label className="block text-sm font-medium mb-1">
              Target User (optional, leave empty for all members)
            </label>
            <input
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="Enter userId"
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
          </div> */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
          <Link to="/admin/announcements" className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5">
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-[#e30613] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send Announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}
