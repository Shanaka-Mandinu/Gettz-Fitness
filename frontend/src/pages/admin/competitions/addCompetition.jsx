import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, UploadCloud } from "lucide-react";
import meadiaUpload from "../../../utils/mediaUpload";

export default function CompetitionAdd() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function getTodayStr() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  async function handleSubmit() {
    if (
      !title.trim() ||
      !description.trim() ||
      !points ||
      !startDate ||
      !endDate
    ) {
      return toast.error("All fields are required");
    }

    if (points < 10) {
      return toast.error("Points must be at least 10");
    }

    // Validation: startDate >= today, endDate >= startDate
    const todayStr = getTodayStr();
    if (startDate < todayStr) {
      return toast.error("Start date cannot be before today");
    }
    if (endDate < startDate) {
      return toast.error("End date cannot be before start date");
    }

    try {
      setLoading(true);
      let imageUrl = "";

      if (imageFile) {
        imageUrl = await meadiaUpload(imageFile);
        if (!imageUrl) {
          return toast.error("Image upload failed");
        }
      }

      const token = localStorage.getItem("token");
      const payload = {
        title: title.trim(),
        description: description.trim(),
        points: Number(points),
        startDate,
        endDate,
        imageUrl,
      };

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/challenge/add`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Competition created successfully");
      navigate("/admin/competitions");
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create competition"
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
              <Trophy size={18} />
            </div>
            <div>
              <h1 className="font-semibold">Add Competition</h1>
              <p className="text-xs text-neutral-500">
                Create a new competition for members to join.
              </p>
            </div>
          </div>
          <Link
            to="/admin/competitions"
            className="text-sm text-[#e30613] hover:underline"
          >
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
              placeholder="Summer Fitness Challenge"
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-[#e30613]/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Complete daily workouts and earn points..."
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-[#e30613]/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Points</label>
            
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints((e.target.value < 0) ? 0 : e.target.value)}
              placeholder="100"
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
              
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                min={getTodayStr()}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate || getTodayStr()}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Competition Image
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 p-6 text-center hover:bg-black/5">
              <UploadCloud className="mb-2 text-[#e30613]" />
              <span className="text-sm">Click to upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setPreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
              />
            </label>
            {preview && (
              <div className="mt-3 w-full rounded-xl border border-black/10 overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
          <Link
            to="/admin/competitions"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-[#e30613] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save Competition"}
          </button>
        </div>
      </div>
    </div>
  );
}
