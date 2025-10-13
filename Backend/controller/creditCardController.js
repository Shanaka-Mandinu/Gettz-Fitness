import CreditCard from "../model/creditCard.js";

export function addCard(req, res) {
  //check user is an admin
  // req.user="admin";
  console.log("card adding runs");
  //
  if (req.user.role != "user" && req.user.role != "member") {
    res.status(401).json({
      message: "You need to Login as a User",
    });
  } else {
    const body = {
      user_id: req.user._id,
      card_id: null,
      card_name: req.body.card_name,
      card_number: req.body.card_number,
      expiry_date: req.body.expiry_date,
    };
    CreditCard.find({ card_number: body.card_number }).then((card) => {
      if (card.length == 0) {
        CreditCard.find()
          .sort({ _id: -1 })
          .limit(1)
          .then((output) => {
            if (output.length == 0) {
              body.card_id = 1;
            } else {
              const lastCardId = output[0].card_id;
              body.card_id = lastCardId + 1;
            }
            const card = new CreditCard(body);

            card
              .save()
              .then(() => {
                res.status(200).json({
                  message: "Card added Successfully",
                });
              })
              .catch((err) => {
                console.log(err);
                res.status(500).json({
                  message: "Card added Failed",
                });
              });
          })
          .catch(() => {
            res.status(500).json({
              message: "DataBase Problem",
            });
          });
      } else {
        res.status(200).json({ message: "Same card" });
      }
    });
  }
}
export function getCards(req, res) {
  CreditCard.find({
    user_id: req.user._id,
  })
    .then((cards) => {
      res.status(200).json(cards);
    })
    .catch(() => {
      res.status(500).json({ message: "Error retrieving cards" });
    });
}

export async function updateCard(req, res) {
  console.log("card updates runs");

  if (req.user == null) {
    res.status(401).json({
      message: "You need to Login First",
    });
  } else if (req.user.role != "member" && req.user.role != "user") {
    res.status(401).json({
      message: "You are needed to login as user",
    });
  } else {
    const cardId = Number(req.params.id);
    console.log(req.body);
    try {
      const card = await CreditCard.findOne(
        {
          user_id: req.user._id,
          card_id: cardId,
        },
        req.body
      );
      if (!card) {
        return res.status(404).json({ message: "Card not found." });
      }
      card.card_name = req.body.card_name;
      card.card_number = req.body.card_number;
      card.expiry_date = req.body.expiry_date;
      console.log("Card Update successful.");
      res.status(200).json({ message: "Card Update successful." });

      await card.save();
    } catch (err) {
      res.status(500).json({ message: "Card Update Failed." + err });
    }
  }
}

export function deleteCard(req, res) {
  if (req.user == null) {
    res.status(401).json({
      message: "You need to Login First",
    });
  } else if (req.user.role != "member" && req.user.role != "user") {
    res.status(401).json({
      message: "You are needed to login as user",
    });
  } else {
    const cardId = req.params.id;
    console.log(cardId);
    CreditCard.findOneAndDelete({
      user_id: req.user._id,
      card_id: cardId,
    })
      .then(() => {
        res.status(200).json({ message: "Card deleted successful." });
      })
      .catch(() => {
        res.status(500).json({ message: "Card deletion Failed." });
      });
  }
}
