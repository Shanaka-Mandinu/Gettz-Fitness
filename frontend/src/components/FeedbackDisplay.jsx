import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function FeedbackDisplay() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const API_BASE =
    (import.meta?.env && import.meta.env.VITE_BACKEND_URL) ||
    (window.location.port === "5173" ? "http://localhost:3000" : window.location.origin);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  
  const infiniteFeedbacks = [...feedbacks, ...feedbacks];

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      
      const { data } = await axios.get(`${API_BASE}/api/feedback/public?limit=6`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (data.success) {
        setFeedbacks(data.data);
      } else {
        setError("Failed to fetch feedback");
      }
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-lg ${
          index < rating ? "text-yellow-400" : "text-gray-400"
        }`}
      >
        ★
      </span>
    ));
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: "Poor",
      2: "Fair", 
      3: "Good",
      4: "Very Good",
      5: "Excellent"
    };
    return labels[rating] || "Good";
  };

  const getDefaultAvatar = (name) => {
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
        {initials}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white">Members love us</h2>
            <p className="mt-3 text-neutral-300">Loading feedback...</p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-white/10 bg-neutral-900/60 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-600"></div>
                  <div>
                    <div className="h-4 bg-gray-600 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-600 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white">Members love us</h2>
            <p className="mt-3 text-neutral-300">Real stories from our community.</p>
          </div>
          <div className="mt-10 text-center">
            <p className="text-red-400">Unable to load feedback at this time.</p>
          </div>
        </div>
      </section>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white">Members love us</h2>
            <p className="mt-3 text-neutral-300">Real stories from our community.</p>
          </div>
          <div className="mt-10 text-center">
            <p className="text-neutral-400">No feedback available yet.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800">Members love us</h2>
          <p className="mt-3 text-slate-600">Real stories from our community.</p>
        </div>

        
        <div className="mt-10 relative overflow-hidden">
         
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          
      
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          
          <div 
            className={`flex gap-6 ${isPaused ? 'paused' : 'animate-scroll'}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            style={{
              animationDuration: `${feedbacks.length * 8}s`,
              width: `${infiniteFeedbacks.length * 320}px`
            }}
          >
            {infiniteFeedbacks.map((feedback, i) => (
              <div
                key={`${feedback._id || i}-${Math.floor(i / feedbacks.length)}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-red-300 transition-all duration-300 hover:shadow-lg hover:shadow-red-100 flex-shrink-0 w-80"
              >
              
              <div className="flex items-center gap-3 mb-4">
                {getDefaultAvatar(feedback.name || feedback.userId?.name || 'Anonymous')}
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 text-sm">
                    {feedback.is_anonymous 
                      ? 'Anonymous Member' 
                      : (feedback.name || feedback.userId?.name || 'Member')
                    }
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {renderStars(feedback.rating)}
                    </div>
                    <span className="text-xs text-slate-500">
                      {getRatingLabel(feedback.rating)}
                    </span>
                  </div>
                </div>
              </div>

            
              <blockquote className="text-slate-600 text-sm leading-relaxed">
                "{feedback.feedback_message.length > 120 
                  ? feedback.feedback_message.substring(0, 120) + '...' 
                  : feedback.feedback_message
                }"
              </blockquote>

             
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                  {feedback.feedback_type}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(feedback.created_at).toLocaleDateString()}
                </span>
              </div>

              
              {feedback.admin_response && (
                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Response from Gettz Fitness:</p>
                  <p className="text-xs text-slate-700">
                    {feedback.admin_response.length > 80 
                      ? feedback.admin_response.substring(0, 80) + '...' 
                      : feedback.admin_response
                    }
                  </p>
                </div>
              )}
              </div>
            ))}
          </div>
        </div>

      
        <div className="mt-8 text-center">
          <a
            href="/contactUs"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-red-600 text-red-600 px-6 py-3 font-semibold hover:bg-red-600 hover:text-white transition-all duration-300"
          >
            Share Your Experience
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
