import { useState, useEffect } from "react";
import { Upload, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import mediaUpload from "../../utils/mediaUpload";

export default function EditMealTemplate() {
  const navigate = useNavigate();
  const { id } = useParams();
  
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
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});

  // Fetch template data once by id
  useEffect(() => {
    async function fetchTemplate() {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: "Bearer " + token } : undefined;
        
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/mealTemplate/${id}`,
          { headers }
        );
        setForm({
          templateName: data.templateName ?? "",
          mealType: data.mealType ?? "",
          foodItems: data.foodItems ?? "",
          calories: data.calories ?? "",
          protein: data.protein ?? "",
          carbs: data.carbs ?? "",
          fats: data.fats ?? "",
          dietCategory: data.dietCategory ?? "",
          duration: data.duration ?? "",
          photo: null,
        });
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          toast.error("You need admin or trainer authorization");
        } else {
          toast.error("Failed to load template. Redirecting back...");
          setTimeout(() => {
            navigate('/trainerDashboard/mealTemplate');
          }, 2000);
        }
      } finally {
        setFetching(false);
      }
    }
    fetchTemplate();
  }, [id, navigate]);
  

  // Build JSON payload. If a File is provided, caller should pass uploaded URL string.
  function buildPayload(photoUrl) {
    const payload = {
      templateName: form.templateName.trim(),
      mealType: form.mealType.trim(),
      foodItems: form.foodItems.trim(),
      calories: form.calories,
      protein: form.protein,
      carbs: form.carbs,
      fats: form.fats,
      dietCategory: form.dietCategory.trim(),
      duration: form.duration.trim(),
    };
    if (photoUrl != null) payload.photo = photoUrl;
    return payload;
  }

  // Validate image before setting into state (<=10MB and image/* type)
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

  // Update template on submit (requires trainer/admin JWT)
  async function handleSubmit(e) {
    e.preventDefault();
    // Basic numeric validation with sensible caps
    const newErrors = {};
    const c = Number(form.calories);
    const p = form.protein === "" ? "" : Number(form.protein);
    const cb = form.carbs === "" ? "" : Number(form.carbs);
    const f = form.fats === "" ? "" : Number(form.fats);

    if (!form.calories) {
      newErrors.calories = "Calories are required.";
    } else if (isNaN(c) || c <= 0) {
      newErrors.calories = "Please enter a valid number of calories.";
    } else if (c > 5000) {
      newErrors.calories = "Calories cannot exceed 5000.";
    }

    if (form.protein === "") {
      newErrors.protein = "Protein is required.";
    } else {
      if (isNaN(p) || p < 0) newErrors.protein = "Please enter a valid protein amount.";
      else if (p > 500) newErrors.protein = "Protein cannot exceed 500g.";
    }

    if (form.carbs === "") {
      newErrors.carbs = "Carbs are required.";
    } else {
      if (isNaN(cb) || cb < 0) newErrors.carbs = "Please enter a valid carbs amount.";
      else if (cb > 1000) newErrors.carbs = "Carbs cannot exceed 1000g.";
    }

    if (form.fats === "") {
      newErrors.fats = "Fats are required.";
    } else {
      if (isNaN(f) || f < 0) newErrors.fats = "Please enter a valid fats amount.";
      else if (f > 300) newErrors.fats = "Fats cannot exceed 300g.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please correct the highlighted fields.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // If a new file is selected, upload to Supabase first, else don't send photo to keep existing
      let photoUrl = null;
      if (form.photo instanceof File) {
        photoUrl = await mediaUpload(form.photo);
      }
      const payload = buildPayload(photoUrl);
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/mealTemplate/${id}`,
        payload,
        token ? { headers: { Authorization: "Bearer " + token } } : undefined
      );
      toast.success("Meal template updated successfully!");
      navigate('/trainerDashboard/mealTemplate');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error("You need admin or trainer authorization");
      } else {
        const msg = err?.response?.data?.error || err?.message || "Failed to update template. Please try again.";
        toast.error(String(msg));
      }
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="p-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading template...</p>
            </div>
          </div>
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-semibold text-black">Edit Meal Template</h1>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6 p-6" noValidate>
            {/* TWO-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT: Basic Information */}
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
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-semibold text-gray-700">Meal Type</label>
                    <select
                      value={form.mealType}
                      onChange={(e) =>
                        setForm({ ...form, mealType: e.target.value })
                      }
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm"
                    >
                      <option value="">Select meal type</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Pre-Workout">Pre-Workout</option>
                      <option value="Post-Workout">Post-Workout</option>
                    </select>
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
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm"
                    />
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
                      min={0}
                      max={5000}
                    />
                    {errors.calories && (
                      <p className="mt-1 text-xs text-red-600">{errors.calories}</p>
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
                        min={0}
                        max={500}
                        required
                      />
                      {errors.protein && (
                        <p className="mt-1 text-xs text-red-600">{errors.protein}</p>
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
                        min={0}
                        max={1000}
                        required
                      />
                      {errors.carbs && (
                        <p className="mt-1 text-xs text-red-600">{errors.carbs}</p>
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
                        min={0}
                        max={300}
                        required
                      />
                      {errors.fats && (
                        <p className="mt-1 text-xs text-red-600">{errors.fats}</p>
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
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white shadow-sm"
                    />
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
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Update Meal Template
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
