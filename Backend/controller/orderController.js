import Order from "../model/order.js";
import User from "../model/user.js";
import Supplement from "../model/supplement.js";
import Stripe from "stripe";
import { sendStoreOrderReceipt } from "../utils/mailer.js";
import Revenue from "../model/revenue.js";
const stripe = new Stripe(process.env.SECRET_KEY2);

// Create a new supplement order and Stripe session
export async function createOrder(req, res) {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "You must be logged in to checkout." });
  }
  try {
    const { cart, finalAmount, pointsToUse } = req.body;
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }
    // Points logic
    const POINT_VALUE_LKR = 1;
    const MAX_DISCOUNT_RATIO = 0.5;
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    // Fetch user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Please log in again." });
    }
    const availablePoints = user?.point || 0;
    const maxPointsAllowedByPrice = Math.floor(
      (subtotal * MAX_DISCOUNT_RATIO) / POINT_VALUE_LKR
    );
    const maxPoints = Math.max(
      0,
      Math.min(availablePoints, maxPointsAllowedByPrice)
    );
    const appliedPoints = Math.min(pointsToUse || 0, maxPoints);
    if (pointsToUse && pointsToUse > availablePoints) {
      return res.status(400).json({
        message: `You do not have enough points. Available: ${availablePoints}`,
      });
    }
    if (pointsToUse && pointsToUse > maxPoints) {
      return res.status(400).json({
        message: `You can only use up to ${maxPoints} points for this order.`,
      });
    }
    const discount = appliedPoints * POINT_VALUE_LKR;
    const paidAmount = Math.max(0, subtotal - discount);

    // Stripe session
    let session;
    try {
      // Only one line item for the total after discount
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        locale: "en",
        line_items: [
          {
            price_data: {
              currency: "LKR",
              product_data: { name: `Supplements (${cart.length} items)` },
              unit_amount: Math.round(paidAmount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `http://localhost:5173/supplement/paymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: "http://localhost:5173/supplement/paymentFailed",
        metadata: {
          userId: req.user._id.toString(),
          appliedPoints,
          discount,
          paidAmount,
        },
      });
    } catch (stripeErr) {
      return res
        .status(500)
        .json({ message: `Stripe error: ${stripeErr.message}` });
    }

    // Generate order_id
    const lastOrder = await Order.find().sort({ _id: -1 }).limit(1);
    let order_id = 1;
    if (lastOrder.length > 0) {
      order_id = lastOrder[0].order_id + 1;
    }

    const order = new Order({
      user_id: req.user._id,
      order_id,
      cart,
      subtotal,
      paidAmount,
      discount,
      session_id: session.id,
      status: "pending",
      pointsUsed: appliedPoints,
    });
    await order.save();

    // Upsert a pending revenue entry for this order so it appears in the admin table
    try {
      await Revenue.findOneAndUpdate(
        { referenceId: Number(order.order_id) },
        {
          referenceId: Number(order.order_id),
          type: "order",
          user_id: order.user_id,
          discount: order.discount || 0,
          paidAmount: order.paidAmount || 0,
          status: "pending",
          paidAt: order.createdAt || new Date(),
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    } catch (revErr) {
      console.error("Revenue upsert (order pending) failed:", revErr?.message || revErr);
    }
    res.json({ id: session.id });
    
  } catch (err) {
    console.error("Order creation error:", err);
    // Return the actual error message if available
    if (err && err.message) {
      res.status(500).json({ message: err.message });
    } else {
      res
        .status(500)
        .json({ message: "Unknown error occurred during checkout." });
    }
  }
}
export async function fetchOrder(req, res) {
  const session_id = req.params.id;
  try {
    const order = await Order.findOne({ session_id: session_id });

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: err });
  }
}

// List supplement orders for the authenticated user
export async function listMyOrders(req, res) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
    const orders = await Order.find({ user_id: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ data: orders });
  } catch (err) {
    console.error("listMyOrders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
}

// Stripe webhook handler
export async function stripeWebhook(req, res) {
  // With express.raw(), req.body is a Buffer – do NOT JSON.parse it.
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // ✅ Buffer from express.raw
      sig,
      process.env.WEBHOOK_KEY2 // ✅ MUST match Stripe CLI “Signing secret”
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const email = session.customer_details?.email;
        // Supplement order payment success
        const order = await Order.findOne({ session_id: session.id });
        if (order) {
          const wasAlreadyPaid = String(order.status).toLowerCase() === "paid";

          // Decrement supplement stock only once per order
          if (!wasAlreadyPaid && Array.isArray(order.cart) && order.cart.length > 0) {
            for (const it of order.cart) {
              try {
                const codeRaw = it?.Sup_code ?? it?.id;
                const code = Number(codeRaw);
                const qty = Math.max(0, Number(it?.qty || 0));
                if (!Number.isFinite(code) || qty <= 0) continue;

                // Load current supplement, adjust quantity and status
                const doc = await Supplement.findOne({ Sup_code: code });
                if (!doc) continue;
                const current = Number(doc.Sup_quantity) || 0;
                const nextQty = Math.max(0, current - qty);
                const nextStatus = nextQty === 0 ? "Out of stock" : "In stock";
                doc.Sup_quantity = nextQty;
                doc.Sup_status = nextStatus;
                await doc.save();
              } catch (invErr) {
                console.error("Inventory decrement failed for item:", it, invErr?.message || invErr);
              }
            }
          }

          order.status = "paid";
          order.paymentIntent = session.payment_intent;
          await order.save();
          // Update Revenue to paid for this order
          try {
            await Revenue.findOneAndUpdate(
              { referenceId: Number(order.order_id) },
              {
                referenceId: Number(order.order_id),
                type: "order",
                user_id: order.user_id,
                discount: order.discount || 0,
                paidAmount: order.paidAmount || 0,
                status: "paid",
                paidAt: new Date(),
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } catch (revErr) {
            console.error("Revenue update failed (order paid):", revErr?.message || revErr);
          }

          const user = await User.findById(session.metadata?.userId);
          user.point = user.point - session.metadata?.appliedPoints;
          await user.save();

          await sendStoreOrderReceipt(email, session.id);
        } else {
          console.warn("Order not found for session:", session.id);
        }
        break;
      }
      case "checkout.session.expired": {
        // Supplement order payment expired/canceled
        const session = event.data.object;
        const order = await Order.findOne({ session_id: session.id });
        if (order) {
          order.status = "canceled";
          await order.save();
          // Update Revenue to canceled for this order
          try {
            await Revenue.findOneAndUpdate(
              { referenceId: Number(order.order_id) },
              { status: "canceled", paidAt: new Date() },
              { upsert: true }
            );
          } catch (revErr) {
            console.error("Revenue update failed (order canceled):", revErr?.message || revErr);
          }
        }
        break;
      }
      case "payment_intent.payment_failed": {
        // Supplement order payment failed
        const pi = event.data.object;
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: pi.id,
          limit: 1,
        });
        const sessionId = sessions.data?.[0]?.id;
        if (sessionId) {
          const order = await Order.findOne({ session_id: sessionId });
          if (order) {
            order.status = "failed";
            await order.save();
            // Update Revenue to failed for this order
            try {
              await Revenue.findOneAndUpdate(
                { referenceId: Number(order.order_id) },
                { status: "failed", paidAt: new Date() },
                { upsert: true }
              );
            } catch (revErr) {
              console.error("Revenue update failed (order failed):", revErr?.message || revErr);
            }
          }
        }
        break;
      }
      default:
        
        break;
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).send("Server error while handling webhook");
  }
}
