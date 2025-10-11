import failedPng from "../../../assets/card.png";
import { Link } from "react-router-dom";

export default function SupplementPaymentFailed() {
  const message = "Unfortunately, the payment failed.";
  const buttonText = "Go back and try again";
  const retryHref = "/store";
  const supportHref = "/contactUs";

  return (
    <div className="min-h-full bg-white flex flex-col">
      {/* centered content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center">
          <FailedIcon />

          {/* Message */}
          <h1 className="mt-6 text-[22px] md:text-2xl font-bold">{message}</h1>

          {/* Retry button */}
          <Link
            to={retryHref}
            className="mt-6 inline-flex items-center rounded-full bg-red-500 px-6 py-3 text-white font-semibold shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
          >
            {buttonText}
          </Link>

          {/* Secondary action */}
          <div className="mt-4">
            <Link
              to={supportHref}
              className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
            >
              Need help? Contact support
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ===== Pink gradient fail icon ===== */
function FailedIcon() {
  return (
    <img
      src={failedPng}
      alt="Payment failed"
      className="mx-auto h-70 w-70"
      aria-label="Payment failed"
    />
  );
}
