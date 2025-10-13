import Revenue from "../model/revenue.js";

// Fetch paid rows and compute sums using simple loops
export async function getRevenueSummary(req, res) {
	try {
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

		const rows = await Revenue.find({ status: "paid" })
			.select("paidAmount type paidAt")
			.lean();

		let totalRevenue = 0;
		let membershipRevenue = 0;
		let orderRevenue = 0;
		let currentMonthRevenue = 0;

		for (let i = 0; i < rows.length; i++) {
			const r = rows[i];
			const amount = Number(r && r.paidAmount ? r.paidAmount : 0);
			totalRevenue += amount;

			if (r && r.type === "membership") {
				membershipRevenue += amount;
			} else if (r && r.type === "order") {
				orderRevenue += amount;
			}

			if (r && r.paidAt) {
				const paidDate = new Date(r.paidAt);
				if (paidDate >= monthStart && paidDate < monthEnd) {
					currentMonthRevenue += amount;
				}
			}
		}

		res.json({ totalRevenue, currentMonthRevenue, membershipRevenue, orderRevenue });
	} catch (err) {
		res.status(500).json({ message: "Failed to compute revenue summary" });
	}
}


export function listRevenue(req, res) {
	// Simple fetch: return all revenue records without pagination (representation only)
	Revenue.find({})
		.populate({ path: "user_id", select: "firstName lastName" })
		.sort({ paidAt: -1 })
		.then((rows) => {
			const data = rows.map((r) => ({
				id:
					r?.referenceId != null
						? `${r?.type === "order" ? "#ORD_" : "#TA_"}${r.referenceId}`
						: "-",
				type: r?.type ? r.type.charAt(0).toUpperCase() + r.type.slice(1) : "-",
				user: r?.user_id ? `${r.user_id.firstName || ""} ${r.user_id.lastName || ""}`.trim() : "-",
				discount: Number(r?.discount || 0),
				paidAmount: Number(r?.paidAmount || 0),
				status: r?.status,
				date: r?.paidAt,
			}));
			res.status(200).json({ data });
		})
		.catch(() => {
			res.status(500).json({ message: "Error retrieving revenue list" });
		});
}

