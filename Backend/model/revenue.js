import mongoose from "mongoose";
import "./user.js";

// Minimal Revenue schema for Admin Payment table
// Columns: Id (referenceId), Type, User, Discount, Paid Total (paidAmount), Status, Date (paidAt)
const revenueSchema = new mongoose.Schema(
	{
		referenceId: { type: Number, required: true }, // stores payment_id (Payment) or order_id (Order)
		type: { type: String, enum: ["membership", "order"], required: true },
		user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		discount: { type: Number, default: 0, min: 0 },
		paidAmount: { type: Number, required: true, min: 0 },
		status: { type: String, enum: ["pending", "paid", "failed", "refunded", "canceled"], required: true },
		paidAt: { type: Date, required: true },
	},
	{ timestamps: true }
);

const Revenue = mongoose.model("Revenue", revenueSchema);
export default Revenue;

