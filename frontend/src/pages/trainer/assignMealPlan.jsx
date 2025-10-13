import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

export default function AssignMealPlan() {
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    mealName: "",
    duration: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    planDescription: "",
    planMealType: "",
    foodItems: "",
    dietCategory: "",
    photo: null,
  });

  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load request data from localStorage (set on previous page)
  useEffect(() => {
    const storedData = localStorage.getItem('assignRequestData');
    if (storedData) {
      setRequestData(JSON.parse(storedData));
    } else {
      // If no data, redirect back
      navigate('/trainerDashboard/reqMeals');
    }
  }, [navigate]);

  // Validate form fields and return a map of field errors (empty if valid)
  const validateForm = () => {
    const newErrors = {};

    // Meal Name validation
    if (!form.mealName.trim()) {
      newErrors.mealName = "Meal name is required.";
    } else if (form.mealName.trim().length < 3) {
      newErrors.mealName = "Meal name must be at least 3 characters long.";
    }

    // Meal Type validation
    if (!form.planMealType) {
      newErrors.planMealType = "Please select a meal type.";
    }

    // Duration validation
    if (!form.duration.trim()) {
      newErrors.duration = "Duration is required.";
    } else if (form.duration.trim().length < 3) {
      newErrors.duration = "Please provide a more specific duration.";
    }

    // Calories validation (cap at 5000)
    if (!form.calories) {
      newErrors.calories = "Calories are required.";
    } else if (isNaN(form.calories) || Number(form.calories) <= 0) {
      newErrors.calories = "Please enter a valid number of calories.";
    } else if (Number(form.calories) > 5000) {
      newErrors.calories = "Calories cannot exceed 5000.";
    }

    // Food Items validation
    if (!form.foodItems.trim()) {
      newErrors.foodItems = "Food items are required.";
    } else if (form.foodItems.trim().length < 10) {
      newErrors.foodItems = "Please provide more detailed food items (at least 10 characters).";
    }

    // Protein validation (required, 0 - 500g)
    if (form.protein === "") {
      newErrors.protein = "Protein is required.";
    } else if (isNaN(form.protein) || Number(form.protein) < 0) {
      newErrors.protein = "Please enter a valid protein amount.";
    } else if (Number(form.protein) > 500) {
      newErrors.protein = "Protein cannot exceed 500g.";
    }

    // Carbs validation (required, 0 - 1000g)
    if (form.carbs === "") {
      newErrors.carbs = "Carbs are required.";
    } else if (isNaN(form.carbs) || Number(form.carbs) < 0) {
      newErrors.carbs = "Please enter a valid carbs amount.";
    } else if (Number(form.carbs) > 1000) {
      newErrors.carbs = "Carbs cannot exceed 1000g.";
    }

    // Fats validation (required, 0 - 300g)
    if (form.fats === "") {
      newErrors.fats = "Fats are required.";
    } else if (isNaN(form.fats) || Number(form.fats) < 0) {
      newErrors.fats = "Please enter a valid fats amount.";
    } else if (Number(form.fats) > 300) {
      newErrors.fats = "Fats cannot exceed 300g.";
    }

    // Diet Category validation
    if (!form.dietCategory.trim()) {
      newErrors.dietCategory = "Diet category is required.";
    } else if (form.dietCategory.trim().length < 3) {
      newErrors.dietCategory = "Diet category must be at least 3 characters long.";
    }

    return newErrors;
  };

  // Build FormData to match backend controller (multipart/form-data)
  function buildFormData() {
    const formData = new FormData();
    formData.append("user_name", requestData?.user_name || "");
    formData.append("user_id", requestData?.user_id || "");
    formData.append("meal_name", form.mealName.trim());
    formData.append("meal_type", form.planMealType.trim());
    formData.append("foodItems", form.foodItems.trim());
    formData.append("description", form.planDescription.trim());
    formData.append("calories", form.calories);
    formData.append("protein", form.protein);
    formData.append("carbs", form.carbs);
    formData.append("fats", form.fats);
    formData.append("dietCategory", form.dietCategory.trim());
    formData.append("duration", form.duration.trim());
    
    if (form.photo) formData.append("photo", form.photo);

    return formData;
  }

  // Validate image before setting into state (max ~10MB; image MIME types)
  function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      toast.error("Image is too large. Max size is 10MB.");
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type. Please choose an image.");
      return;
    }
    setForm({ ...form, photo: file });
  }


  // Submit assignment: create meal plan then remove the original request
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
    
    setLoading(true);
    
    try {
      const formData = buildFormData();
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: "Bearer " + token } : undefined;
      
      // First, assign the meal plan (let browser set multipart boundary)
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/mealPlan`,
        formData,
        headers ? { headers } : undefined
      );
      
      // Then, delete the meal request (authorized)
      try {
        await axios.delete(
          `${import.meta.env.VITE_BACKEND_URL}/api/mealRequest/${encodeURIComponent(requestData?.request_id)}`,
          { headers }
        );
        toast.success("Meal plan assigned and request removed");
      } catch (deleteErr) {
        toast.success("Meal plan assigned (request may still be visible)");
      }
      
      // Clear localStorage and navigate back
      localStorage.removeItem('assignRequestData');
      navigate('/trainerDashboard/reqMeals');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to assign meal plan";
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  }

  if (!requestData) {
    return (
      <div className="p-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading request data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/trainerDashboard/reqMeals')}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Requests
          </button>
          <h1 className="text-2xl font-semibold text-black">Assign Meal Plan</h1>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6 p-6" noValidate>
            {/* THREE-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT: Request Details */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Request Details
                  </h3>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 shadow-sm">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {/* Request ID - full width */}
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold text-gray-600 mb-2">
                        Request ID
                      </dt>
                      <dd className="font-mono text-sm text-gray-900 break-all rounded-lg bg-white shadow-sm border border-gray-200 px-3 py-2">
                        {requestData.request_id || "-"}
                      </dd>
                    </div>

                    {/* Name */}
                    <div>
                      <dt className="text-xs font-semibold text-gray-600 mb-2">
                        First Name
                      </dt>
                      <dd className="text-sm text-gray-900 font-medium">
                        {requestData.user_name || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-gray-600 mb-2">
                        Last Name
                      </dt>
                      <dd className="text-sm text-gray-900 font-medium">
                        {requestData.last_name || "-"}
                      </dd>
                    </div>

                    {/* Request Date */}
                    <div>
                      <dt className="text-xs font-semibold text-gray-600 mb-2">
                        Request Status
                      </dt>
                      <dd className="text-sm text-gray-900 font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          requestData.status === 'urgent' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {requestData.status === 'urgent' ? 'Urgent' : 'Normal'}
                        </span>
                      </dd>
                    </div>

                    {/* Requested Meal Type as a pill */}
                    <div>
                      <dt className="text-xs font-semibold text-gray-600 mb-2">
                        Requested Meal Type
                      </dt>
                      <dd className="mt-1">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                          {requestData.mealType || "-"}
                        </span>
                      </dd>
                    </div>

                    {/* Weight / Height */}
                    <div>
                      <dt className="text-xs font-semibold text-gray-600 mb-2">
                        Weight (kg)
                      </dt>
                      <dd className="text-sm text-gray-900 font-medium">
                        {requestData.weight || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-gray-600 mb-2">
                        Height (cm)
                      </dt>
                      <dd className="text-sm text-gray-900 font-medium">
                        {requestData.height || "-"}
                      </dd>
                    </div>

                    {/* Description - full width, subtle box */}
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold text-gray-600 mb-2">
                        Request Description
                      </dt>
                      <dd className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {requestData.description || "-"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* MIDDLE: Meal Plan Details (active fields) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Create Meal Plan
                  </h3>
                </div>
                <div className="space-y-4">
                  {/* Basic Info Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Meal Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Whole-grain cereals"
                        value={form.mealName}
                        onChange={(e) =>
                          setForm({ ...form, mealName: e.target.value })
                        }
                        required
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                          errors.mealName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.mealName && (
                        <p className="mt-1 text-sm text-red-600">{errors.mealName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Meal Type</label>
                      <select
                        value={form.planMealType}
                        onChange={(e) =>
                          setForm({ ...form, planMealType: e.target.value })
                        }
                        required
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                          errors.planMealType ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select meal type</option>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                        <option value="Pre-Workout">Pre-Workout</option>
                        <option value="Post-Workout">Post-Workout</option>
                      </select>
                      {errors.planMealType && (
                        <p className="mt-1 text-sm text-red-600">{errors.planMealType}</p>
                      )}
                    </div>
                  </div>


                  {/* Duration & Calories Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 3 months"
                        value={form.duration}
                        onChange={(e) =>
                          setForm({ ...form, duration: e.target.value })
                        }
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
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Calories</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="e.g., 450"
                        value={form.calories}
                        onChange={(e) =>
                          setForm({ ...form, calories: e.target.value })
                        }
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                          errors.calories ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min={0}
                        max={5000}
                        required
                      />
                      {errors.calories && (
                        <p className="mt-1 text-sm text-red-600">{errors.calories}</p>
                      )}
                    </div>
                  </div>

                  {/* Food Items */}
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Food Items</label>
                    <textarea
                      rows={2}
                      placeholder="e.g., Grilled chicken, quinoa, vegetables"
                      value={form.foodItems}
                      onChange={(e) =>
                        setForm({ ...form, foodItems: e.target.value })
                      }
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                        errors.foodItems ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.foodItems && (
                      <p className="mt-1 text-sm text-red-600">{errors.foodItems}</p>
                    )}
                  </div>

                  {/* Nutritional Info Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Protein (g)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="25"
                        value={form.protein}
                        onChange={(e) =>
                          setForm({ ...form, protein: e.target.value })
                        }
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                          errors.protein ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min={0}
                        max={500}
                        required
                      />
                      {errors.protein && (
                        <p className="mt-1 text-sm text-red-600">{errors.protein}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Carbs (g)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="50"
                        value={form.carbs}
                        onChange={(e) =>
                          setForm({ ...form, carbs: e.target.value })
                        }
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                          errors.carbs ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min={0}
                        max={1000}
                        required
                      />
                      {errors.carbs && (
                        <p className="mt-1 text-sm text-red-600">{errors.carbs}</p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-semibold text-gray-700">Fats (g)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="15"
                        value={form.fats}
                        onChange={(e) =>
                          setForm({ ...form, fats: e.target.value })
                        }
                        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm ${
                          errors.fats ? 'border-red-500' : 'border-gray-300'
                        }`}
                        min={0}
                        max={300}
                        required
                      />
                      {errors.fats && (
                        <p className="mt-1 text-sm text-red-600">{errors.fats}</p>
                      )}
                    </div>
                  </div>

                  {/* Diet Category */}
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Diet Category</label>
                    <input
                      type="text"
                      placeholder="e.g., Weight Loss, Muscle Gain"
                      value={form.dietCategory}
                      onChange={(e) =>
                        setForm({ ...form, dietCategory: e.target.value })
                      }
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

              {/* RIGHT: Photo Upload (optional) */}
              <div className="mt-10">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Meal Photo
                  </label>
                </div>
                
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-12 cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-all duration-200 group">
                    {form.photo ? (
                      <div className="relative w-full">
                        <img
                          src={URL.createObjectURL(form.photo)}
                          alt="Preview"
                          className="h-48 w-full object-cover rounded-lg shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-medium">Change Photo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:bg-red-200 transition-colors">
                          <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
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

                  {/* Description */}
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Description</label>
                    <textarea
                      rows={7}
                      placeholder="Extra guidance for the meal plan"
                      value={form.planDescription}
                      onChange={(e) =>
                        setForm({ ...form, planDescription: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Footer */}
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
                    Assigning...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Assign Meal Plan
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
