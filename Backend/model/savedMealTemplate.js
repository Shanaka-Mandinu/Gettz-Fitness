import mongoose from "mongoose";
import "./user.js";

const savedMealTemplateSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    template_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealTemplate",
      required: true,
      index: true,
    },
    // Snapshot fields to display without extra joins
    templateName: String,
    mealType: String,
    duration: String,
    calories: String,
    protein: String,
    carbs: String,
    fats: String,
    dietCategory: String,
    foodItems: String,
    photo: String,
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate saves per user-template combo
savedMealTemplateSchema.index({ user_id: 1, template_id: 1 }, { unique: true });

const SavedMealTemplate = mongoose.model("SavedMealTemplate", savedMealTemplateSchema);
export default SavedMealTemplate;
