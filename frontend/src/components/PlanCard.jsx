import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function PlanCard(props) {
  const plan = props.plan;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  function choosePlan(plan) {
    if (token == null) {
      toast.error("You Have to login first");
      navigate("/login");
      return
    }
    navigate("/membership/card", { state: { plan: plan } });
  }
  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition
        ${
          plan.popular
            ? "border-red-600 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
            : "border-black/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
        }`}
    >
      {/* Popular badge */}
      {plan.popular && (
        <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
          Most Popular
        </span>
      )}

      <header className="mb-4">
        <h3 className="text-xl font-semibold">{plan.plan_name}</h3>
        <p className="mt-1 text-sm text-black/70">{plan.description}</p>
      </header>

      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">LKR.{plan.price}</span>
          <span className="text-base text-black/70">/For {plan.duration} days</span>

        </div>
      </div>

      <ul className="mb-6 space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
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

      <button
        type="button"
        onClick={() => {
          choosePlan(plan);
        }}
        className={`mt-auto w-full rounded-xl border px-4 py-3 text-sm font-semibold transition cursor-pointer
          ${
            plan.popular
              ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
              : "border-black/15 text-black hover:bg-red-600 hover:text-white hover:border-red-600"
          }`}
      >
        Choose
      </button>
    </article>
  );
}
