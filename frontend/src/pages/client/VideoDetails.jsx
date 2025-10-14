import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  ArrowLeft, 
  Heart, 
  Eye, 
  AlertTriangle, 
  Share2, 
  Clock, 
  Play, 
  Calendar,
  User,
  ThumbsUp,
  MessageCircle,
  Bookmark,
  ExternalLink
} from "lucide-react";
import Header from "../../components/header";


const RAW_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API_BASE = RAW_BASE.replace(/\/+$/, "");

const endpoints = {
  getOne: (id) => `${API_BASE}/api/video/${id}`,
  addView: (id) => `${API_BASE}/api/video/${id}/view`,
  toggleLike: (id) => `${API_BASE}/api/video/${id}/like`,
};

function parseYouTubeId(url) {
  if (!url) return null;
  const raw = (url || "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const isYT = host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com";
    if (!isYT) return null;
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id || null;
    }
    const v = u.searchParams.get("v");
    if (v) return v;
    const m = u.pathname.match(/\/(shorts|embed|live)\/([^/?#]+)/i);
    if (m && m[2]) return m[2];
    return null;
  } catch {
    return null;
  }
}

function toYouTubeEmbed(url) {
  const id = parseYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

function normalizeDriveDirect(url) {
  try {
    const raw = (url || "").trim();
    if (!raw) return "";
    const u = new URL(raw);
    if (!u.hostname.includes("drive.google.com")) return raw;
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m && m[1]) {
      return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    }
    return raw;
  } catch {
    return (url || "").trim();
  }
}

export default function VideoDetails() {
  const { videoId } = useParams();
  const [data, setData] = useState(null);
  const [likeBusy, setLikeBusy] = useState(false);
  const viewKey = useMemo(() => `viewed:${(videoId || "").trim()}`, [videoId]);
  const likeKey = useMemo(() => `liked:${(videoId || "").trim()}`, [videoId]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await axios.get(endpoints.getOne((videoId || "").trim()));
        if (!mounted) return;
        setData(res.data || null);
      } catch {
        try {
          const all = await axios.get(`${API_BASE}/api/video`);
          const id = (videoId || "").trim();
          const found = (all.data || []).find(
            (v) => String(v.videoId).trim() === id
          );
          setData(found || null);
        } catch (err) {
          console.error(err);
          toast.error("Failed to load video");
          setData(null);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [videoId]);

  const rawUrl = (data?.videoUrl || "").trim();
  const ytEmbed = useMemo(() => toYouTubeEmbed(rawUrl), [rawUrl]);
  const fileSrc = useMemo(() => {
    if (ytEmbed) return null;
    if (!rawUrl) return null;
    return normalizeDriveDirect(rawUrl);
  }, [ytEmbed, rawUrl]);

  useEffect(() => {
    if (!data) return;
    if (sessionStorage.getItem(viewKey)) return;
    sessionStorage.setItem(viewKey, "1");
    setData((d) => (d ? { ...d, viewCount: (d.viewCount || 0) + 1 } : d));
    axios
      .post(endpoints.addView(videoId))
      .then((res) => {
        const { viewCount, likeCount } = res.data || {};
        setData((d) =>
          d
            ? {
                ...d,
                viewCount:
                  typeof viewCount === "number" ? viewCount : d.viewCount,
                likeCount:
                  typeof likeCount === "number" ? likeCount : d.likeCount,
              }
            : d
        );
      })
      .catch(() => {
        sessionStorage.removeItem(viewKey);
        console.warn("view bump failed");
      });
  }, [data, videoId, viewKey]);

  async function handleLike() {
    if (!data || likeBusy) return;
    const alreadyLocal = localStorage.getItem(likeKey) === "1";
    setLikeBusy(true);
    setData((d) =>
      d ? { ...d, likeCount: (d.likeCount || 0) + (alreadyLocal ? -1 : 1) } : d
    );
    try {
      const res = await axios.post(endpoints.toggleLike(videoId), {
        delta: alreadyLocal ? -1 : 1,
      });
      if (alreadyLocal) localStorage.removeItem(likeKey);
      else localStorage.setItem(likeKey, "1");
      const { likeCount } = res.data || {};
      if (typeof likeCount === "number") {
        setData((d) => (d ? { ...d, likeCount } : d));
      }
    } catch (e) {
      setData((d) =>
        d ? { ...d, likeCount: (d.likeCount || 0) + (alreadyLocal ? 1 : -1) } : d
      );
      const msg =
        e?.response?.data?.message || e?.message || "Failed to update like";
      toast.error(msg);
    } finally {
      setLikeBusy(false);
    }
  }

  const hasPlayable = Boolean(ytEmbed || fileSrc);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/videos"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Videos</span>
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!data ? (
          <div className="animate-pulse">
            <div className="bg-gray-300 rounded-2xl h-96 mb-8"></div>
            <div className="bg-gray-300 rounded-lg h-8 mb-4"></div>
            <div className="bg-gray-300 rounded-lg h-4 mb-2"></div>
            <div className="bg-gray-300 rounded-lg h-4 w-3/4"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Video Player */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                <div className="relative bg-black">
                  {ytEmbed ? (
                    <iframe
                      className="aspect-video w-full min-h-[400px]"
                      src={ytEmbed}
                      title={data.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : fileSrc ? (
                    <video
                      className="aspect-video w-full min-h-[400px]"
                      controls
                      playsInline
                      preload="metadata"
                      crossOrigin="anonymous"
                      poster="/api/placeholder/800/450"
                    >
                      <source src={fileSrc} type="video/mp4" />
                      <source src={fileSrc} />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="aspect-video w-full min-h-[400px] flex items-center justify-center bg-gray-900">
                      <div className="text-center">
                        <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Video Not Available</h3>
                        <p className="text-gray-400">This video cannot be played at the moment.</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Video Overlay Actions */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-3 text-white transition-all duration-200 hover:scale-105">
                      <Bookmark size={20} />
                    </button>
                    <button className="bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-3 text-white transition-all duration-200 hover:scale-105">
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Information */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                      {data.title}
                    </h1>
                    
                    {/* Video Stats */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Eye size={18} />
                        <span className="font-medium">{data.viewCount ?? 0} views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        <span className="font-medium">
                          {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={18} />
                        <span className="font-medium">25 min</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleLike}
                      disabled={likeBusy}
                      className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-60"
                    >
                      <Heart className={`${likeBusy ? 'animate-pulse' : ''}`} size={20} />
                      <span>{data.likeCount ?? 0}</span>
                    </button>
                    <button className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105">
                      <Share2 size={20} />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Video Description */}
                {data.description && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Workout</h3>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {data.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Workout Steps */}
              {Array.isArray(data.workOutStep) && data.workOutStep.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-red-100 p-3 rounded-xl">
                      <Play className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Workout Steps</h2>
                      <p className="text-gray-600">Follow along with these detailed instructions</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {data.workOutStep.filter(Boolean).map((step, idx) => (
                      <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-red-600" />
                      <span className="text-gray-700 font-medium">Duration</span>
                    </div>
                    <span className="font-bold text-gray-900">25 min</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700 font-medium">Difficulty</span>
                    </div>
                    <span className="font-bold text-gray-900">Intermediate</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700 font-medium">Equipment</span>
                    </div>
                    <span className="font-bold text-gray-900">Dumbbells</span>
                  </div>
                </div>
              </div>

              {/* Related Actions */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <Bookmark className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">Save for Later</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <MessageCircle className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">Add to Playlist</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <ExternalLink className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">Watch on YouTube</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
