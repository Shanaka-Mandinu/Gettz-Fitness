import Subscription from "../model/Subscription_Model.js";
import Payment from "../model/Payment_Model.js";
import Stripe from "stripe";
import MembershipPlan from "../model/Membership_Plans_Model.js";
import axios from "axios";
const stripe = new Stripe(process.env.SECRET_KEY);

export async function createPayment(req, res) {
  console.log("createPayment runs");
  if (req.user == null) {
    return res.status(404).json({ message: "You have to login" });
  }
  try {
    const plan = await MembershipPlan.findOne({ plan_id: req.params.id });

    if (plan) {
      const token = req.headers["authorization"];

      await axios.post(
        "http://localhost:3000/api/sub/addSub/" + req.params.id,
        { auto_renew: req.body.auto_renew },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          locale: "en",
          line_items: [
            {
              price_data: {
                currency: "LKR",
                product_data: {
                  name: plan.plan_name,
                },
                unit_amount: req.body.finalAmount * 100,
              },
              quantity: 1,
            },
          ],
          success_url: `http://localhost:5173/membership/paymentSuccess?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: "http://localhost:5173/membership/paymentFailed",
          metadata: {
            userId: req.user._id,
            planId: req.params.id,
            appliedPoints: req.body.pointsToUse || 0
          },
        });
  console.log("Points to use: ", req.body.pointsToUse);
        const subInfo = await Subscription.findOne({ user_id: req.user._id });
        const paymentData = {
          payment_id: 0,
          user_id: req.user._id,
          amount: plan.price,
          paid_amount: req.body.finalAmount,
          discount: plan.price - req.body.finalAmount,
          session_id: session.id,
          subscription_id: subInfo._id,
          planName:plan.plan_name
        };
        const lastPayment = await Payment.find().sort({ _id: -1 }).limit(1);

        if (lastPayment.length === 0) {
          paymentData.payment_id = 1;
        } else {
          const lastPaymentId = lastPayment[0].payment_id;
          paymentData.payment_id = lastPaymentId + 1;
        }

        const payment = await new Payment(paymentData);
        payment.save();

        res.json({ id: session.id });
      } catch (err) {
        console.log("err1:" + err);
        return res.status(500).json({ message: err.response.data.message });
      }
    }
  } catch (err) {
    console.log("err2:" + err);
    return res.json({ message: "payment failed" });
  }
}

export async function fetchPayment(req, res) {
  const session_id = req.params.id;
  try {
    const payment = await Payment.findOne({ session_id }).populate({
      path: "subscription_id",
      populate: {
        path: "plan_id", // the field inside Subscription model
      }
    });

    res.status(200).json(payment);
  } catch (err) {
    res.status(500).json({ message: err });
  }

  // Subscription.find({user_id:req.user._id,status:{$in: ["active", "pending"] }}).populate("plan_id")
  //   .then((sub)=>{
  //       res.status(200).json(sub)
  //   })
  //   .catch((err)=>{
  //       res.status(500).json({message:"Server Error when finding the subscription "+err})
  //   })
}

export function fetchUserPayment(req,res){
  Payment.find({user_id:req.user._id}).populate({
      path: "subscription_id",
      populate: {
        path: "plan_id", // the field inside Subscription model
      }
    }).then((payment)=>{
      res.status(200).json(payment)
  }).catch((err)=>{
      res.status(500).json({message:err})
  })
}
