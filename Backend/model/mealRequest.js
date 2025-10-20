import mongoose, { Mongoose } from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";
import "./user.js";

const AutoIncrement = AutoIncrementFactory(mongoose);
const Schema = mongoose.Schema;

const mealRequestSchema = new Schema(
  {
    request_id: {
      type: Number,
      unique: true,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    user_name: {
      type: String,
    },

    last_name: {
      type: String,
    },

    weight: {
      type: String,
    },

    height: {
      type: String,
    },
    
    description: {
      type: String,
    },

    mealType: {
      type: String,
    },

    status: {
      type: String,
      enum: ['urgent', 'normal'],
      default: 'normal'
    },
  },
  { timestamps: true }
);

mealRequestSchema.plugin(AutoIncrement, { inc_field: "request_id" });

const mealRequest = mongoose.model("mealRequest", mealRequestSchema);
export default mealRequest;
