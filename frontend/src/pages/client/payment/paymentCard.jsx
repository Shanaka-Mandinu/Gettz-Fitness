import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function Payment() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [cardNumber, setCardNumber] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState({});

  
  const plan = state?.plan?.plan_name ?? "Membership";
  const priceRaw = state?.plan?.price ?? 0;
  const price = Number(priceRaw) || 0;
  const features = Array.isArray(state?.plan?.features) ? state.plan.features : [];

  
  useEffect(() => {
    if (!loaded) {
      setCardNumber(state?.cards?.card_number ?? "");
      setNameOnCard(state?.cards?.card_name ?? "");
      setExpiry(state?.cards?.expiry_date ?? "");
      setLoaded(true);
    }
  }, [loaded, state?.cards]);

  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  // fetch points once
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          import.meta.env.VITE_BACKEND_URL + "/api/user/points",
          { headers: { Authorization: "Bearer " + token } }
        );
        // tolerant to shapes: {points} or {data:{points}}
        const pts = res?.data?.points ?? res?.data?.data?.points ?? 0;
        setAvailablePoints(Number(pts) || 0);
      } catch (err) {
        console.error("Failed to load points:", err?.response?.data || err.message);
        toast.error("Unable to load points");
        setAvailablePoints(0);
      } finally {
        setPointsLoading(false);
      }
    })();
  }, []);

  
  const POINT_VALUE_LKR = 1;     
  const MAX_DISCOUNT_RATIO = 0.5; 

  const maxPointsAllowedByPrice = Math.floor((price * MAX_DISCOUNT_RATIO) / POINT_VALUE_LKR);
  const maxPoints = Math.max(0, Math.min(availablePoints, maxPointsAllowedByPrice));

  // Auto-clamp if user had higher value typed before cap/available changed
  useEffect(() => {
    setPointsToUse((prev) => Math.max(0, Math.min(prev, maxPoints)));
  }, [maxPoints]);

  const discount = useMemo(() => {
    if (!usePoints) return 0;
    return Math.min(pointsToUse, maxPoints) * POINT_VALUE_LKR;
  }, [usePoints, pointsToUse, maxPoints]);

  const finalAmount = useMemo(() => Math.max(0, price - discount), [price, discount]);

  const formatLKR = (n) =>
    new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(n);

  // ---------- Validation (CVV 3–4) ----------
  function validateForm() {
    const newErrors = {};
    const now = new Date();
    const currentYY = now.getFullYear() % 100;
    const currentMM = now.getMonth() + 1;

    const name = String(nameOnCard || "").trim();
    const numberDigits = String(cardNumber || "").replace(/\s/g, "");
    const exp = String(expiry || "").trim();
    const cvvDigits = String(cvv || "").trim();

    if (!name) newErrors.nameOnCard = "Name on card is required";
    if (!numberDigits) newErrors.cardNumber = "Card number is required";
    if (!exp) newErrors.expiry = "Expiry is required";
    if (!cvvDigits) newErrors.cvv = "CVV is required";

    if (name && !/^[a-zA-Z\s]+$/.test(name)) newErrors.nameOnCard = "Enter a valid name (letters only)";
    if (numberDigits && !/^\d{16}$/.test(numberDigits)) newErrors.cardNumber = "Card number must be 16 digits";

    if (exp) {
      const match = /^(\d{2})\/(\d{2})$/.exec(exp);
      if (!match) newErrors.expiry = "Enter expiry as MM/YY";
      else {
        const mm = parseInt(match[1], 10);
        const yy = parseInt(match[2], 10);
        if (mm < 1 || mm > 12) newErrors.expiry = "Month must be between 01 and 12";
        else {
          // simple expiry check: must be this month or later
          if (yy < currentYY || (yy === currentYY && mm < currentMM)) {
            newErrors.expiry = "Card has expired";
          }
        }
      }
    }

    if (cvvDigits && !/^\d{3}$/.test(cvvDigits)) newErrors.cvv = "CVV must be 3 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ---------- Submit ----------
  async function choosePlan(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("token");
    const cardBody = {
      card_number: cardNumber,
      card_name: nameOnCard,
      expiry_date: expiry,
    };
    
    try {
      if (saveCard) {
        await axios.post(
          import.meta.env.VITE_BACKEND_URL + "/api/card/add",
          cardBody,
          { headers: { Authorization: "Bearer " + token } }
        );
      }

      const appliedPoints = usePoints ? Math.min(pointsToUse, maxPoints) : 0;

      const res = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/api/pay/createPayment/" + state?.plan?.plan_id,
        {
          finalAmount,
          pointsToUse: appliedPoints,
        },
        { headers: { Authorization: "Bearer " + token } }
      );

      const session = res.data; // { id: "cs_..." }
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
      if (error) console.error("Stripe redirect error:", error.message);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "You already have a plan");
    }
  }

  // Switch component (accessible, nicer feel)
  const Switch = ({ checked, onChange, disabled }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Use points"
      onClick={() => !disabled && onChange(!checked)}
      className={[
        "relative inline-flex h-7 w-12 items-center rounded-full transition",
        disabled
          ? "bg-gray-200 cursor-not-allowed"
          : checked
          ? "bg-red-500 hover:bg-red-600"
          : "bg-gray-300 hover:bg-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-red-500/40"
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
          checked ? "translate-x-6" : "translate-x-1"
        ].join(" ")}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top bar */}
      <div className="mx-auto max-w-6xl px-4 pt-8 flex items-center">
        <button
          onClick={() => navigate("/membership")}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold ml-10">Checkout</h1>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2">
        {/* Left: Payment form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Add Card Details</h2>
              <p className="mt-1 text-sm text-gray-500">
                You’re subscribing to <span className="font-medium">{plan}</span>
              </p>
            </div>
            <div className="rounded-lg bg-gray-100 px-4 py-2 text-right">
              <div className="text-xs text-gray-500">Price</div>
              <div className="text-lg font-semibold">LKR.{price}</div>
            </div>
          </div>

          {/* ⭐ Use Points block */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800">Use your points</h3>
                  {/* BIG, CLEAR points pill */}
                  <span className="rounded-full bg-red-50 text-red-600 text-xs font-semibold px-3 py-1">
                    {pointsLoading ? "Loading…" : `${availablePoints} pts available`}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Rate: 1 pt = LKR {POINT_VALUE_LKR} • Max this plan:{" "}
                  <span className="font-medium">{maxPoints}</span> pts ({Math.round(MAX_DISCOUNT_RATIO * 100)}% cap)
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">{usePoints ? "On" : "Off"}</span>
                <Switch
                  checked={usePoints}
                  onChange={setUsePoints}
                  disabled={pointsLoading || maxPoints === 0}
                />
              </div>
            </div>

            <div
              className={`mt-4 grid gap-3 transition ${
                usePoints && maxPoints > 0 ? "opacity-100" : "opacity-40 pointer-events-none"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={maxPoints}
                    value={Math.min(pointsToUse, maxPoints)}
                    onChange={(e) => setPointsToUse(Number(e.target.value))}
                    className="w-full accent-red-500"
                    disabled={maxPoints === 0}
                  />
                </div>
                <input
                  type="number"
                  min={0}
                  max={maxPoints}
                  value={Math.min(pointsToUse, maxPoints)}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isNaN(v)) return;
                    setPointsToUse(Math.max(0, Math.min(v, maxPoints)));
                  }}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-right focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  disabled={maxPoints === 0}
                />
                <button
                  type="button"
                  onClick={() => setPointsToUse(maxPoints)}
                  className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-xs hover:bg-gray-200 disabled:opacity-50"
                  disabled={maxPoints === 0}
                >
                  MAX
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Discount from points</span>
                <span className={`font-semibold ${discount > 0 ? "text-green-600" : "text-gray-500"}`}>
                  - {formatLKR(discount)}
                </span>
              </div>
            </div>

            {/* Helper when no points/cap */}
            {!pointsLoading && maxPoints === 0 && (
              <p className="mt-3 text-xs text-amber-600">
                You can’t apply points to this purchase right now (no available points or cap reached).
              </p>
            )}
          </div>

          <form onSubmit={choosePlan} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Name on card</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                placeholder="Name on card"
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
              />
              {errors.nameOnCard && <p className="text-red-500 text-xs mt-1">{errors.nameOnCard}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Card number</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                maxLength={16}
                inputMode="numeric"
              />
              {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Expiry (MM/YY)</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  inputMode="numeric"
                />
                {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">CVV</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                  maxLength={3}
                  inputMode="numeric"
                />
                {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={() => setSaveCard(!saveCard)}
                  className="rounded border-gray-300 text-red-500 focus:ring-red-500"
                />
                Save this card for next time
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  onClick={() => navigate("/membership/savedCards", { state })}
                >
                  View saved cards
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  Pay {formatLKR(finalAmount)}
                </button>
              </div>
            </div>
          </form>

          <p className="mt-6 text-xs text-gray-500">
            By confirming your payment, you agree to the Gettz Fitness Terms of Service and billing.
          </p>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700">Gettz Fitness</h3>
            <div className="mt-6 text-2xl font-mono tracking-widest text-gray-800">•••• •••• •••• ••••</div>
            <div className="mt-6 flex justify-between text-sm text-gray-600">
              <div>
                <div className="text-xs text-gray-500">Card Holder</div>
                <div>{nameOnCard || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Expiry</div>
                <div>{expiry || "MM/YY"}</div>
              </div>
            </div>
          </div>

          {/* Totals w/ discount */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800">Order Summary</h3>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium">{plan}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatLKR(price)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Discount {usePoints && pointsToUse > 0 ? `(Points: ${Math.min(pointsToUse, maxPoints)})` : "(—)"}
                </span>
                <span className={`font-medium ${discount > 0 ? "text-green-600" : "text-gray-500"}`}>
                  - {formatLKR(discount)}
                </span>
              </div>

              <div className="border-t pt-2 flex items-center justify-between">
                <span className="text-gray-800 font-semibold">Total</span>
                <span className="text-gray-900 font-semibold">{formatLKR(finalAmount)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Points used</span>
                <span>{usePoints ? Math.min(pointsToUse, maxPoints) : 0}/{maxPoints}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{
                    width: `${usePoints && maxPoints > 0 ? (Math.min(pointsToUse, maxPoints) / maxPoints) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800">What you get</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {features.map((f, idx) => (
                <li key={`${f}-${idx}`} className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M16.667 5.833 7.5 15l-4.167-4.167"
                      stroke="black"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
