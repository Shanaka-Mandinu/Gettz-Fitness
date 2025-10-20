import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Swal from "sweetalert2";


// Small inline timer icon
function IconTimer() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="13" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 3h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
// Small inline calories/fire icon
function IconFire() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12 3s-2 2-2 4a3 3 0 006 0c0-2-2-4-2-4 3 2 6 6 6 9a8 8 0 11-16 0c0-3 3-7 8-9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Colored pill badge; tone selects Tailwind classes
function Pill({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200",
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
    red: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100",
    blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// A single meal plan card displaying key fields; supports both API plans and template selections
function MealPlanCard({ plan, onDelete }) {
  const name = plan.meal_name ?? plan.mealName ?? "-";
  const type = plan.meal_type ?? plan.planMealType ?? "-";
  const duration = plan.duration ?? "-";
  const calories = plan.calories ?? "-";
  const description = plan.description ?? plan.planDescription ?? "-";
  const typeTone = String(type).toLowerCase() === "vegan" ? "green" : "gray";
  const isTemplate = plan.isTemplate;
  
  // Get photo URL - handle both template and regular meal plan photos
  const photo = isTemplate 
    ? (plan.templateData?.photo || plan.photo)
    : (plan.photo);
  
  // Only use absolute cloud URLs; local /uploads no longer exists
  const photoUrl = photo && String(photo).startsWith("http") ? photo : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Photo Section */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Show placeholder if image fails
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('[data-fallback]');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div data-fallback className="hidden h-full w-full items-center justify-center">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7a2 2 0 012-2h1l2-2h6l2 2h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 14l4-4a2 2 0 012 0l7 7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 14l1-1a2 2 0 012 0l4 4" />
          </svg>
        </div>
        <div className="absolute top-3 right-3">
          {isTemplate && (
            <Pill tone="blue">Template</Pill>
          )}
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
              <Pill tone={typeTone}>{type}</Pill>
            </div>
            <p className="text-sm text-gray-600 break-words line-clamp-2">{description}</p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onDelete(plan)}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              aria-label="Delete meal plan"
              title="Delete"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Nutritional Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Calories */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                  <IconFire className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Calories</p>
                  <p className="text-sm font-semibold text-gray-900">{calories}</p>
                </div>
              </div>
              
              {/* Carbs */}
              {(isTemplate ? plan.templateData?.carbs : plan.carbs) && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Carbs</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {isTemplate ? plan.templateData.carbs : plan.carbs}g
                    </p>
                  </div>
                </div>
              )}
              
              {/* Duration */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                  <IconTimer className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-semibold text-gray-900">{duration}</p>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-4">
              {/* Protein */}
              {(isTemplate ? plan.templateData?.protein : plan.protein) && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Protein</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {isTemplate ? plan.templateData.protein : plan.protein}g
                    </p>
                  </div>
                </div>
              )}
              
              {/* Fats */}
              {(isTemplate ? plan.templateData?.fats : plan.fats) && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                    <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fats</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {isTemplate ? plan.templateData.fats : plan.fats}g
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CurrentMeal() {
  const [plans, setPlans] = useState([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  // Load meal plans assigned to the user from API and merge with locally-selected templates
  async function fetchPlans() {
    try {
      setBusy(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: "Bearer " + token } : undefined;

      // Fetch regular meal plans from API
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/mealPlan/getOneMealPlan`,
        { headers }
      );
      const apiItems = Array.isArray(data?.response) ? data.response : Array.isArray(data) ? data : [];
      
      // Fetch selected meal templates from API for cross-browser persistence
      let templateItems = [];
      if (token) {
        try {
          const { data: saved } = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/saved-meal-templates/mine`,
            { headers }
          );
          const arr = Array.isArray(saved) ? saved : [];
          templateItems = arr.map(template => ({
            _id: String(template._id),
            meal_name: template.templateName,
            meal_type: template.mealType,
            duration: template.duration || "Custom Template",
            calories: template.calories,
            description: template.foodItems,
            isTemplate: true,
            templateData: template,
          }));
        } catch (e) {
          // If API fails (e.g., unauthenticated), fall back to any local selections
          try {
            const local = JSON.parse(localStorage.getItem('selectedMealTemplates') || '[]');
            templateItems = local.map(template => ({
              _id: template.id,
              meal_name: template.templateName,
              meal_type: template.mealType,
              duration: template.duration || "Custom Template",
              calories: template.calories,
              description: template.foodItems,
              isTemplate: true,
              templateData: template,
            }));
          } catch {}
        }
      }

  // Combine both arrays into a single list for rendering and export
      const allItems = [...apiItems, ...templateItems];
      setPlans(allItems);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load meal plans";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }


  // Delete either an API meal plan (with backend call) or a locally-selected template (localStorage)
  async function handleDelete(plan) {
    
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;

    try {
      setSaving(true);
      
  // Check if it's a template (selected from predefined templates)
      if (plan.isTemplate) {
        // Remove via API
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: "Bearer " + token } : undefined;
        try {
          const templateId = plan.templateData?.template_id || plan.templateData?._id || plan._id;
          await axios.delete(
            `${import.meta.env.VITE_BACKEND_URL}/api/saved-meal-templates/save/${encodeURIComponent(templateId)}`,
            headers ? { headers } : undefined
          );
          toast.success("The template has been removed from your meal plans.");
        } catch (e) {
          const msg = e?.response?.data?.message || e?.message || "Failed to remove template";
          toast.error(msg);
        }
      } else {
        // Delete regular meal plan from API
        const id = plan.mealPlan_id;
        if (id === undefined || id === null) {
          toast.error("Missing meal plan ID");
          return;
        }
        const token = localStorage.getItem("token");
        await axios.delete(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/mealPlan/${encodeURIComponent(id)}`,
          token ? { headers: { Authorization: "Bearer " + token } } : undefined
        );
        toast.success("The plan has been deleted.");
      }
      
      fetchPlans();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Failed to delete plan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  } 
  
  
  



  useEffect(() => {
    fetchPlans();
  }, []);

  // Filter plans based on type (all | custom | template)
  const filteredPlans = plans.filter(plan => {
    if (typeFilter === "all") return true;
    if (typeFilter === "custom") return !plan.isTemplate;
    if (typeFilter === "template") return plan.isTemplate;
    return true;
  });


  // PDF download removed
  

  return (
    <div className="p-6">
      <div className="mx-auto w-full max-w-screen-2xl">
        {/* Header*/}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-black">Meal Plans</h1>
            <p className="mt-1 text-sm text-gray-500">Here you can see your active meal plans.</p>
          </div>

          {/* PDF download button removed */}
        </div>

        {/* Filter Section */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                typeFilter === "all"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              All Plans
            </button>
            <button
              onClick={() => setTypeFilter("custom")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                typeFilter === "custom"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Custom Plans
            </button>
            <button
              onClick={() => setTypeFilter("template")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                typeFilter === "template"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Templates
            </button>
          </div>
        </div>

        {/* Cards grid */}
        {busy && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-neutral-500">
            Loading…
          </div>
        )}

        {!busy && filteredPlans.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => (
              <MealPlanCard 
                key={plan._id ?? plan.mealPlan_id ?? plan.meal_name ?? Math.random()}
               plan={plan} 
               onDelete={handleDelete}
               />
            ))}
          </div>
        )}

        {!busy && filteredPlans.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-neutral-500">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {plans.length === 0 ? "No meal plans found" : `No ${typeFilter === "all" ? "" : typeFilter} meal plans found`}
            </h3>
            <p className="text-gray-600 mb-4">
              {plans.length === 0 
                ? "You don't have any assigned meal plans yet. Request a meal plan or select from templates."
                : `No ${typeFilter === "all" ? "" : typeFilter} meal plans match your current filter.`
              }
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => window.location.href = '/mealPlan'}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Request Meal Plan
              </button>
              <button
                onClick={() => window.location.href = '/meal-templates'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Browse Templates
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
