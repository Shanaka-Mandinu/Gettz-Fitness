import Order from "../model/order.js";
import User from "../model/user.js";
import Stripe from "stripe";
import { sendStoreOrderReceipt } from "../utils/mailer.js";
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

    // Deduct points immediately (optional: or after payment success in webhook)
    if (appliedPoints > 0) {
      user.point = availablePoints - appliedPoints;
      await user.save();
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
  console.log("Fetch order called with ID:", req.params.id);
  const session_id = req.params.id;
  try {
    const order = await Order.findOne({ session_id: session_id });

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: err });
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
          order.status = "paid";
          order.paymentIntent = session.payment_intent;
          // after marking order "paid" in checkout.session.completed:
          

          await order.save();
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
          }
        }
        break;
      }
      default:
        // No-op for other event types you’re not using
        break;
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).send("Server error while handling webhook");
  }
}
