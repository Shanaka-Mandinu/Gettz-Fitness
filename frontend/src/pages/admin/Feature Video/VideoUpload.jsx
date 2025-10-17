import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import meadiaUpload from "../../../utils/mediaUpload";
import {
  UploadCloud,
  Video as VideoIcon,
  Search,
  X as Close,
  Youtube,
} from "lucide-react";


export default function VideoUpload() {
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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [altNames, setAltNames] = useState("");
  const [tags, setTags] = useState("");
  const [duration, setDuration] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [category, setCategory] = useState("");
  const [workOutStep, setWorkOutStep] = useState([""]);

  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [ytOpen, setYtOpen] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytResults, setYtResults] = useState([]);

  // Form validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const navigate = useNavigate();
  const videoRef = useRef(null);


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

  const parseList = (s) =>
    s
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  // Validation functions
  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'Title is required';
        if (value.trim().length < 3) return 'Title must be at least 3 characters';
        if (value.trim().length > 100) return 'Title must be less than 100 characters';
        return '';
      case 'description':
        if (!value.trim()) return 'Description is required';
        if (value.trim().length < 10) return 'Description must be at least 10 characters';
        if (value.trim().length > 500) return 'Description must be less than 500 characters';
        return '';
      case 'category':
        if (!value) return 'Please select a category';
        return '';
      case 'duration':
        const durationNum = Number(value);
        if (isNaN(durationNum) || durationNum < 5) return 'Duration must be at least 5 seconds';
        if (durationNum > 3600) return 'Duration must be less than 1 hour';
        return '';
      case 'videoUrl':
        if (!value.trim() && !videoFile) return 'Please provide a video URL or upload a file';
        if (value.trim() && !isValidUrl(value.trim())) return 'Please enter a valid URL';
        return '';
      case 'videoFile':
        if (!value && !videoUrl.trim()) return 'Please upload a video file or provide a URL';
        return '';
      default:
        return '';
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleFieldChange = (name, value) => {
    // Update the field value
    switch (name) {
      case 'title':
        setTitle(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'category':
        setCategory(value);
        break;
      case 'duration':
        setDuration(value);
        break;
      case 'videoUrl':
        setVideoUrl(value);
        break;
      case 'videoFile':
        setVideoFile(value);
        break;
    }

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    const newTouched = {};

    // Validate all fields
    newErrors.title = validateField('title', title);
    newErrors.description = validateField('description', description);
    newErrors.category = validateField('category', category);
    newErrors.duration = validateField('duration', duration);
    newErrors.videoUrl = validateField('videoUrl', videoUrl);
    newErrors.videoFile = validateField('videoFile', videoFile);

    // Mark all fields as touched
    Object.keys(newErrors).forEach(key => {
      newTouched[key] = true;
    });

    setErrors(newErrors);
    setTouched(newTouched);

    return !Object.values(newErrors).some(error => error !== '');
  };

  async function handleSubmit() {
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      setLoading(true);

    
      let finalVideoUrl = videoUrl.trim();
      if (!finalVideoUrl) {
        if (!videoFile) {
          setLoading(false);
          return toast.error("Choose a video file or paste a YouTube URL");
        }
        const uploaded = await meadiaUpload(videoFile);
        finalVideoUrl = uploaded?.url || uploaded?.secure_url || uploaded;
        if (!finalVideoUrl) {
          setLoading(false);
          return toast.error("Upload service did not return a video URL");
        }
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

      const token = localStorage.getItem("token");

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/video/upload/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Video uploaded successfully");
      navigate("/admin/video");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }


  async function searchYouTube(e) {
    e?.preventDefault?.();
    if (!ytQuery.trim()) return;
    try {
      setYtLoading(true);
      const key = import.meta.env.VITE_YT_API_KEY;
      const { data } = await axios.get(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            key,
            part: "snippet",
            q: ytQuery.trim(),
            type: "video",
            maxResults: 12,
          },
        }
      );
      const items =
        data?.items?.map((it) => ({
          id: it?.id?.videoId,
          title: it?.snippet?.title,
          thumb:
            it?.snippet?.thumbnails?.medium?.url ||
            it?.snippet?.thumbnails?.default?.url,
          channel: it?.snippet?.channelTitle,
        })) || [];
      setYtResults(items);
    } catch (err) {
      console.error(err);
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

  return (
    <div className="w-full min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="w-full max-w-4xl rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden">
        
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e30613] text-white">
              <VideoIcon size={18} />
            </div>
            <div>
              <h1 className="font-semibold">Upload Training Video</h1>
              <p className="text-xs text-neutral-500">
                MP4/WebM or YouTube link — keep it short &amp; crisp.
              </p>
            </div>
          </div>
          <Link to="/admin/video" className="text-sm text-[#e30613] hover:underline">
            View all
          </Link>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
         
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Upper Body Workout – Beginner"
                className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  touched.title && errors.title 
                    ? 'border-red-500 focus:ring-red-500/30' 
                    : 'border-black/10 focus:ring-[#e30613]/30'
                }`}
              />
              {touched.title && errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Workout Steps</label>
              {workOutStep.map((step, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={step}
                    onChange={e => {
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
              <p className="mt-1 text-xs text-neutral-500">Add each step of the workout (optional).</p>
            </div>
            

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                rows={4}
                placeholder="Coach explains a 10-minute routine..."
                className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  touched.description && errors.description 
                    ? 'border-red-500 focus:ring-red-500/30' 
                    : 'border-black/10 focus:ring-[#e30613]/30'
                }`}
              />
              {touched.description && errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description}</p>
              )}
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Alt names (comma separated)
                </label>
                <input
                  value={altNames}
                  onChange={(e) => setAltNames(e.target.value)}
                  placeholder="Leg day, Push workout"
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tags (comma separated)
                </label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="legs, beginner, form"
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e30613]/30"
                />
              </div>

              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 ${
                    touched.category && errors.category 
                      ? 'border-red-500 focus:ring-red-500/30' 
                      : 'border-black/10 focus:ring-[#e30613]/30'
                  }`}
                >
                  <option value="" disabled>
                    Select a category…
                  </option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  
                </select>
                {touched.category && errors.category ? (
                  <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">
                    Choose the most relevant category for this video.
                  </p>
                )}
              </div>
            </div>

           
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Workout Duration (seconds)
                </label>
                <input
                  type="number"
                  min={5}
                  value={duration}
                  onChange={(e) => handleFieldChange('duration', e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    touched.duration && errors.duration 
                      ? 'border-red-500 focus:ring-red-500/30' 
                      : 'border-black/10 focus:ring-[#e30613]/30'
                  }`}
                />
                {touched.duration && errors.duration ? (
                  <p className="mt-1 text-xs text-red-600">{errors.duration}</p>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">
                    Auto-filled when you choose a file. Minimum 5 seconds.
                  </p>
                )}
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
                  Publish immediately
                </label>
              </div>
            </div>
          </div>

         
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Paste video URL (or pick YouTube)
              </label>
              <div className="flex gap-2">
                <input
                  value={videoUrl}
                  onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
                  placeholder="https://..."
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    touched.videoUrl && errors.videoUrl 
                      ? 'border-red-500 focus:ring-red-500/30' 
                      : 'border-black/10 focus:ring-[#e30613]/30'
                  }`}
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
              {touched.videoUrl && errors.videoUrl ? (
                <p className="mt-1 text-xs text-red-600">{errors.videoUrl}</p>
              ) : (
                <p className="mt-1 text-xs text-neutral-500">
                  If left blank, we'll upload the file below.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Or upload a video file
              </label>
              <label className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center hover:bg-black/5 ${
                touched.videoFile && errors.videoFile 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-black/20'
              }`}>
                <UploadCloud className="mb-2" />
                <span className="text-sm">Drag &amp; drop or click to choose</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFieldChange('videoFile', e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {touched.videoFile && errors.videoFile && (
                <p className="mt-1 text-xs text-red-600">{errors.videoFile}</p>
              )}

              {preview && (
                <div className="mt-3 w-full rounded-xl border border-black/10 overflow-hidden">
                  <video
                    ref={videoRef}
                    src={preview}
                    controls
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

       
        <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
          <Link
            to="/admin/video"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading || Object.values(errors).some(error => error !== '')}
            className="rounded-xl bg-[#e30613] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Uploading…" : "Save Video"}
          </button>
        </div>
      </div>

      
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

            <form
              onSubmit={searchYouTube}
              className="flex items-center gap-2 px-4 py-3 border-b"
            >
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
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
              {ytLoading && (
                <p className="text-sm text-neutral-500">Searching…</p>
              )}
              {!ytLoading &&
                ytResults.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => pickYouTube(v.id)}
                    className="text-left rounded-xl border border-black/10 hover:border-[#e30613] hover:bg-[#e30613]/5 overflow-hidden"
                  >
                    <img
                      src={v.thumb}
                      alt={v.title}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="p-2">
                      <p className="text-sm font-medium line-clamp-2">
                        {v.title}
                      </p>
                      <p className="text-xs text-neutral-500 line-clamp-1">
                        {v.channel}
                      </p>
                    </div>
                  </button>
                ))}
            </div>

            <div className="flex justify-end gap-2 border-t px-4 py-3">
              <button
                onClick={() => setYtOpen(false)}
                className="rounded-xl border border-black/10 px-3 py-2 text-sm hover:bg-black/5"
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
