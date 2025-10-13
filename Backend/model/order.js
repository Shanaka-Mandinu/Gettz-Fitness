import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order_id: {
      type: Number,
      required: true,
      unique: true,
    },
    cart: [
      {
        id: String,
        name: String,
        qty: Number,
        price: Number,
      }
    ],
      subtotal: {
      type: Number,
      required: true,
    },
      paidAmount: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    session_id: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed","canceled"],
      default: "pending",
    },
      pointsUsed: { type: Number, default: 0 },
      paymentIntent: { type: String },
  },
  { timestamps: true }
);
const Order = mongoose.model("Order", orderSchema);

export default Order;