import mongoose from "mongoose";
import "./user.js";
import "./Subscription_Model.js";

const paymentSchema = new mongoose.Schema({
    payment_id:{type:Number,required:true},
    subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription"},
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    paid_amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "LKR" },
    session_id: { type: String, unique: true, required: true },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    paid_at: { type: Date },
    discount: { type: Number, default: 0, min: 0 },
    planName: { type: String, default: "" },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
)

const Payment= mongoose.model("Payment",paymentSchema);

export default Payment;