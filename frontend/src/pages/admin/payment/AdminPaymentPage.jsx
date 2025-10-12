import React, { useMemo } from "react";
import { Wallet, CreditCard, ShoppingBag, TrendingUp, Search } from "lucide-react";

// UI-only page: mirrors the dashboard card style and includes a table below.
export default function AdminPaymentPage() {
	// Placeholder data for UI only
	const payments = [
		{
			id: "pmt_1001",
			type: "Membership",
			user: "Kasun Perera",
				amount: 5500,
				discount: 500,
			status: "paid",
			date: new Date().toISOString(),
			session: "sess_abc123",
		},
		{
			id: "pmt_1002",
			type: "Order",
			user: "Nimesha Silva",
				amount: 3200,
				discount: 0,
			status: "paid",
			date: new Date(Date.now() - 86400000 * 1).toISOString(),
			session: "sess_def456",
		},
		{
			id: "pmt_1003",
			type: "Membership",
			user: "Sunil Fernando",
				amount: 4500,
				discount: 0,
			status: "pending",
			date: new Date(Date.now() - 86400000 * 2).toISOString(),
			session: "sess_ghi789",
		},
		{
			id: "pmt_1004",
			type: "Order",
			user: "Ishara Jay",
				amount: 8800,
				discount: 300,
			status: "paid",
			date: new Date(Date.now() - 86400000 * 3).toISOString(),
			session: "sess_jkl012",
		},
		{
			id: "pmt_1005",
			type: "Order",
			user: "Malith Sen",
				amount: 2400,
				discount: 0,
			status: "failed",
			date: new Date(Date.now() - 86400000 * 5).toISOString(),
			session: "sess_mno345",
		},
		{
			id: "pmt_1006",
			type: "Membership",
			user: "Chanuli D.",
				amount: 6500,
				discount: 500,
			status: "paid",
			date: new Date(Date.now() - 86400000 * 7).toISOString(),
			session: "sess_pqr678",
		},
	];

		const summary = useMemo(() => {
			const paid = payments.filter((p) => p.status === "paid");
			const paidAmount = (p) => Math.max(0, (p.amount || 0) - (p.discount || 0));
			const membership = paid.filter((p) => p.type === "Membership");
			const orders = paid.filter((p) => p.type === "Order");
			const totalRevenue = paid.reduce((s, p) => s + paidAmount(p), 0);
			const membershipRevenue = membership.reduce((s, p) => s + paidAmount(p), 0);
			const orderRevenue = orders.reduce((s, p) => s + paidAmount(p), 0);

			// Treat current month as last 30 days for this UI-only version
			const last30 = Date.now() - 1000 * 60 * 60 * 24 * 30;
			const monthlyRevenue = paid
				.filter((p) => new Date(p.date).getTime() >= last30)
				.reduce((s, p) => s + paidAmount(p), 0);

			return { totalRevenue, membershipRevenue, orderRevenue, monthlyRevenue };
		}, [payments]);

	const fmt = (n) => `LKR ${n.toLocaleString("en-LK")}`;

		return (
			<div className="space-y-6 p-4 sm:p-6">
			{/* Header */}
			<div>
				<h2 className="text-2xl font-bold text-gray-900">Payment Dashboard</h2>
				<p className="text-gray-600">Overview of membership and order payments</p>
			</div>

			{/* Stat Cards */}
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

			{/* Table Card */}
			<div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
					<h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
					<div className="relative">
						<Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							className="pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
							placeholder="Search by user, type, or session..."
						/>
					</div>
				</div>
				<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
											<Th>Id</Th>
											<Th>Type</Th>
											<Th>User</Th>
											<Th>Discount</Th>
											<Th>Paid Amount</Th>
											<Th>Status</Th>
											<Th>Date</Th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{payments.map((p) => (
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
												<Td>
													<span className="text-sm text-gray-900">{fmt(p.discount || 0)}</span>
												</Td>
												<Td>
													<span className="text-sm font-medium text-gray-900">{fmt(Math.max(0, (p.amount || 0) - (p.discount || 0)))}</span>
												</Td>
												<Td>
													<StatusBadge status={p.status} />
												</Td>
												<Td>
													<span className="text-sm text-gray-500">{new Date(p.date).toLocaleDateString()}</span>
												</Td>
								</tr>
							))}

							{payments.length === 0 && (
								<tr>
												<td colSpan={7} className="px-6 py-12 text-center text-gray-500">
										No payments found
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

function Th({ children }) {
	return (
		<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
			{children}
		</th>
	);
}

function Td({ children }) {
	return <td className="px-6 py-4 whitespace-nowrap align-middle">{children}</td>;
}

function StatusBadge({ status }) {
	const map = {
		paid: "bg-green-100 text-green-800",
		pending: "bg-orange-100 text-orange-800",
		failed: "bg-red-100 text-red-800",
		refunded: "bg-gray-100 text-gray-800",
	};
	const cls = map[status] || "bg-gray-100 text-gray-800";
	const label = String(status || "-").replace(/^./, (c) => c.toUpperCase());
	return (
		<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>
			{label}
		</span>
	);
}
