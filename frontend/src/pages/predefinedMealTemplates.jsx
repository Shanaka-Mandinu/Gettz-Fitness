import React, { useState, useEffect } from "react";
import axios from "axios";
import { ArrowLeft, Clock, Utensils, Target, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import HomeFooter from "../components/homeFooter";
import Swal from "sweetalert2";

export default function PredefinedMealTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  // Fetch meal templates from backend (public endpoint)
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // Guard: backend URL must be configured
      if (!import.meta.env.VITE_BACKEND_URL) {
        setError("Backend URL not configured. Set VITE_BACKEND_URL.");
        return;
      }
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/mealTemplate/public`
      );
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load meal templates";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  // Filter templates based on selected filter
  const filteredTemplates = templates.filter(template => {
    if (filter === "all") return true;
    return template.mealType?.toLowerCase() === filter.toLowerCase();
  });

  // Get unique meal types for filter
  const mealTypes = ["all", ...new Set(templates.map(t => t.mealType).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="pt-16 flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading meal templates...</p>
          </div>
        </div>
        <HomeFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="pt-16 flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchTemplates}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
        <HomeFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <Header />
      
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b pt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
          </div>
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Predefined Meal Templates
            </h1>
          </div>
          <p className="text-gray-600">
            Browse our collection of professionally designed meal templates
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex-1">
        <div className="flex flex-wrap gap-2 mb-6">
          {mealTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === type
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              {type === "all" ? "All Templates" : type}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600">
              {filter === "all" 
                ? "No meal templates available at the moment."
                : `No templates found for ${filter} category.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {filteredTemplates.map((template) => (
              <MealTemplateCard key={template._id} template={template} />
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}

// Individual Meal Template Card Component
function MealTemplateCard({ template }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="h-48 bg-gray-200 relative">
        {template.photo && !imageError ? (
          <img
            src={`${import.meta.env.VITE_BACKEND_URL}/${template.photo}`}
            alt={template.templateName}
            className="w-full h-full object-cover"
            onError={() => {
              // Hide broken image and show fallback icon
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Meal Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            {template.mealType}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {template.templateName}
        </h3>
        
        {/* Food Items */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Food Items:</h4>
          <p className="text-sm text-gray-600 line-clamp-3">
            {template.foodItems}
          </p>
        </div>

        {/* Nutritional Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Calories</p>
              <p className="text-sm font-medium">{template.calories || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Protein</p>
              <p className="text-sm font-medium">{template.protein || "N/A"}g</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Utensils className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Carbs</p>
              <p className="text-sm font-medium">{template.carbs || "N/A"}g</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Fats</p>
              <p className="text-sm font-medium">{template.fats || "N/A"}g</p>
            </div>
          </div>
        </div>

        {/* Duration */}
        {template.duration && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-medium">{template.duration}</p>
              </div>
            </div>
          </div>
        )}

        {/* Diet Category */}
        {template.dietCategory && (
          <div className="mb-4">
            <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
              {template.dietCategory}
            </span>
          </div>
        )}

        {/* Action Button: store selected template in localStorage per user for later use (requires login) */}
        <button
          onClick={() => {
            // Read current user to namespace storage per user
            let currentUserId = null;
            try {
              const uStr = localStorage.getItem('user');
              if (uStr) currentUserId = JSON.parse(uStr)?._id || null;
            } catch {}
            // Enforce login: prevent saving to a generic key
            if (!currentUserId) {
              Swal.fire({
                title: "Login Required",
                text: "Please log in to add templates to your dashboard.",
                icon: "info",
                timer: 2000,
                showConfirmButton: false
              });
              return;
            }
            const storageKey = `selectedMealTemplates:${currentUserId}`;

            // Safely parse stored templates (default to [])
            let selectedTemplates = [];
            try {
              selectedTemplates = JSON.parse(localStorage.getItem(storageKey) || '[]');
            } catch {
              selectedTemplates = [];
            }
            const templateData = {
              ...template,
              selectedDate: new Date().toISOString(),
              id: template._id + '_' + Date.now() // Unique ID for deletion
            };
            
            // Check if template already exists (avoid duplicates)
            const exists = selectedTemplates.some(t => t._id === template._id);
            if (!exists) {
              selectedTemplates.push(templateData);
              localStorage.setItem(storageKey, JSON.stringify(selectedTemplates));
              
              // Show success message
              Swal.fire({
                title: "Template Selected!",
                text: `${template.templateName} has been added to your meal plans.`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false
              });
            } else {
              Swal.fire({
                title: "Already Selected",
                text: "This template is already in your meal plans.",
                icon: "info",
                timer: 2000,
                showConfirmButton: false
              });
            }
          }}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Select This Template
        </button>
      </div>
    </div>
  );
}
