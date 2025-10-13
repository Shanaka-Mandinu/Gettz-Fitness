import Stripe from "stripe";
import Subscription from "../model/Subscription_Model.js";
import Payment from "../model/Payment_Model.js";
import MembershipPlan from "../model/Membership_Plans_Model.js";
import { sendPaymentReciept } from "../utils/mailer.js";
import User from "../model/user.js";
import Revenue from "../model/revenue.js";
const stripe = new Stripe(process.env.SECRET_KEY);

export async function handleWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.WEBHOOK_KEY
    );
  } catch (e) {
    console.error("Webhook signature verification failed:", e.message);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("Session Checked Supp");
        const session = event.data.object; // Stripe.Checkout.Session

        // 1) Update local payment
        const pay = await Payment.findOneAndUpdate(
          { session_id: session.id },
          {
            status: "paid",
          },
          { new: true }
        );
        // 1b) Update Revenue row (pending -> paid)
        try {
          if (pay) {
            await Revenue.findOneAndUpdate(
              { referenceId: Number(pay.payment_id) },
              {
                referenceId: Number(pay.payment_id),
                type: "membership",
                user_id: pay.user_id,
                discount: pay.discount || 0,
                paidAmount: pay.paid_amount || 0,
                status: "paid",
                paidAt: pay.paid_at || new Date(),
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }
        } catch (revErr) {
          console.error("Revenue update failed (completed):", revErr?.message || revErr);
        }
        
        // 2) Create/activate subscription 
        try {
          const userId = session.metadata?.userId; 
          const planId = session.metadata?.planId;
          const email = session.customer_details?.email;
          const sub = await Subscription.findOneAndUpdate(
            { user_id: userId },
            { status: "active" }
          );

          const user = await User.findById(userId);
          user.role = "member";
          console.log("Points to deduction: ", session.metadata?.appliedPoints);
          user.point = (user.point || 0) - (parseInt(session.metadata?.appliedPoints) || 0);
          await user.save();
          const top = await Subscription.aggregate([
            { $match: { status: "active" } },
            { $group: { _id: "$plan_id", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
          ]);

          if (top.length > 0) {
            const topPlanId = top[0]._id;

            // 1) Set all plans' popular = false
            await MembershipPlan.updateMany({}, { $set: { popular: false } });

            // 2) Mark only top plan as popular = true
            await MembershipPlan.findByIdAndUpdate(topPlanId, {
              $set: { popular: true },
            });

            
            //await sendPaymentReciept(email, session.id);
          }
        } catch (subErr) {
          console.error(
            "Sub creation failed:",
            subErr?.response?.data || subErr.message
          );
          
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const pay = await Payment.findOneAndUpdate(
          { session_id: session.id },
          { status: "failed" },
          { new: true }
        );
        try {
          if (pay) {
            await Revenue.findOneAndUpdate(
              { referenceId: Number(pay.payment_id) },
              { status: "failed", paidAt: new Date() },
              { upsert: true }
            );
          }
        } catch (revErr) {
          console.error("Revenue update failed (expired):", revErr?.message || revErr);
        }
        
        break;
      }

      
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: pi.id,
          limit: 1,
        });
        const sessionId = sessions.data?.[0]?.id;
        const pay = await Payment.findOneAndUpdate(
          { session_id: sessionId },
          { status: "failed" },
          { new: true }
        );
        try {
          if (pay) {
            await Revenue.findOneAndUpdate(
              { referenceId: Number(pay.payment_id) },
              { status: "failed", paidAt: new Date() },
              { upsert: true }
            );
          }
        } catch (revErr) {
          console.error("Revenue update failed (payment_failed):", revErr?.message || revErr);
        }
        break;
      }

      default:
        
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
   
    return res.status(200).json({ received: true });
  }
}
