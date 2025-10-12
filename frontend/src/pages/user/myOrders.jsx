import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Calendar } from "lucide-react";

const fmtLKR = (n) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/order/my`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res?.data?.data || [];
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load your orders. Please try again."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getStatusMeta = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "paid") return { Icon: CheckCircle, classes: "bg-green-100 text-green-700", label: "PAID" };
    if (s === "failed") return { Icon: XCircle, classes: "bg-red-100 text-red-700", label: "FAILED" };
    if (s === "canceled") return { Icon: XCircle, classes: "bg-red-100 text-red-700", label: "CANCELED" };
    return { Icon: Calendar, classes: "bg-yellow-100 text-yellow-700", label: (status || "PENDING").toString().toUpperCase() };
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-black mb-6">My Supplement Orders</h2>

      {loading ? (
        <div className="text-gray-500">Loading your orders...</div>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-500">You haven't placed any supplement orders yet.</div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {orders.map((o) => (
            <li
              key={o._id}
              className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 flex flex-col gap-3"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                  Order #{o.order_id}
                </span>
                {(() => {
                  const { Icon: StatusIcon, classes, label } = getStatusMeta(o.status);
                  return (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${classes}`}>
                      <StatusIcon className="h-4 w-4" />
                      {label}
                    </span>
                  );
                })()}
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Placed on: {(o.createdAt || "").toString().split("T")[0]}</span>
              </div>

              {/* Items List */}
              <div className="font-semibold text-gray-700">Items:</div>
              <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                {(o.cart || []).map((it, idx) => (
                  <li key={idx}>
                    {it?.name ?? "-"} × {it?.qty ?? 0} - {fmtLKR(it?.price)} each
                  </li>
                ))}
              </ul>

              {/* Totals Section */}
              <div className="mt-3 border-t pt-3 text-sm text-gray-700 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">{fmtLKR(o.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="font-medium text-red-500">
                    - {fmtLKR(o.discount || 0)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 mt-2 pt-2 border-t">
                  <span>Paid Amount</span>
                  <span>{fmtLKR(o.paidAmount)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
