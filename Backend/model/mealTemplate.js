import mongoose from "mongoose";

const Schema = mongoose.Schema;

const mealTemplateSchema = new Schema(
  {
    templateName: {
      type: String,
      required: true,
    },
    mealType: {
      type: String,
      required: true,
    },
    foodItems: {
      type: String,
      required: true,
    },
    calories: {
      type: String,
    },
    protein: {
      type: String,
    },
    carbs: {
      type: String,
    },
    fats: {
      type: String,
    },
    dietCategory: {
      type: String,
    },
    duration: {
      type: String,
      required: true,
    },
    photo: {
      type: String, // file path
    },
  },
  { timestamps: true }
);

const MealTemplate = mongoose.model("MealTemplate", mealTemplateSchema);
export default MealTemplate;
