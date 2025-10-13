import { useState, useEffect } from "react";
import { Plus, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

export default function MealTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);

  // Fetch templates 
  async function fetchTemplates() {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: "Bearer " + token } : undefined;
      
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/mealTemplate`,
        { headers }
      );
      const items = Array.isArray(data) ? data : [];
      setTemplates(items);
      console.log("Fetched templates:", items);
    } catch (err) {
      console.error("Failed to fetch meal templates:", err);
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        const errorMessage = err.response?.data?.message || "Authentication required";
        if (errorMessage.includes("Trainer or Admin authorization")) {
          toast.error("You need admin or trainer authorization");
        } else {
          toast.error("You need admin or trainer authorization");
        }
      } else {
        toast.error("Failed to load meal templates. Please try again.");
      }
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);


  // Delete
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
        
        await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/mealTemplate/${t._id}`,
          { headers }
        );
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
        
        // Handle authentication errors
        if (err.response?.status === 401) {
          const errorMessage = err.response?.data?.message || "Authentication required";
          if (errorMessage.includes("Trainer or Admin authorization")) {
            toast.error("You need admin or trainer authorization");
          } else {
            toast.error("You need admin or trainer authorization");
          }
        } else {
          Swal.fire({
            title: 'Error!',
            text: 'Failed to delete the meal template. Please try again.',
            icon: 'error',
            confirmButtonColor: '#dc2626'
          });
        }
      }
    }
  }

  // PDF Download
  const handleDownloadPDF = () => {
    // Check if user has templates to download
    if (templates.length === 0) {
      toast.error("No meal templates available to download");
      return;
    }
    
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
    doc.text("Meal Templates Report", 20, 45);
    
    // First Table - Basic Info
    autoTable(doc, {
      startY: 55,
      head: [
        [
          "No",
          "Template Name",
          "Meal Type",
          "Food Items",
          "Duration"
        ]
      ],
      body: templates.map((template, index) => [
        index + 1,
        template.templateName || "-",
        template.mealType || "-",
        template.foodItems || "-",
        template.duration || "-"
      ]),
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
        1: { cellWidth: 40, halign: 'left' }, // Template Name
        2: { cellWidth: 30, halign: 'left' }, // Meal Type
        3: { cellWidth: 60, halign: 'left' }, // Food Items
        4: { cellWidth: 30, halign: 'left' }  // Duration
      },
      margin: { top: 55, left: 20, right: 20 },
      tableWidth: 'auto',
      showHead: 'everyPage'
    });

    // Second Table - Nutritional Info
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [
        [
          "No",
          "Template Name",
          "Calories",
          "Protein",
          "Carbs",
          "Fats",
          "Diet Category"
        ]
      ],
      body: templates.map((template, index) => [
        index + 1,
        template.templateName || "-",
        template.calories || "-",
        template.protein || "-",
        template.carbs || "-",
        template.fats || "-",
        template.dietCategory || "-"
      ]),
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
        1: { cellWidth: 40, halign: 'left' }, // Template Name
        2: { cellWidth: 25, halign: 'left' }, // Calories
        3: { cellWidth: 25, halign: 'left' }, // Protein
        4: { cellWidth: 25, halign: 'left' }, // Carbs
        5: { cellWidth: 25, halign: 'left' }, // Fats
        6: { cellWidth: 35, halign: 'left' }  // Diet Category
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
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
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

        {/* Table */}
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
              {templates.map((t) => (
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
                        src={`${import.meta.env.VITE_BACKEND_URL}/${t.photo}`}
                        alt="Meal"
                        className="h-12 w-12 object-cover rounded"
                        onError={(e) => {
                          console.error("Trainer image failed to load:", `${import.meta.env.VITE_BACKEND_URL}/${t.photo}`);
                          console.error("Template photo field:", t.photo);
                        }}
                        onLoad={() => console.log("Trainer image loaded successfully:", `${import.meta.env.VITE_BACKEND_URL}/${t.photo}`)}
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