import express from 'express';
import path from "path";
const mealPlanRouter = express.Router();
import { getMealPlan, addMealPlan, updateMealPlan, deleteMeal,getOneMealPlan } from '../controller/mealPlanController.js'

// No local uploads

// No multer: we now accept cloud URLs. Keep folder for legacy files served statically.

mealPlanRouter.get('/', getMealPlan);
mealPlanRouter.post('/', addMealPlan);
mealPlanRouter.put('/:id', updateMealPlan);
mealPlanRouter.delete("/:id", deleteMeal);
mealPlanRouter.get('/getOneMealPlan',getOneMealPlan);

export default mealPlanRouter;