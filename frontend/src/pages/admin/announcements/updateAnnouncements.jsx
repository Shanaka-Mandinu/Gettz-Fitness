import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Megaphone } from "lucide-react";

function getAxiosError(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || "Unknown error";
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors)) {
    return data.errors.map((e) => e.msg || e.message || JSON.stringify(e)).join(", ");
  }
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export default function EditAnnouncement() {
  const { annId } = useParams(); // expects route: /admin/announcements/edit/:annId
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("promotional");
  const [loading, setLoading] = useState(false);
  const [loadingAnn, setLoadingAnn] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromApi() {
      try {
        setLoadingAnn(true);

        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/notification`);
        const data = (res?.data || []).find(
            (a) => a._id === annId || a.notificationId === annId
        );


        if (!data) throw new Error("Announcement not found");
        if (cancelled) return;

        setTitle(data.title || "");
        setBody(data.body || "");
        setType(data.type || "promotional");
      } catch (err) {
        toast.error(`Failed to load announcement: ${getAxiosError(err)}`);
        navigate("/admin/announcements");
      } finally {
        if (!cancelled) setLoadingAnn(false);
      }
    }

    hydrateFromApi();
    return () => {
      cancelled = true;
    };
  }, [annId, navigate]);

  async function handleSave() {
    if (!title.trim()) return toast.error("Title is required");
    if (!body.trim()) return toast.error("Body is required");

    try {
      setLoading(true);
      const payload = { title: title.trim(), body: body.trim(), type };
      const token = localStorage.getItem("token") || localStorage.getItem("jwt");


      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/notification/update/${annId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Announcement updated");
      navigate("/admin/announcements");
    } catch (err) {
      toast.error(`Update failed: ${getAxiosError(err)}`);
    } finally {
      setLoading(false);
    }
  }

  if (loadingAnn) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-neutral-500">Loading announcement…</p>
      </div>
    );
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
              <h1 className="font-semibold">Edit Announcement</h1>
              <p className="text-xs text-neutral-500">ID: {annId}</p>
            </div>
          </div>
          <Link
            to="/admin/announcements"
            className="inline-flex items-center gap-1 text-sm text-[#e30613] hover:underline"
          >
            <ArrowLeft size={14} />
            Back to list
          </Link>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
              placeholder="Announcement title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
              placeholder="Announcement body"
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
          <Link
            to="/admin/announcements"
            className="inline-flex items-center gap-1 rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
          >
            <ArrowLeft size={14} />
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e30613] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
