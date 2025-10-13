import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Search,
  Filter,
  RotateCcw,
  FileDown,
} from "lucide-react";
import axios from "axios";
import { generatePaymentsPDF } from "../../../utils/paymentsReport";

export default function AdminPaymentPage() {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    membershipRevenue: 0,
    orderRevenue: 0,
  });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // NEW: Filters
  const [q, setQ] = useState(""); // search term
  const [statusFilter, setStatusFilter] = useState(""); // paid | pending | failed | refunded | ""
  const [typeFilter, setTypeFilter] = useState(""); // membership | order | ""
  const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState("");   // YYYY-MM-DD

  const fmt = (n) => `LKR ${Number(n || 0).toLocaleString("en-LK")}`;

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("jwt");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const base = import.meta.env.VITE_BACKEND_URL;
        const { data } = await axios.get(`${base}/api/revenue/summary`, { headers });
        setSummary({
          totalRevenue: Number(data?.totalRevenue || 0),
          monthlyRevenue: Number(data?.currentMonthRevenue || 0),
          membershipRevenue: Number(data?.membershipRevenue || 0),
          orderRevenue: Number(data?.orderRevenue || 0),
        });
      } catch (err) {
        console.error("Failed to load revenue summary", err?.message || err);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        const token =
          localStorage.getItem("token") || localStorage.getItem("jwt");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const base = import.meta.env.VITE_BACKEND_URL;
        const { data } = await axios.get(`${base}/api/revenue/list`, { headers });
        setPayments(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error("Failed to load revenue list", err?.message || err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  // Unique types from data (fallback to common ones)
  const typeOptions = useMemo(() => {
    const set = new Set(payments.map((p) => String(p.type || "").toLowerCase()).filter(Boolean));
    if (set.size === 0) return ["membership", "order"];
    return Array.from(set);
  }, [payments]);

  // Filtering logic
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
    const toTime = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;

    return payments.filter((p) => {
      // search in id, user, type, session (if present)
      const matchesQ =
        !qLower ||
        [p.id, p.user, p.type, p.session_id]
          .map((v) => (v ? String(v).toLowerCase() : ""))
          .some((s) => s.includes(qLower));

      const matchesStatus =
        !statusFilter || String(p.status || "").toLowerCase() === statusFilter;

      const matchesType =
        !typeFilter || String(p.type || "").toLowerCase() === typeFilter;

      const t = p.date ? new Date(p.date).getTime() : null;
      const matchesFrom = !fromTime || (t && t >= fromTime);
      const matchesTo = !toTime || (t && t <= toTime);

      return matchesQ && matchesStatus && matchesType && matchesFrom && matchesTo;
    });
  }, [payments, q, statusFilter, typeFilter, dateFrom, dateTo]);

  // Totals for the filtered set
  const totals = useMemo(() => {
    let count = filtered.length;
    let totalPaid = 0;
    let totalDiscount = 0;
    for (const p of filtered) {
      totalPaid += Number(p.paidAmount || 0);
      totalDiscount += Number(p.discount || 0);
    }
    return { count, totalPaid, totalDiscount };
  }, [filtered]);

  const resetFilters = () => {
    setQ("");
    setStatusFilter("");
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const downloadPDF = () => {
    generatePaymentsPDF(filtered, totals, { title: "Payments Report" });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-gray-50/40">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payment Dashboard</h2>
        <p className="text-gray-600">Overview of membership and order payments</p>
      </div>
  
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          label="Total Revenue"
          value={fmt(summary.totalRevenue)}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={fmt(summary.monthlyRevenue)}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={CreditCard}
          label="Membership Revenue"
          value={fmt(summary.membershipRevenue)}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={ShoppingBag}
          label="Order Revenue"
          value={fmt(summary.orderRevenue)}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Filters + Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          {/* Search */}
          <div className="relative lg:max-w-sm w-full">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
              placeholder="Search by user, type, or session..."
            />
          </div>

          {/* Status */}
          <div className="w-full lg:w-44">
            <Label>Status</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Type */}
          <div className="w-full lg:w-48">
            <Label>Type</Label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">All</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/^./, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="w-full lg:w-48">
            <Label>From</Label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div className="w-full lg:w-48">
            <Label>To</Label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm hover:bg-gray-50 transition"
              title="Reset filters"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={downloadPDF}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-sm text-white shadow-sm hover:shadow transition hover:bg-red-700"
              title="Download PDF report"
            >
              <FileDown className="h-4 w-4" />
              PDF Report
            </button>
          </div>
        </div>

        {/* Totals bar for filtered set */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MiniTotal label="Filtered Count" value={totals.count} />
          <MiniTotal label="Total Discount" value={fmt(totals.totalDiscount)} />
          <MiniTotal label="Total Paid" value={fmt(totals.totalPaid)} />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3 bg-white/70 backdrop-blur">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          <div className="hidden sm:flex items-center gap-2 text-gray-500">
            <Filter className="h-4 w-4" />
            <span className="text-sm">
              Showing <span className="font-medium text-gray-700">{filtered.length}</span> of{" "}
              <span className="font-medium text-gray-700">{payments.length}</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <Th>Id</Th>
                <Th>Type</Th>
                <Th>User</Th>
                <Th className="text-right">Discount</Th>
                <Th className="text-right">Paid Amount</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-6 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <Td>
                      <div className="text-sm text-gray-900">{p.id}</div>
                    </Td>
                    <Td>
                      <span className="text-sm text-gray-900">{p.type}</span>
                    </Td>
                    <Td>
                      <div className="text-sm text-gray-900">{p.user}</div>
                    </Td>
                    <Td className="text-right">
                      <span className="text-sm text-gray-900">{fmt(p.discount || 0)}</span>
                    </Td>
                    <Td className="text-right">
                      <span className="text-sm font-medium text-gray-900">{fmt(p.paidAmount || 0)}</span>
                    </Td>
                    <Td>
                      <StatusBadge status={p.status} />
                    </Td>
                    <Td>
                      <span className="text-sm text-gray-500">
                        {p.date ? new Date(p.date).toLocaleDateString() : "-"}
                      </span>
                    </Td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No payments match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* --- UI bits --- */

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div className="mb-1 text-xs font-semibold text-gray-600 uppercase">{children}</div>;
}

function MiniTotal({ label, value }) {
  return (
    <div className="rounded-md border border-gray-200 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-6 py-4 whitespace-nowrap align-middle ${className}`}>{children}</td>;
}

function StatusBadge({ status }) {
  const map = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-orange-100 text-orange-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  };
  const cls = map[String(status || "").toLowerCase()] || "bg-gray-100 text-gray-800";
  const label = String(status || "-")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
  return <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>{label}</span>;
}
