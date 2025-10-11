
import successGif from "../../../assets/payment-success.gif";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useCart } from "./supplement_cart";

export default function SupplementPaymentSuccess() {
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get("session_id");
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center bg-white text-gray-900">
      <img src={successGif} alt="Payment Success" className="w-40 h-40 mb-6" />
      <h1 className="text-2xl font-bold text-green-700 mb-2">Payment Successful!</h1>
      <p className="mb-4">Your supplement order has been placed successfully.</p>
      <div className="bg-gray-100 rounded-lg p-4 mb-4">
        <span className="font-mono text-sm">Session ID: {sessionId}</span>
      </div>
      {/* TODO: Add receipt download button here if needed */}
      <a href="/store" className="mt-4 inline-block rounded-lg bg-red-600 text-white px-6 py-2 font-semibold hover:bg-red-700">Back to Store</a>
    </div>
  );
}
