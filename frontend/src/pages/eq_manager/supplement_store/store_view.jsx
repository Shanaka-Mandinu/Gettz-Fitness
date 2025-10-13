import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Supplement_card from "./supplement_card"
import { useCart } from "./supplement_cart";
import { useNavigate } from "react-router-dom";

export default function SupplementStoreView() {

  const [loading, setLoading] = useState(true);
  const [supplements, setSupplements] = useState([]);
  const [filteredSupplements, setFilteredSupplements] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const { addItem } = useCart();

  const navigate = useNavigate();

  const types = [
    { value: "Protein", label: "Protein" },
    { value: "Vitamins", label: "Vitamins" },
    { value: "Minerals", label: "Minerals" },
    { value: "Amino Acids", label: "Amino Acids" },
    { value: "Pre-Workout", label: "Pre-Workout" },
    { value: "Post-Workout", label: "Post-Workout" },
    { value: "Performance Enhancer", label: "Performance Enhancer" }
  ];//filter types || available types

  useEffect(() => {
    async function fetchSupplements() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/supplement`//correct call
        );

        setSupplements(res.data.supplement || []);
        console.log(res);

        setFilteredSupplements(res.data.supplement || []);

      } catch (err) {
        console.error("Error fetching supplements:", err);
        toast.error("Failed to load supplements");
      } finally {
        setLoading(false);
      }
    }

    fetchSupplements();
  }, []);

  //filters use
  useEffect(() => {
    let filtered = supplements;

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((s) => selectedTypes.includes(s.Sup_type));

    }

    setFilteredSupplements(filtered);
  }, [supplements, selectedTypes]);

  const handleTypeChange = (typeValue) => {
    setSelectedTypes((prev) =>
      prev.includes(typeValue)
        ? prev.filter((t) => t !== typeValue)
        : [...prev, typeValue]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading supplements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50">
      <div className="max-w-7xl pt-10 mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">

        
          {/* {filter sidebar} */}
          <div className={`lg:w-80 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-red-700 hover:text-red-400 text-sm font-medium">
                  Clear All
                </button>
              </div>

              {/* {type filters} */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplement Types</h3>
                <div className="space-y-3">
                  {types.map((type) => (
                    <label key={type.value} className="flex items-center group cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type.value)}
                        onChange={() => handleTypeChange(type.value)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-gray-700 group-hover:text-orange-600 transition-colors">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* {cart button} */}
          <div className="fixed top-4 right-4 md:top-20 md:right-6 z-50">
            <button
              className="bg-gradient-to-r from-red-700 to-red-500 text-white font-semibold px-5 py-2 rounded-full shadow-lg border border-gray-200 hover:shadow-xl hover:bg-black-50 transition-all"
              onClick={() => navigate("/cart")} //path corrected
            >
              View Cart
            </button>
          </div>

          {/* {supplements card view } */}
          <div className="flex-1">
            {filteredSupplements.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSupplements.map((supplement) => (
                  <Supplement_card
                    key={supplement.Sup_code || supplement._id}
                    product={supplement}
                    onAddToCart={addItem}
                  />
                ))}
              </div>
            ) : (
              //if nothing to show
              <div className="text-center py-16">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="w-full h-full"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {supplements.length === 0
                    ? "No supplements found"
                    : "No supplements match your filters"}
                </h3>
                <p className="text-gray-500">
                  {supplements.length === 0
                    ? "Check back later for new supplements."
                    : "Try adjusting your filters to see more results."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

