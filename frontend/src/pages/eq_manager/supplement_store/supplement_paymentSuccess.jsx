import { useEffect, useState } from "react";
import successGif from "../../../assets/payment-success.gif";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { generateReceiptPDF } from "../../../utils/paymentReciept";
import { generateStoreReceiptPDF } from "../../../utils/storePaymentReciept";

export default function SupplementPaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [loaded, setLoaded] = useState(false);

  
  const [amount, setAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [currency, setCurrency] = useState("LKR");
  const [date, setDate] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [status, setStatus] = useState("");
  const [paymentAllData, setPaymentAllData] = useState(null);

  const sessionId = searchParams.get("session_id");
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = [userData?.firstName, userData?.lastName].filter(Boolean).join(" ");

  useEffect(() => {
    if (!loaded && sessionId) {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/order/fetchOrder/${sessionId}`)
        .then((res) => {
          const p = res.data;
          setPaymentAllData(p);
          
          setAmount(Number(p?.subtotal || 0));
          setDiscount(Number(p?.discount || 0));
          setPaidAmount(Number(p?.paidAmount || 0));
          setCurrency(p?.currency || "LKR");
          setDate((p?.createdAt || "").split("T")[0] || "");
          setPaymentId(p?.order_id || "");
          setStatus(p?.status || "");
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }
  }, [loaded, sessionId]);

  const money = (n) =>
    `${currency}. ${Number(n || 0).toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-full bg-white text-[#0f172a] flex flex-col">
      {/* Main two-panel layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 flex-1">
        {/* LEFT: Copy + illustration */}
        <section className="px-6 sm:px-10 lg:px-14 py-10 sm:py-14">
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold">
            <span className="text-green-600">Payment Successful!</span>
          </h1>

          <p className="mt-5 max-w-xl text-slate-600">
            Payment successful — your membership plan is now active! We’ve emailed your receipt and
            updated your account with full member benefits. Head to your dashboard to explore
            training programs and manage your plan or billing details. Welcome to Gettz Fitness — let’s get to work!
          </p>

          {/* RECEIPT */}
          <div className="mt-8 w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-700 text-center">Payment receipt</h2>
            <hr className="my-2 border-slate-200 mx-auto" />

            <div className="mt-4 space-y-2 text-sm">
              
              <Row label="Customer" value={fullName || "-"} />
              <Row label="Transaction ID" value={`#ORD_${paymentId}`} mono />
              <Row label="Date" value={date || "-"} />
              <Row label="Status" value={status?.toUpperCase()} />

              <div className="my-3 border-t border-slate-200" />

              {/* Price breakdown */}
              <Row label="Subtotal" value={money(amount)} />
              <Row label="Discount" value={`- ${money(discount)}`} />

              {/* --- Separator line between discount & paid amount --- */}
              <div className="mt-2 mb-1 border-t border-slate-400" />

              {/* Paid Amount */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Paid amount</span>
                <span className="font-bold text-slate-900">{money(paidAmount)}</span>
              </div>

              {/* --- Double underline under Paid amount (math style) --- */}
              <div className="mt-1">
                <div className="border-t border-slate-400" />
                <div className="mt-0.5 border-t-2 border-slate-600" />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-500"
            >
              Go to Home
            </Link>
            <button
              type="button"
              onClick={() => generateStoreReceiptPDF(paymentAllData, fullName)}
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
              disabled={!paymentAllData}
            >
              Download receipt
            </button>
          </div>
        </section>

        {/* RIGHT: GIF */}
        <aside className="relative overflow-hidden bg-[#FFFFFF]">
          <div className="flex h-full items-center justify-center pt-16 pb-28">
            <CardIllustration gifSrc={successGif} />
          </div>
          <div className="absolute top-8 right-0 left-0 text-left px-6">
            <p className="text-xl font-bold text-red-600">Thank you</p>
            <h3 className="text-xl font-bold">
              For Choosing <span className="text-red-600">Getzz</span> Fitness
            </h3>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-slate-800 ${mono ? "tracking-tight font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function CardIllustration({ gifSrc = successGif }) {
  return (
    <div className="relative w-full max-w-[520px]">
      <img
        src={gifSrc}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 object-contain"
      />
    </div>
  );
}
