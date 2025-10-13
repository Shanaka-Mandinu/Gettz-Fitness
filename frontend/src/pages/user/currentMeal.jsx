import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import bowl from "../../assets/healthy-meal.png";
import Swal from "sweetalert2";

function IconBowl() {
  return (
    <img src={bowl} className="icon h-5 w-5 inline-block object-contain" alt="bowl" />
  );
}
function IconTimer() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="13" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 3h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
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
  
  const photoUrl = photo 
    ? `${import.meta.env.VITE_BACKEND_URL}/${photo}`
    : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Photo Section */}
      {photoUrl && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={photoUrl}
            alt={name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute top-3 right-3">
            {isTemplate && (
              <Pill tone="blue">Template</Pill>
            )}
          </div>
        </div>
      )}
      
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

  async function fetchPlans() {
    try {
      setBusy(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: "Bearer " + token } : undefined;

      console.log("fetchPlans - token:", token);
      console.log("fetchPlans - headers:", headers);

      // Fetch regular meal plans from API
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/mealPlan/getOneMealPlan`,
        { headers }
      );

      console.log("fetchPlans - API response:", data);
      const apiItems = Array.isArray(data?.response) ? data.response : Array.isArray(data) ? data : [];
      console.log("fetchPlans - apiItems:", apiItems);
      
      // Fetch selected meal templates from localStorage
      const selectedTemplates = JSON.parse(localStorage.getItem('selectedMealTemplates') || '[]');
      
      // Convert templates to the same format as meal plans
      const templateItems = selectedTemplates.map(template => ({
        _id: template.id,
        meal_name: template.templateName,
        meal_type: template.mealType,
        duration: template.duration || "Custom Template",
        calories: template.calories,
        description: template.foodItems,
        isTemplate: true, // Flag to identify templates
        templateData: template // Keep original template data
      }));

      // Combine both arrays
      const allItems = [...apiItems, ...templateItems];
      console.log("fetchPlans - allItems:", allItems);
      console.log("fetchPlans - apiItems length:", apiItems.length);
      console.log("fetchPlans - templateItems length:", templateItems.length);
      setPlans(allItems);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load meal plans";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }


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
        // Remove from localStorage
        const selectedTemplates = JSON.parse(localStorage.getItem('selectedMealTemplates') || '[]');
        const updatedTemplates = selectedTemplates.filter(t => t.id !== plan._id);
        localStorage.setItem('selectedMealTemplates', JSON.stringify(updatedTemplates));
        
        toast.success("The template has been removed from your meal plans.");
      } else {
        // Delete regular meal plan from API
        const id = plan.mealPlan_id;
        await axios.delete(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/mealPlan/${encodeURIComponent(id)}`
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

  // Filter plans based on type
  const filteredPlans = plans.filter(plan => {
    if (typeFilter === "all") return true;
    if (typeFilter === "custom") return !plan.isTemplate;
    if (typeFilter === "template") return plan.isTemplate;
    return true;
  });


  function handleDownloadPDF() {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(220, 38, 38); // Red color
      doc.text("Gettz Fitness", 20, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Black color
      doc.text("Address: Matara", 20, 30);
      
      // Red line
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      
      // Title
      doc.setFontSize(16);
      doc.setTextColor(220, 38, 38);
      doc.text("User Meal Plans Report", 20, 45);
      
      // First Table - Basic Info
      const basicTableData = filteredPlans.map((p, index) => {
        const type = p.meal_type ?? p.planMealType ?? "-";
        const typeWithSource = p.isTemplate ? `${type} (Template)` : type;
        
        return [
          index + 1,
          p.meal_name ?? p.mealName ?? "-",
          typeWithSource,
          p.duration ?? "-",
          String(p.calories ?? "-")
        ];
      });

      autoTable(doc, {
        startY: 55,
        head: [
          [
            "No",
            "Meal Name",
            "Meal Type",
            "Duration",
            "Calories"
          ]
        ],
        body: basicTableData,
        theme: "grid",
        headStyles: { 
          fillColor: [220, 38, 38], // Red background
          textColor: [255, 255, 255], // White text
          fontSize: 10,
          halign: 'left'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'left' }, // No
          1: { cellWidth: 50, halign: 'left' }, // Meal Name
          2: { cellWidth: 35, halign: 'left' }, // Meal Type
          3: { cellWidth: 30, halign: 'left' }, // Duration
          4: { cellWidth: 25, halign: 'left' }  // Calories
        },
        margin: { top: 55, left: 20, right: 20 },
        tableWidth: 'auto',
        showHead: 'everyPage'
      });

      // Second Table - Nutritional Info
      const nutritionalTableData = filteredPlans.map((p, index) => {
        const protein = p.isTemplate ? (p.templateData?.protein || "-") : (p.protein || "-");
        const carbs = p.isTemplate ? (p.templateData?.carbs || "-") : (p.carbs || "-");
        const fats = p.isTemplate ? (p.templateData?.fats || "-") : (p.fats || "-");
        const category = p.isTemplate ? (p.templateData?.dietCategory || "-") : (p.dietCategory || "-");
        
        return [
          index + 1,
          p.meal_name ?? p.mealName ?? "-",
          protein,
          carbs,
          fats,
          category
        ];
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [
          [
            "No",
            "Meal Name",
            "Protein",
            "Carbs",
            "Fats",
            "Diet Category"
          ]
        ],
        body: nutritionalTableData,
        theme: "grid",
        headStyles: { 
          fillColor: [220, 38, 38], // Red background
          textColor: [255, 255, 255], // White text
          fontSize: 10,
          halign: 'left'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'left' }, // No
          1: { cellWidth: 50, halign: 'left' }, // Meal Name
          2: { cellWidth: 25, halign: 'left' }, // Protein
          3: { cellWidth: 25, halign: 'left' }, // Carbs
          4: { cellWidth: 25, halign: 'left' }, // Fats
          5: { cellWidth: 35, halign: 'left' }  // Diet Category
        },
        margin: { top: 20, left: 20, right: 20 },
        tableWidth: 'auto',
        showHead: 'everyPage'
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, doc.internal.pageSize.height - 5);
      }

      doc.save("user_meal_plans_report.pdf");
    } catch (err) {
      toast.error("Failed to generate PDF");
      console.error(err);
    }
  }
  

  return (
    <div className="p-6">
      <div className="mx-auto w-full max-w-screen-2xl">
        {/* Header*/}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-black">Meal Plans</h1>
            <p className="mt-1 text-sm text-gray-500">Here you can see your active meal plans.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700"
            >
              Download PDF
            </button>
          </div>
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
