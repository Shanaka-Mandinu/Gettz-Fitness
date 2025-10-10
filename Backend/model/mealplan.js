import mongoose from 'mongoose';
import AutoIncrementFactory from "mongoose-sequence";
import "./user.js";

const AutoIncrement = AutoIncrementFactory(mongoose);
const Schema = mongoose.Schema;


const mealPlanSchema = new Schema({
    mealPlan_id: {
        type: Number,
        unique: true,
    },
    
    // User information
    user_name: {
        type: String,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    // Meal plan details
    meal_name: {
        type: String,
        required: true,
    },
    meal_type: {
        type: String,
        required: true,
    },
    foodItems: {
        type: String,
        required: true,
    },
    description: {
        type: String,
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

    // Legacy field for backward compatibility
    calaries: {
        type: String,
    }
}, { timestamps: true });

mealPlanSchema.plugin(AutoIncrement, { inc_field: "mealPlan_id" });

const meal= mongoose.model("mealPlan",mealPlanSchema);
export default meal;
