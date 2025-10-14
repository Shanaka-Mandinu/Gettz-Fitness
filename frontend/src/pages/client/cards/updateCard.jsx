import axios from "axios";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function UpdateCardForm() {
  const locationData = useLocation();
  const navigate = useNavigate();

  if (locationData.state == null) {
    navigate("/userDashboard/manageCards");
    toast.error("You need to select a card");

    return;
  }
  const cardId = locationData.state.card_id;
  const [cardNumber, setCardNumber] = useState(
    locationData.state.card_number.toString()
  );
  const [nameOnCard, setNameOnCard] = useState(locationData.state.card_name);
  const [expiry, setExpiry] = useState(locationData.state.expiry_date);
  const [errors, setErrors] = useState({});

  const handleReset = () => {
    setCardNumber("");
    setNameOnCard("");
    setExpiry("");
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};

    if (!nameOnCard.trim()) {
      newErrors.nameOnCard = "Name on card is required";
    } else if (!/^[a-zA-Z\s]+$/.test(nameOnCard)) {
      newErrors.nameOnCard = "Name can only contain letters and spaces";
    }

    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length !== 16) {
      newErrors.cardNumber = "Card number must be 16 digits";
    }

    const m = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!m) {
      newErrors.expiry = "Use MM/YY format";
    } else {
      const mm = parseInt(m[1], 10);
      const yy = parseInt(m[2], 10);

      if (mm < 1 || mm > 12) {
        newErrors.expiry = "Month must be between 01 and 12";
      } else {
        const now = new Date();
        const currentYY = now.getFullYear() % 100;
        const currentMM = now.getMonth() + 1;

        if (yy < currentYY) {
          newErrors.expiry = "Card has expired (invalid year)";
        } else if (yy === currentYY && mm < currentMM) {
          newErrors.expiry = "Card has expired this year (invalid month)";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const cardBody = {
        card_number: cardNumber,
        card_name: nameOnCard,
        expiry_date: expiry,
      };
      const token = localStorage.getItem("token");
      console.log(cardId);
      axios
        .put(
          import.meta.env.VITE_BACKEND_URL + "/api/card/update/" + cardId,
          cardBody,
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        )
        .then(() => {
          toast.success("Card Successfully Updated");
          handleReset();
          navigate("/userDashboard/manageCards");
        })
        .catch(() => {
          toast.error("Card Updating Failed");
        });
    }
  };

  const inputClass = (hasError) =>
    `mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${
      hasError
        ? "border-red-400 ring-red-400"
        : "border-gray-300 focus:ring-gray-400 focus:border-gray-400"
    }`;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Back + Title */}
      <div className="mb-8 flex items-center gap-3">
        <Link to="/userDashboard/manageCards">
          <button className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 border border-red-300">
            ← Back
          </button>
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Update Card</h1>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm border border-red-300">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Add Card Details
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your new card information below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name on card
              </label>
              <input
                type="text"
                placeholder="Name On Card"
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
                className={inputClass(!!errors.nameOnCard)}
              />
              {errors.nameOnCard && (
                <p className="mt-1 text-sm text-red-500">{errors.nameOnCard}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Card number{" "}
                <span className=" text-xs text-gray-500">
                  *Digits only, 16 characters.
                </span>
              </label>

              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setCardNumber(digits);
                }}
                inputMode="numeric"
                maxLength={16}
                className={inputClass(!!errors.cardNumber)}
              />
              {errors.cardNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.cardNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expiry (MM/YY)
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                inputMode="numeric"
                className={inputClass(!!errors.expiry)}
              />
              {errors.expiry && (
                <p className="mt-1 text-sm text-red-500">{errors.expiry}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="cursor-pointer mt-3 flex-1 rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 transition"
              >
                Update Card
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="cursor-pointer mt-3 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Card preview */}
        <div className="flex items-center justify-center">
          <div className="w-full rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-700 via-gray-500 to-gray-900 p-6 shadow-xl text-white">
            <div className="flex justify-between items-center">
              <span className="text-sm uppercase tracking-wider">
                Gettz Fitness
              </span>
              <div className="h-6 w-10 rounded-md bg-white/20 flex items-center justify-center">
                <CreditCard />
              </div>
            </div>

            <div className="mt-10 text-xl tracking-[0.2em]">
              {cardNumber
                ? cardNumber
                    .replace(/(.{4})/g, "$1 ")
                    .trim()
                    .padEnd(19, "•")
                : "•••• •••• •••• ••••"}
            </div>

            <div className="mt-8 flex justify-between text-sm">
              <div>
                <div className="opacity-60">Card Holder</div>
                <div className="font-medium">{nameOnCard || "Your Name"}</div>
              </div>
              <div>
                <div className="opacity-60">Expiry</div>
                <div className="font-medium">{expiry || "MM/YY"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
