// Trainer: Manage meal templates (list, delete, export PDF, navigate to add/edit)
import { useState, useEffect, useMemo } from "react";
import { Plus, FileDown, Search, RotateCcw, List, Sun, Moon, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import GymLogo from "../../assets/GymLogo.jpg";
import toast from "react-hot-toast";

export default function MealTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState("all"); // all | breakfast | lunch | dinner | post-workout | pre-workout

  // Fetch templates (trainer/admin only endpoints)
  async function fetchTemplates() {
    try {
      
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: "Bearer " + token } : undefined;
      
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/mealTemplate`,
        { headers }
      );
      // Controller returns an array of templates; guard to avoid crashes
      const items = Array.isArray(data) ? data : [];
      setTemplates(items);
      console.log("Fetched templates:", items);
    } catch (err) {
      console.error("Failed to fetch meal templates:", err);
      const status = err?.response?.status;
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to load meal templates";
      if (status === 401) {
        toast.error("You need admin or trainer authorization");
      } else {
        toast.error(errorMessage);
      }
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Helper: detect a time-slot (breakfast/lunch/dinner/pre/post workout) from available fields
  const detectTimeSlot = (t) => {
    const candidates = [t?.mealTime, t?.timeSlot, t?.mealSlot, t?.meal_type, t?.mealType, t?.dietCategory, t?.templateName];
    const toKey = (s) => (s || "").toString().toLowerCase().replace(/\s|_/g, "");
    for (const c of candidates) {
      const k = toKey(c);
      if (k.includes("breakfast")) return "breakfast";
      if (k.includes("lunch")) return "lunch";
      if (k.includes("dinner")) return "dinner";
      if (k.includes("postworkout")) return "post-workout";
      if (k.includes("preworkout")) return "pre-workout";
    }
    return "";
  };

  // Derived: filtered templates (search + createdAt date range + meal type chip)
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const toTime = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;

    return templates.filter((t) => {
      // Search in key fields
      const matchesQ =
        !qLower ||
        [t.templateName, t.mealType, t.foodItems, t.dietCategory, t.duration]
          .map((v) => (v ? String(v).toLowerCase() : ""))
          .some((s) => s.includes(qLower));

      // createdAt comes from timestamps: true
      const ts = t.createdAt ? new Date(t.createdAt).getTime() : null;
      const matchesFrom = !fromTime || (ts && ts >= fromTime);
      const matchesTo = !toTime || (ts && ts <= toTime);
      const slot = detectTimeSlot(t);
      const matchesMealType = mealTypeFilter === "all" || slot === mealTypeFilter;
      return matchesQ && matchesFrom && matchesTo && matchesMealType;
    });
  }, [templates, q, dateFrom, dateTo, mealTypeFilter]);

  // Recompute totals when filtered changes (needs filtered declared)
  // NOTE: We re-declare totals after filtered for correct dependency
  const totals = useMemo(() => {
    const count = filtered.length;
    return { count };
  }, [filtered]);

  // Slot totals for Breakfast/Lunch/Dinner/Post/Pre Workout
  const slotTotals = useMemo(() => {
    let breakfast = 0, lunch = 0, dinner = 0, postWorkout = 0, preWorkout = 0;
    for (const t of filtered) {
      const slot = detectTimeSlot(t);
      if (slot === "breakfast") breakfast++;
      else if (slot === "lunch") lunch++;
      else if (slot === "dinner") dinner++;
      else if (slot === "post-workout") postWorkout++;
      else if (slot === "pre-workout") preWorkout++;
    }
    return { breakfast, lunch, dinner, postWorkout, preWorkout };
  }, [filtered]);


  // Delete a template (trainer/admin only)
  async function deleteTemplate(t) {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete "${t.templateName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: "Bearer " + token } : undefined;
        
        // Delete by Mongo _id as per controller and router
        await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/mealTemplate/${t._id}`,
          { headers }
        );
        // Optimistic UI update
        setTemplates(templates.filter((x) => x._id !== t._id));
        
        Swal.fire({
          title: 'Deleted!',
          text: 'Meal template has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#059669',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error("Failed to delete template:", err);
        const status = err?.response?.status;
        const errorMessage = err?.response?.data?.message || err?.message || 'Failed to delete the meal template.';
        if (status === 401) {
          toast.error("You need admin or trainer authorization");
        } else {
          Swal.fire({
            title: 'Error!',
            text: errorMessage,
            icon: 'error',
            confirmButtonColor: '#dc2626'
          });
        }
      }
    }
  }

  // PDF Download for all templates in the table
  const handleDownloadPDF = () => {
    // Use filtered set for report consistency
    if (filtered.length === 0) {
      toast.error("No meal templates match current filters");
      return;
    }
    
    const doc = new jsPDF();

    // Header with light background, logo, brand, compact contact line, and red underline (enhanced + compact)
    const W = doc.internal.pageSize.getWidth();
    // light header background band
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 12, W, 36, 'F');
    try {
      doc.addImage(GymLogo, "JPEG", 20, 18, 28, 28);
    } catch {}
    doc.setFontSize(20);
    if (doc.setFont) { try { doc.setFont('helvetica', 'bold'); } catch {} }
    doc.setTextColor(220, 38, 38);
    doc.text("Gettz Fitness", 20 + 28 + 12, 30);
    if (doc.setFont) { try { doc.setFont('helvetica', 'normal'); } catch {} }
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text("Address: 48 Udyana Mawatha, Matara  |  Email: support@gettzfitness.lk  |  +94 77 780 4602", 20 + 28 + 12, 40);
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.8);
    doc.line(20, 60, W - 20, 60);

    // Centered title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Meal Templates Report", W / 2, 78, { align: "center" });

    // Boxed report details and summary (Payments Report style)
    const fmtISO = (d) => {
      if (!d) return "-";
      try { const dt = new Date(d); return Number.isNaN(dt.getTime()) ? String(d) : dt.toISOString().slice(0,10); } catch { return String(d); }
    };
    const slotLabel = (v) => {
      switch(v){
        case "breakfast": return "Breakfast";
        case "lunch": return "Lunch";
        case "dinner": return "Dinner";
        case "post-workout": return "Post Workout";
        case "pre-workout": return "Pre Workout";
        case "all": return "All";
        default: return v || "-";
      }
    };
  const boxX = 20, boxY = 88, boxW = W - 40, boxH = 48;
    doc.setDrawColor(220,38,38);
    doc.setLineWidth(0.6);
    if (doc.roundedRect) {
      doc.roundedRect(boxX, boxY, boxW, boxH, 3, 3);
    } else {
      doc.rect(boxX, boxY, boxW, boxH);
    }
  // Column split
    const midX = boxX + boxW/2;
    doc.setFontSize(9);
    doc.setTextColor(220,38,38);
    doc.text("REPORT DETAILS", boxX + 6, boxY + 10);
    doc.text("SUMMARY", midX + 6, boxY + 10);
    doc.setTextColor(100);
    doc.setFontSize(9.5);
    const reportId = `MT-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0,14)}`;
    doc.text(`REPORT ID   ${reportId}`, boxX + 6, boxY + 20);
    doc.text(`GENERATED   ${new Date().toLocaleString()}`, boxX + 6, boxY + 30);
  // Summary values
  doc.text(`ITEMS   ${String(totals.count)}`, midX + 6, boxY + 20);

    // Optional filters line below box
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(`Filters: Meal Type ${slotLabel(mealTypeFilter)} | Date ${fmtISO(dateFrom)} to ${fmtISO(dateTo)} | Search ${q ? q : '-'}`, boxX, boxY + boxH + 10);

  // Bar Chart: Meal Type distribution (Breakfast/Lunch/Dinner/Post/Pre) using current filters
    let tableStartY = boxY + boxH + 18; // default if chart not rendered
    try {
      const data = [
        { label: 'Breakfast', value: slotTotals.breakfast },
        { label: 'Lunch', value: slotTotals.lunch },
        { label: 'Dinner', value: slotTotals.dinner },
        { label: 'Post Workout', value: slotTotals.postWorkout },
        { label: 'Pre Workout', value: slotTotals.preWorkout },
      ];
      const nonZero = data.filter(d => (Number(d.value) || 0) >= 0); // include zeros to show all types
      if (nonZero.length > 0) {
        const maxVal = Math.max(...nonZero.map(d => Number(d.value) || 0));
        if (maxVal > 0) {
          // Horizontal bar chart for all rows
          const barH = 18; // px (thicker bars)
          const gap = 12;  // px between bars
          const leftPad = 140; // shorter labels fit
          const rightPad = 24;
          const topPad = 12;
          const bottomPad = 12;
          const plotW = 460; // px bar drawing width (wider)
          const height = topPad + nonZero.length * (barH + gap) - gap + bottomPad;
          const width = leftPad + plotW + rightPad;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.font = '12px sans-serif';
          ctx.textBaseline = 'middle';
          // helper to ellipsize labels to fit leftPad - 12
          const ellipsize = (text, maxWidth) => {
            let t = String(text);
            if (ctx.measureText(t).width <= maxWidth) return t;
            while (t.length > 0 && ctx.measureText(t + '…').width > maxWidth) {
              t = t.slice(0, -1);
            }
            return t.length ? t + '…' : '';
          };
          // color palette cycle
          const colors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#22c55e'];
          nonZero.forEach((seg, idx) => {
            const y = topPad + idx * (barH + gap) + barH / 2;
            // label on the left
            ctx.fillStyle = '#374151';
            ctx.textAlign = 'right';
            ctx.fillText(ellipsize(seg.label, leftPad - 12), leftPad - 8, y);
            // bar
            const val = Number(seg.value) || 0;
            const w = Math.round((val / maxVal) * plotW);
            ctx.fillStyle = colors[idx % colors.length];
            ctx.fillRect(leftPad, y - barH / 2, w, barH);
            // value at end of bar
            ctx.fillStyle = '#111827';
            ctx.textAlign = 'left';
            ctx.fillText(String(val), leftPad + w + 6, y);
          });

          // add to PDF centered with safe width and capped height
          const chartWmm = Math.min(200, W - 30);
          const naturalHmm = (canvas.height / canvas.width) * chartWmm;
          const chartHmm = Math.min(160, Math.max(60, naturalHmm));
          const chartX = (W - chartWmm) / 2;
          const chartY = boxY + boxH + 42; // extra space between report header and chart
          // Chart title
          doc.setFontSize(12);
          doc.setTextColor(220,38,38);
          doc.text('Meal Types Distribution', W/2, chartY - 8, { align: 'center' });
          const img = canvas.toDataURL('image/png');
          doc.addImage(img, 'PNG', chartX, chartY, chartWmm, chartHmm);
          // Always put the table on a new page after the chart
          doc.addPage();
          tableStartY = 30;
        }
      }
    } catch {}

    // Single merged table (Payments style)
    // Build table using the same columns shown on the page table
    const clean = (v) => {
      if (v === undefined || v === null) return "-";
      const s = String(v).trim();
      return s.length === 0 ? "-" : s;
    };
    // Optional table title (centered)
    doc.setFontSize(12);
    doc.setTextColor(220,38,38);
    doc.text('Meal Templates - Details', W/2, tableStartY, { align: 'center' });
    tableStartY += 8;
    // Re-check space after adding title
    {
      const H = doc.internal.pageSize.getHeight();
      const footerReserve = 30;
      const safeBottom = H - footerReserve;
      if (tableStartY + 20 > safeBottom) {
        doc.addPage();
        tableStartY = 30;
      }
    }

    // Compute safe, centered table width so it never overflows page
    const minSide = 20; // mm
    const safeTableWidth = Math.max(60, W - 2 * minSide); // ensure some usable width
    autoTable(doc, {
      startY: tableStartY,
      head: [[
        "#",
        "Template",
        "Meal Type",
        "Food Items",
        "Cals",
        "Prot",
        "Carbs",
        "Fats",
        "Duration",
        "Diet Category",
        "Created"
      ]],
      body: filtered.map((t, i) => [
        i + 1,
        clean(t.templateName),
        clean(t.mealType),
        clean(t.foodItems),
        clean(t.calories),
        clean(t.protein),
        clean(t.carbs),
        clean(t.fats),
        clean(t.duration),
        clean(t.dietCategory),
        t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-",
      ]),
      theme: "grid",
      headStyles: { fillColor: [220,38,38], textColor: [255,255,255], fontSize: 10, halign: 'left' },
      styles: { fontSize: 8, cellPadding: 2.5, halign: 'left', overflow: 'linebreak' },
      // Use wrap/auto widths so table scales within safe area and centers
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, // #
        1: { cellWidth: 26 },                  // Template (reduced)
        2: { cellWidth: 'wrap' },              // Meal Type
        3: { cellWidth: 30 },                  // Food Items (reduced)
        4: { cellWidth: 12, halign: 'right' }, // Calories
        5: { cellWidth: 12, halign: 'right' }, // Protein
        6: { cellWidth: 12, halign: 'right' }, // Carbs
        7: { cellWidth: 12, halign: 'right' }, // Fats
        8: { cellWidth: 16 },                  // Duration
        9: { cellWidth: 18 },                  // Diet Category
        10: { cellWidth: 18 },                 // Created
      },
      tableWidth: safeTableWidth,
      // Center table with fixed safe margins
      margin: { left: minSide, right: minSide, bottom: 30 },
      showHead: 'everyPage'
    });


    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const H = doc.internal.pageSize.getHeight();
      doc.setDrawColor(220,38,38);
      doc.setLineWidth(0.4);
      doc.line(20, H - 18, doc.internal.pageSize.getWidth() - 20, H - 18);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("Thank you. For support: support@gettzfitness.lk | +94 77 780 4602", 20, H - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 20, H - 10, { align: 'right' });
    }

    doc.save("meal_templates_report.pdf");
  };
  

  return (
    <div className="p-6">
      <div className="mx-auto w-full max-w-screen-2xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold text-black">Meal Templates</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/trainerDashboard/add-meal-template')}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />
              Add Meal Template
            </button>
          </div>
        </div>

        {/* Filters + Actions (mirrors RequestedMeals) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            {/* Search */}
            <div className="relative lg:max-w-sm w-full">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
                placeholder="Search by name, id, type..."
              />
            </div>

            {/* Date range */}
            <div className="w-full lg:w-48">
              <div className="mb-1 text-xs font-semibold text-gray-600 uppercase">From</div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="w-full lg:w-48">
              <div className="mb-1 text-xs font-semibold text-gray-600 uppercase">To</div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { setQ(""); setDateFrom(""); setDateTo(""); setMealTypeFilter("all"); }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm hover:bg-gray-50 transition"
                title="Reset filters"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2.5 text-sm text-white shadow-sm hover:shadow transition hover:bg-green-700 cursor-pointer"
                title="Download PDF report"
              >
                <FileDown className="h-4 w-4" />
                Download Report
              </button>
            </div>
          </div>

          {/* Totals bar with icons and slot breakdown (no Vegan/Non-Vegan) */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-gray-500" />
                <div className="text-xs text-gray-500">Filtered Count</div>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{totals.count}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                <div className="text-xs text-gray-500">Breakfast</div>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{slotTotals.breakfast}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-orange-500" />
                <div className="text-xs text-gray-500">Lunch</div>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{slotTotals.lunch}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-600" />
                <div className="text-xs text-gray-500">Dinner</div>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{slotTotals.dinner}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-red-600" />
                <div className="text-xs text-gray-500">Post Workout</div>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{slotTotals.postWorkout}</div>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-green-700" />
                <div className="text-xs text-gray-500">Pre Workout</div>
              </div>
              <div className="mt-1 text-base font-semibold text-gray-900">{slotTotals.preWorkout}</div>
            </div>
          </div>
        </div>

        {/* One-row Meal Type chips */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-1">Meal Type:</span>
            <button
              onClick={() => setMealTypeFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mealTypeFilter === "all"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMealTypeFilter("breakfast")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mealTypeFilter === "breakfast"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Breakfast
            </button>
            <button
              onClick={() => setMealTypeFilter("lunch")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mealTypeFilter === "lunch"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Lunch
            </button>
            <button
              onClick={() => setMealTypeFilter("dinner")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mealTypeFilter === "dinner"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Dinner
            </button>
            <button
              onClick={() => setMealTypeFilter("post-workout")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mealTypeFilter === "post-workout"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Post Workout
            </button>
            <button
              onClick={() => setMealTypeFilter("pre-workout")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mealTypeFilter === "pre-workout"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-red-300"
              }`}
            >
              Pre Workout
            </button>
          </div>
        </div>

        {/* Table of templates */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-x-auto">
          <table className="min-w-full table-fixed text-sm text-left text-gray-700">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 w-40">Template Name</th>
                <th className="px-4 py-3 w-28">Meal Type</th>
                <th className="px-4 py-3 w-60">Food Items</th>
                <th className="px-4 py-3 w-20">Calories</th>
                <th className="px-4 py-3 w-20">Protein</th>
                <th className="px-4 py-3 w-20">Carbs</th>
                <th className="px-4 py-3 w-20">Fats</th>
                <th className="px-4 py-3 w-24">Duration</th>
                <th className="px-4 py-3 w-32">Diet Category</th>
                <th className="px-4 py-3 w-32">Photo</th>
                <th className="px-4 py-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-3 text-center text-neutral-500">
                    No meal templates found
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t._id} className="align-top">
                  <td className="px-4 py-3">{t.templateName}</td>
                  <td className="px-4 py-3">{t.mealType}</td>
                  <td className="px-4 py-3 whitespace-pre-line break-words">
                    {t.foodItems}
                  </td>
                  <td className="px-4 py-3">{t.calories}</td>
                  <td className="px-4 py-3">{t.protein}</td>
                  <td className="px-4 py-3">{t.carbs}</td>
                  <td className="px-4 py-3">{t.fats}</td>
                  <td className="px-4 py-3">{t.duration}</td>
                  <td className="px-4 py-3">{t.dietCategory}</td>
                  <td className="px-4 py-3">
                    {t.photo ? (
                      <img
                        src={String(t.photo).startsWith("http") ? t.photo : `${import.meta.env.VITE_BACKEND_URL}/${t.photo}`}
                        alt="Meal"
                        className="h-12 w-12 object-cover rounded"
                        onError={() => {
                          console.error("Meal template image failed:", t.photo);
                        }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/trainerDashboard/edit-meal-template/${t._id}`)}
                        className="rounded-md bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTemplate(t)}
                        className="rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}