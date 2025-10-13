import MembershipPlan from "../model/Membership_Plans_Model.js";
import Subscription from "../model/Subscription_Model.js";
import User from "../model/user.js";

export function addSubscription(req, res) {
  console.log("Add Subscription runs");

  if (req.user == null) {
    res.status(401).json({
      message: "You need to Login First",
    });
  } else {
    const planId = req.params.id;
    const start = new Date();
    const end = new Date(start);

    const SubscriptionData = {
      user_id: req.user._id,
      plan_id: planId,
      start_date: start,
      end_date: end,
      status: "pending",
      auto_renew: !!req.body.auto_renew,
    };
    MembershipPlan.findOne({
      plan_id: planId,
    })
      .then((plan) => {
        if (plan == null || plan.isDisabled) {
          res.status(400).json({ message: "Invalid plan or Disabled Plan" });
        } else {
          end.setDate(end.getDate() + plan.duration);
          SubscriptionData.end_date = end;
          SubscriptionData.plan_id = plan._id;
          // Subscription.find().sort({ _id: -1 }).limit(1).then((output)=>{
          //     if(output.length==0){
          //         body.plan_id=1;
          //     }else{
          //         const lastPlanId= output[0].plan_id;
          //         body.plan_id=(lastPlanId+1);
          //     }
          // })

          Subscription.findOne({ user_id: req.user._id })
            .then((sub) => {
              if (sub != null) {
                if (sub.status == "active") {
                  res
                    .status(400)
                    .json({ message: "You Have already selected a plan" });
                } else if (
                  sub.status == "pending" ||
                  sub.status == "canceled"
                ) {
                  Subscription.updateOne(sub, SubscriptionData)
                    .then(() => {
                      res.status(200).json({
                        message: "Subscription Updated",
                      });
                    })
                    .catch((err) => {
                      res.status(500).json({
                        message: "Error Occured when saving Subscription" + err,
                      });
                    });
                }
              } else {
                const subscription = new Subscription(SubscriptionData);
                subscription
                  .save()
                  .then(() => {
                    res.status(200).json({
                      message: "Subscription added",
                    });
                  })
                  .catch(() => {
                    res.status(500).json({
                      message: "Error Occured when saving Subscription",
                    });
                  });
              }
            })
            .catch();
        }
      })
      .catch(() => {
        res.status(500).json({ message: "Database Error" });
      });
  }
}

export function mySubscription(req, res) {
  Subscription.find({
    user_id: req.user._id,
    status: { $in: ["active", "pending"] },
  })
    .populate("plan_id")
    .then((sub) => {
      res.status(200).json(sub);
    })
    .catch((err) => {
      res
        .status(500)
        .json({ message: "Server Error when finding the subscription " + err });
    });
}

export async function cancelSubscription(req, res) {
  try {
    await Subscription.findOneAndUpdate(
      { user_id: req.user._id },
      { status: "canceled" }
    );
    const user = await User.findById(req.user._id);
    user.role = "user";
    await user.save();

    res.status(200).json({ message: "Subscription Canceled" });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res
      .status(500)
      .json({ message: "Server error when canceling the subscription" });
  }
}

