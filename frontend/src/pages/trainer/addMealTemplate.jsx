// Trainer: Add a new meal template (multipart form with optional photo)
import { useState } from "react";
import { Upload, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

export default function AddMealTemplate() {
  const navigate = useNavigate();
  
  // Form model mirrors backend controller fields
  const [form, setForm] = useState({
    templateName: "",
    mealType: "",
    foodItems: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    dietCategory: "",
    duration: "",
    photo: null,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation function: returns a map of field errors (empty when valid)
  const validateForm = () => {
    const newErrors = {};

    // Template Name validation
    if (!form.templateName.trim()) {
      newErrors.templateName = "Template name is required.";
    } else if (form.templateName.trim().length < 3) {
      newErrors.templateName = "Template name must be at least 3 characters long.";
    }

    // Meal Type validation
    if (!form.mealType) {
      newErrors.mealType = "Please select a meal type.";
    }

    // Food Items validation
    if (!form.foodItems.trim()) {
      newErrors.foodItems = "Food items are required.";
    } else if (form.foodItems.trim().length < 10) {
      newErrors.foodItems = "Please provide more detailed food items (at least 10 characters).";
    }

    // Calories validation
    if (!form.calories) {
      newErrors.calories = "Calories are required.";
    } else if (isNaN(form.calories) || Number(form.calories) <= 0) {
      newErrors.calories = "Please enter a valid number of calories.";
    } else if (Number(form.calories) > 5000) {
      newErrors.calories = "Calories cannot exceed 5000.";
    }

    // Protein validation
    if (form.protein && (isNaN(form.protein) || Number(form.protein) < 0)) {
      newErrors.protein = "Please enter a valid protein amount.";
    }

    // Carbs validation
    if (form.carbs && (isNaN(form.carbs) || Number(form.carbs) < 0)) {
      newErrors.carbs = "Please enter a valid carbs amount.";
    }

    // Fats validation
    if (form.fats && (isNaN(form.fats) || Number(form.fats) < 0)) {
      newErrors.fats = "Please enter a valid fats amount.";
    }

    // Duration validation
    if (!form.duration.trim()) {
      newErrors.duration = "Duration is required.";
    } else if (form.duration.trim().length < 3) {
      newErrors.duration = "Please provide a more specific duration.";
    }

    // Diet Category validation
    if (!form.dietCategory.trim()) {
      newErrors.dietCategory = "Diet category is required.";
    } else if (form.dietCategory.trim().length < 3) {
      newErrors.dietCategory = "Diet category must be at least 3 characters long.";
    }

    return newErrors;
  };


  // Helper to build FormData for multipart upload (photo optional)
  function buildFormData() {
    const formData = new FormData();
    formData.append("templateName", form.templateName.trim());
    formData.append("mealType", form.mealType.trim());
    formData.append("foodItems", form.foodItems.trim());
    formData.append("calories", form.calories);
    formData.append("protein", form.protein);
    formData.append("carbs", form.carbs);
    formData.append("fats", form.fats);
    formData.append("dietCategory", form.dietCategory.trim());
    formData.append("duration", form.duration.trim());
    if (form.photo) formData.append("photo", form.photo);

    return formData;
  }


  // Validate image before setting into state (max ~10MB; basic type check)
  function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      Swal.fire({
        title: 'Image too large',
        text: 'Please choose an image up to 10MB.',
        icon: 'warning',
        confirmButtonColor: '#dc2626'
      });
      return;
    }
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'Invalid file type',
        text: 'Please choose a valid image file.',
        icon: 'warning',
        confirmButtonColor: '#dc2626'
      });
      return;
    }
    setForm({ ...form, photo: file });
  }


  // Create: submit form to backend (requires trainer/admin JWT)
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Create Meal Template?',
      text: `Are you sure you want to create "${form.templateName}" template?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Create Template!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });
    
    if (!result.isConfirmed) {
      return;
    }
    
    setLoading(true);
    try {
      const formData = buildFormData();
      const token = localStorage.getItem("token");
      
      // Note: do NOT set Content-Type manually for FormData; let the browser set the boundary
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/mealTemplate`,
        formData,
        headers ? { headers } : undefined
      );
      
      // Show success alert
      await Swal.fire({
        title: 'Success!',
        text: 'Meal template created successfully!',
        icon: 'success',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Continue'
      });
      
      navigate('/trainerDashboard/mealTemplate');
    } catch (err) {
      let errorMessage = "Failed to create template. Please try again.";
      
      if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
        await Swal.fire({
          title: 'Authentication Error',
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'Go to Login'
        });
        navigate('/login');
        return;
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to create meal templates.";
      } else {
        errorMessage = err.response?.data?.error || err.message;
      }
      
      await Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Try Again'
      });
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className="p-6">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/trainerDashboard/mealTemplate')}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </button>
          <h1 className="text-2xl font-semibold text-black">Add Meal Template</h1>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6 p-6" noValidate>
          
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/*Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Basic Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Template Name</label>
                    <input
                      value={form.templateName}
                      onChange={(e) =>
                        setForm({ ...form, templateName: e.target.value })
                      }
                      placeholder="e.g. Weight Loss Plan"
                      required
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                        errors.templateName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.templateName && (
                      <p className="mt-1 text-sm text-red-600">{errors.templateName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Meal Type</label>
                    <select
                      value={form.mealType}
                      onChange={(e) =>
                        setForm({ ...form, mealType: e.target.value })
                      }
                      required
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                        errors.mealType ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select meal type</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Pre-Workout">Pre-Workout</option>
                      <option value="Post-Workout">Post-Workout</option>
                    </select>
                    {errors.mealType && (
                      <p className="mt-1 text-sm text-red-600">{errors.mealType}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Food Items</label>
                    <textarea
                      value={form.foodItems}
                      onChange={(e) =>
                        setForm({ ...form, foodItems: e.target.value })
                      }
                      placeholder="e.g. Oats, Banana, Peanut Butter"
                      rows={3}
                      required
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                        errors.foodItems ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.foodItems && (
                      <p className="mt-1 text-sm text-red-600">{errors.foodItems}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Meal Template Image</label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-8 cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-all duration-200 group">
                      {form.photo ? (
                        <div className="relative w-full">
                          <img
                            src={URL.createObjectURL(form.photo)}
                            alt="Preview"
                            className="h-32 w-full object-cover rounded-lg shadow-sm"
                          />
                          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm font-medium">Change Photo</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:bg-red-200 transition-colors">
                            <Upload className="h-6 w-6 text-red-500" />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">
                            Click to upload meal photo
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/*Nutritional Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Nutritional Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Calories</label>
                    <input
                      type="number"
                      value={form.calories}
                      onChange={(e) =>
                        setForm({ ...form, calories: e.target.value })
                      }
                      placeholder="e.g. 450"
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                        errors.calories ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.calories && (
                      <p className="mt-1 text-sm text-red-600">{errors.calories}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Protein (g)</label>
                      <input
                        type="number"
                        value={form.protein}
                        onChange={(e) =>
                          setForm({ ...form, protein: e.target.value })
                        }
                        placeholder="e.g. 20"
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                          errors.protein ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.protein && (
                        <p className="mt-1 text-sm text-red-600">{errors.protein}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Carbs (g)</label>
                      <input
                        type="number"
                        value={form.carbs}
                        onChange={(e) =>
                          setForm({ ...form, carbs: e.target.value })
                        }
                        placeholder="e.g. 60"
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                          errors.carbs ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.carbs && (
                        <p className="mt-1 text-sm text-red-600">{errors.carbs}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Fats (g)</label>
                      <input
                        type="number"
                        value={form.fats}
                        onChange={(e) =>
                          setForm({ ...form, fats: e.target.value })
                        }
                        placeholder="e.g. 12"
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                          errors.fats ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.fats && (
                        <p className="mt-1 text-sm text-red-600">{errors.fats}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Duration</label>
                    <input
                      value={form.duration}
                      onChange={(e) =>
                        setForm({ ...form, duration: e.target.value })
                      }
                      placeholder="e.g. 30 days, 1 week, 2 months"
                      required
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                        errors.duration ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.duration && (
                      <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Diet Category</label>
                    <input
                      value={form.dietCategory}
                      onChange={(e) =>
                        setForm({ ...form, dietCategory: e.target.value })
                      }
                      placeholder="e.g. Muscle Gain, Keto, Vegan"
                      required
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                        errors.dietCategory ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.dietCategory && (
                      <p className="mt-1 text-sm text-red-600">{errors.dietCategory}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-8 py-3 text-sm font-bold text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Meal Template
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
