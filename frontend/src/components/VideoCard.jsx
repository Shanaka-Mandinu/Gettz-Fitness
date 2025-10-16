import { Play, Eye, Heart, Clock, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";

// Utility function to format duration from seconds to readable format
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return "0 min";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes} min`;
  } else {
    return `${remainingSeconds} sec`;
  }
}

function ytThumb(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube") || u.hostname.includes("youtu.be")) {
      const id =
        u.searchParams.get("v") ||
        (u.hostname === "youtu.be" ? u.pathname.slice(1) : null);
      if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
  } catch {}
  return null;
}

export default function VideoCard({ v, viewMode = "grid" }) {
  const thumb = ytThumb(v.videoUrl);

  if (viewMode === "list") {
    return (
      <Link
        to={`/videos/${encodeURIComponent(v.videoId)}`}
        className="group block bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
      >
        <div className="flex flex-col md:flex-row">
          {/* Thumbnail */}
          <div className="relative md:w-80 h-48 md:h-32 bg-gradient-to-br from-gray-200 to-gray-100 flex-shrink-0">
            {thumb ? (
              <img
                src={thumb}
                alt={v.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-gray-400">
                <Play className="h-12 w-12" />
              </div>
            )}
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-red-600 text-white rounded-full p-4 shadow-lg">
                <Play className="h-6 w-6" />
              </div>
            </div>

            {/* Stats Overlay */}
            <div className="absolute bottom-2 left-2 flex gap-2">
              <div className="inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs text-white">
                <Eye size={12} />
                {v.viewCount ?? 0}
              </div>
              <div className="inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs text-white">
                <Heart size={12} />
                {v.likeCount ?? 0}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex flex-col h-full">
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                {v.title}
              </h3>
              
              {v.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {v.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-auto">
                {v.category && (
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                      {v.category}
                    </span>
                  </div>
                )}
                {v.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{new Date(v.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{formatDuration(v.duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid view (default)
  return (
    <Link
      to={`/videos/${encodeURIComponent(v.videoId)}`}
      className="group block bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-100">
        {thumb ? (
          <img
            src={thumb}
            alt={v.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-gray-400">
            <Play className="h-12 w-12" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-red-600 text-white rounded-full p-4 shadow-lg">
            <Play className="h-6 w-6" />
          </div>
        </div>

        {/* Stats Overlay */}
        <div className="absolute bottom-2 left-2 flex gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs text-white">
            <Eye size={12} />
            {v.viewCount ?? 0}
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs text-white">
            <Heart size={12} />
            {v.likeCount ?? 0}
          </div>
        </div>

        {/* Category Badge */}
        {v.category && (
          <div className="absolute top-2 right-2">
            <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-medium">
              {v.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
          {v.title}
        </h3>
        
        {v.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {v.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'Recently'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{formatDuration(v.duration)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
