import { Link } from "react-router-dom";
import { generateReceiptPDF } from "../../../utils/paymentReciept";
import {
  Crown,
  CalendarDays,
  CreditCard,
  BadgeCheck,
  BadgeX,
  AlertCircle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "../../../components/loader-animate2";

export default function ViewSubscription() {
  const [loaded, setLoaded] = useState(false);
  const [subscription, setSubscription] = useState([]);
  const [payment, setPayment] = useState([]);
  const userData = JSON.parse(localStorage.getItem("user"));
  const fullName = userData.firstName + " " + userData.lastName;

  useEffect(() => {
    if (!loaded) {
      const token = localStorage.getItem("token");
      axios
        .get(import.meta.env.VITE_BACKEND_URL + "/api/sub/viewSub", {
          headers: {
            Authorization: "Bearer " + token,
          },
        })
        .then((response) => {
          setSubscription(response.data);

          axios
            .get(import.meta.env.VITE_BACKEND_URL + "/api/pay/fetchPayment", {
              headers: {
                Authorization: "Bearer " + token,
              },
            })
            .then((response) => {
              setPayment(response.data);
              console.log(response.data);
              setLoaded(true);
            });
        });
    }
  }, [loaded]);

  function handleCancelSubscription() {
    console.log("runs handling subs");
    const token = localStorage.getItem("token");

    axios
      .post(
        import.meta.env.VITE_BACKEND_URL + "/api/sub/cancelSub",
        {},
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      )
      .then(() => {
        userData.role = "user"; 
        localStorage.setItem("user", JSON.stringify(userData));

        setLoaded(false);
      });
  }

  return (
    <div className="w-full">
      {/* Page container */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              My Subscription
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage your plan for Gettz Fitness.
            </p>
          </div>
        </div>
        {!loaded ? (
          <Loader />
        ) : (
          <div>
            {/* Subscription card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              {subscription.length == 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white shadow-sm p-10 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <Crown className="h-6 w-6 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    No Active Subscription
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    You don’t have any active plans right now. Choose a plan to
                    unlock premium features and continue using Gettz Fitness.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Link to="/membership">
                      <button className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-700">
                        <Crown className="h-4 w-4" />
                        View Plans
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {subscription.length != 0 &&
                subscription.map((sub, index) => {
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-5 sm:p-6"
                    >
                      {/* Left badge */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                        <Crown className="h-5 w-5" />
                      </div>

                      {/* Middle content */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-slate-900">
                            {sub.plan_id.plan_name}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1
                                    ${
                                      sub.status === "active"
                                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200/70"
                                        : sub.status === "pending"
                                        ? "bg-amber-50 text-amber-700 ring-amber-200/70"
                                        : "bg-slate-50 text-slate-700 ring-slate-200/70"
                                    }`}
                          >
                            {sub.status == "active" && (
                              <BadgeCheck className="h-3.5 w-3.5" />
                            )}
                            {sub.status == "pending" && <AlertCircle />}
                            {sub.status == "cancelled" && <BadgeX />}
                            {sub.status}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600">
                          LKR {sub.plan_id.price} / For —{sub.plan_id.duration}{" "}
                          Days
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <CalendarDays className="h-4 w-4 text-slate-500" />
                            <div>
                              <span className="text-slate-500">Start:</span>{" "}
                              <span className="font-medium text-slate-800">
                                {sub.start_date.split("T")[0]}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <CalendarDays className="h-4 w-4 text-slate-500" />
                            <div>
                              <span className="text-slate-500">Ends:</span>{" "}
                              <span className="font-medium text-slate-800">
                                {sub.end_date.split("T")[0]}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <button
                          onClick={() => {
                            handleCancelSubscription();
                          }}
                          className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                        >
                          Cancel Plan
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Billing history */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-900">
                Billing History
              </h3>
              <p className="mt-1 text-sm text-slate-500 mb-8">
                Your recent payments for Gettz Fitness.
              </p>

              {/*For No bills*/}
              {payment.length == 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white shadow-sm p-10 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <X className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    No Billing History
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    You don’t have any past payments yet. Once you subscribe to
                    a plan, your receipts will appear here.
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {payment.map((payment, index) => {
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
                          #TA_{payment.payment_id}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            <span className="text-slate-900">
                              Payment For Plan:{" "}
                            </span>
                            {payment.planName}
                          </div>
                          <div className="text-xs text-slate-600">
                            Payment Date: {payment.createdAt.split("T")[0]}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-900">
                          LKR. {payment.amount}
                        </span>

                        {/* status badge */}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1
                                        ${
                                          payment.status === "pending"
                                            ? "bg-amber-50 text-amber-700 ring-amber-200/70"
                                            : payment.status === "failed"
                                            ? "bg-rose-50 text-rose-700 ring-rose-200/70"
                                            : "bg-emerald-50 text-emerald-700 ring-emerald-200/70"
                                        }`}
                        >
                          {payment.status}
                        </span>

                        {/* Download button after payment is successful */}
                        {payment.status === "paid" && (
                          <button
                            onClick={() =>
                              generateReceiptPDF(payment, fullName)
                            }
                            className="cursor-pointer rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100 transition"
                          >
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
