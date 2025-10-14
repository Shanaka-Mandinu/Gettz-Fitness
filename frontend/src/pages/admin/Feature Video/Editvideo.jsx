import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import meadiaUpload from "../../../utils/mediaUpload";
import {
  Save,
  ArrowLeft,
  UploadCloud,
  Youtube,
  Search,
  X as Close,
  Video as VideoIcon,
} from "lucide-react";

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

const parseList = (s) => (s || "").split(",").map((t) => t.trim()).filter(Boolean);
const joinList = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");

export default function EditVideo() {
  const CATEGORIES = [
    "Strength",
    "Cardio",
    "Mobility",
    "Yoga",
    "HIIT",
    "Warm-up",
    "Cooldown",
    "Technique",
  ];
  const { videoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [altNames, setAltNames] = useState("");
  const [tags, setTags] = useState("");
  const [duration, setDuration] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [category, setCategory] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [workOutStep, setWorkOutStep] = useState([""]);

  const [loading, setLoading] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(true);

  const [ytOpen, setYtOpen] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytResults, setYtResults] = useState([]);

  const videoRef = useRef(null);

  // 🧩 Handle local preview file
  useEffect(() => {
    if (!videoFile) return;
    const objectURL = URL.createObjectURL(videoFile);
    setPreview(objectURL);

    const temp = document.createElement("video");
    temp.preload = "metadata";
    temp.src = objectURL;
    temp.onloadedmetadata = () => {
      const d = Math.round(temp.duration || 0);
      if (!Number.isNaN(d)) setDuration(d);
      URL.revokeObjectURL(objectURL);
    };
    temp.onerror = () => URL.revokeObjectURL(objectURL);
  }, [videoFile]);

  // 🧩 Fetch video data
  useEffect(() => {
    let cancelled = false;

    async function hydrateFromApi() {
      try {
        setLoadingVideo(true);
        const detailUrl = `${import.meta.env.VITE_BACKEND_URL}/api/video/${videoId}`;
        let data;
        try {
          const res = await axios.get(detailUrl);
          data = res?.data;
        } catch (e) {
          const all = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/video`);
          data = (all?.data || []).find((v) => v.videoId === videoId);
          if (!data) throw e;
        }
        if (cancelled) return;

        setTitle(data?.title || "");
        setDescription(data?.description || "");
        setAltNames(joinList(data?.altNames));
        setTags(joinList(data?.tags));
        setDuration(Number(data?.duration) || 0);
        // ✅ Ensure absolute URL
        const finalUrl = data?.videoUrl?.startsWith("http")
          ? data.videoUrl
          : `${import.meta.env.VITE_BACKEND_URL}${data?.videoUrl || ""}`;
        setVideoUrl(finalUrl);
        setIsPublished(Boolean(data?.isPublished));
        setCategory(data?.category || "");
        setWorkOutStep(Array.isArray(data?.workOutStep) && data.workOutStep.length > 0 ? data.workOutStep : [""]);
      } catch (err) {
        toast.error(`Failed to load video: ${getAxiosError(err)}`);
        navigate("/admin/video");
      } finally {
        if (!cancelled) setLoadingVideo(false);
      }
    }

    const s = location.state;
    if (s && typeof s === "object") {
      setTitle(s.title || "");
      setDescription(s.description || "");
      setAltNames(joinList(s.altNames));
      setTags(joinList(s.tags));
      setDuration(Number(s.duration) || 0);
      const finalUrl = s?.videoUrl?.startsWith("http")
        ? s.videoUrl
        : `${import.meta.env.VITE_BACKEND_URL}${s?.videoUrl || ""}`;
      setVideoUrl(finalUrl);
      setIsPublished(Boolean(s.isPublished));
      setCategory(s.category || "");
      setWorkOutStep(Array.isArray(s.workOutStep) && s.workOutStep.length > 0 ? s.workOutStep : [""]);
      setLoadingVideo(false);
    } else {
      hydrateFromApi();
    }

    return () => {
      cancelled = true;
    };
  }, [location.state, videoId, navigate]);

  // 🧩 Save updates
  async function handleSave() {
    if (!title.trim()) return toast.error("Title is required");
    if (!description.trim()) return toast.error("Description is required");
    if (!category) return toast.error("Please pick a category");

    try {
      setLoading(true);

      let finalVideoUrl = (videoUrl || "").trim();
      if (videoFile) {
        const uploaded = await meadiaUpload(videoFile);
        finalVideoUrl = uploaded?.url || uploaded?.secure_url || uploaded;
        if (!finalVideoUrl) return toast.error("Upload service did not return a video URL");
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        altNames: parseList(altNames),
        tags: parseList(tags),
        duration: Number(duration) || 0,
        videoUrl: finalVideoUrl,
        isPublished,
        category,
        workOutStep: workOutStep.filter(Boolean),
      };

      const token = localStorage.getItem("token") || localStorage.getItem("jwt");
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/video/update/${videoId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Video updated");
      navigate("/admin/video");
    } catch (err) {
      toast.error(`Update failed: ${getAxiosError(err)}`);
    } finally {
      setLoading(false);
    }
  }

  // 🧩 YouTube search + selection
  async function searchYouTube(e) {
    e?.preventDefault?.();
    if (!ytQuery.trim()) return;
    try {
      setYtLoading(true);
      const key = import.meta.env.VITE_YT_API_KEY;
      const { data } = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: { key, part: "snippet", q: ytQuery.trim(), type: "video", maxResults: 12 },
      });
      const items =
        (data?.items || []).map((it) => ({
          id: it?.id?.videoId,
          title: it?.snippet?.title,
          thumb:
            it?.snippet?.thumbnails?.medium?.url ||
            it?.snippet?.thumbnails?.default?.url,
          channel: it?.snippet?.channelTitle,
        })) || [];
      setYtResults(items);
    } catch {
      toast.error("YouTube search failed");
    } finally {
      setYtLoading(false);
    }
  }

  function pickYouTube(id) {
    setVideoUrl(`https://www.youtube.com/watch?v=${id}`);
    setYtOpen(false);
    toast.success("YouTube video selected");
  }

  if (loadingVideo) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-neutral-500">Loading video…</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="w-full max-w-6xl rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e30613] text-white">
              <VideoIcon size={18} />
            </div>
            <div>
              <h1 className="font-semibold">Edit Video</h1>
              <p className="text-xs text-neutral-500">ID: {videoId}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <Link
            to="/admin/video"
            className="inline-flex items-center gap-1 text-sm text-[#e30613] hover:underline"
          >
            <ArrowLeft size={14} />
            Back to list
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* LEFT SIDE */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Workout Steps</label>
              {workOutStep.map((step, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => {
                      const arr = [...workOutStep];
                      arr[idx] = e.target.value;
                      setWorkOutStep(arr);
                    }}
                    placeholder={`Step ${idx + 1}`}
                    className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setWorkOutStep(workOutStep.filter((_, i) => i !== idx))}
                    className="rounded bg-gray-100 px-2 text-gray-500 hover:bg-red-100"
                    disabled={workOutStep.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setWorkOutStep([...workOutStep, ""])}
                className="mt-1 rounded bg-[#e30613] px-3 py-1 text-white text-xs hover:opacity-90"
              >
                + Add Step
              </button>
              <p className="mt-1 text-xs text-neutral-500">
                Add each step of the workout (optional).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                placeholder="Leg press tutorial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                placeholder="Coach explains correct leg press form..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Alt names</label>
                <input
                  value={altNames}
                  onChange={(e) => setAltNames(e.target.value)}
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                  placeholder="Leg day, Muscle gain"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                  placeholder="legs, beginner, form"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
                <input
                  type="number"
                  min={0}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  id="isPublished"
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-black/20"
                />
                <label htmlFor="isPublished" className="text-sm">
                  Published
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Video URL (or pick YouTube)
              </label>
              <div className="flex gap-2">
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
                <button
                  type="button"
                  onClick={() => setYtOpen(true)}
                  className="inline-flex items-center gap-1 rounded-xl border border-black/15 px-3 py-2 text-sm hover:bg-black/5"
                >
                  <Youtube size={16} />
                  Pick
                </button>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                If you choose a new file below, we’ll replace this URL with the uploaded file URL.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Or choose a new video file
              </label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 p-6 text-center hover:bg-black/5">
                <UploadCloud className="mb-2" />
                <span className="text-sm">Drag & drop or click to choose</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              {(preview || videoUrl) && (
                <div className="mt-3 w-full rounded-xl border border-black/10 overflow-hidden">
                  {/* ✅ Detect YouTube link */}
                  {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                    <iframe
                      src={videoUrl.replace("watch?v=", "embed/")}
                      title="YouTube video player"
                      className="w-full h-72"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video
                      ref={videoRef}
                      src={preview || videoUrl}
                      controls
                      className="w-full h-72 object-cover"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
          <Link
            to="/admin/video"
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

      {/* YouTube modal */}
      {ytOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Youtube className="text-[#e30613]" />
                <h3 className="font-semibold">Pick from YouTube</h3>
              </div>
              <button
                onClick={() => setYtOpen(false)}
                className="rounded-lg p-1 hover:bg-black/5"
              >
                <Close />
              </button>
            </div>

            <form onSubmit={searchYouTube} className="flex items-center gap-2 px-4 py-3 border-b">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  value={ytQuery}
                  onChange={(e) => setYtQuery(e.target.value)}
                  placeholder="Search workouts, exercises, coaches…"
                  className="w-full rounded-xl border border-black/10 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-[#e30613] px-3 py-2 text-sm font-medium text-white hover:opacity-95"
              >
                Search
              </button>
            </form>

            <div className="max-h-[60vh] overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ytLoading && <p className="text-sm text-neutral-500">Searching…</p>}
              {!ytLoading &&
                ytResults.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => pickYouTube(v.id)}
                    className="text-left rounded-xl border border-black/10 hover:border-[#e30613] hover:bg-[#e30613]/5 overflow-hidden"
                  >
                    <img src={v.thumb} alt={v.title} className="w-full aspect-video object-cover" />
                    <div className="p-2">
                      <p className="text-sm font-medium line-clamp-2">{v.title}</p>
                      <p className="text-xs text-neutral-500 line-clamp-1">{v.channel}</p>
                    </div>
                  </button>
                ))}
            </div>

            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button
                onClick={() => setYtOpen(false)}
                className="rounded-xl border border-black/10 px-3 py-2 text-sm hover:bg-black/5 "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
