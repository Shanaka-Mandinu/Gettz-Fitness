// model/user.js
import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please provide Valid email"],
    unique: true,
    validate: [validator.isEmail, "Please provide a valid email"],
    trim: true,
    lowercase: true,
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
  },
  phone: { type: String, required: true, default: "Not given" },
  height: { type: String, required: true, default: "Not given" },
  weight: { type: String, required: true, default: "Not given" },
  dob: { type: Date, required: true, default: Date.now },

  profilePicture: { type: String, default: "" },

  role: {
    type: String,
    required: true,
    enum: ["user", "member"],
    default: "user",
  },
  bmi: { type: Number, default: 0 },
  point: { type: Number, default: 0 },
  isDisabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  googleId: { type: String },
  avatar: { type: String },
});

const User = new mongoose.model("User", userSchema);
export default User;
