import mongoose from "mongoose";
import { fieldEncryption } from "mongoose-field-encryption";

const cardSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  card_id: {
    type: Number,
    required: true,
    unique: true,
  },
  card_number: {
    type: Number,
    required: true,
  },
  card_name: {
    type: String,
    required: true,
  },
  expiry_date: {
    type: String,
    required: true,
    min: 0,
  }
  
});
// Add plugin: auto encrypt on save, decrypt on find
cardSchema.plugin(fieldEncryption, {
  fields: ["card_number", "card_name", "expiry_date"],
  secret: process.env.FIELD_ENCRYPTION_KEY, // keep as string
});

const CreditCard = mongoose.model("CreditCard", cardSchema);

export default CreditCard;
