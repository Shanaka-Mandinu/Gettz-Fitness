import express from 'express';
import multer from "multer";
import path from "path";
import fs from "fs";
const mealPlanRouter = express.Router();
import { getMealPlan, addMealPlan, updateMealPlan, deleteMeal,getOneMealPlan } from '../controller/mealPlanController.js'

//upload folder for meal plans
const uploadDir = path.join(process.cwd(), "uploads", "mealPlans");
fs.mkdirSync(uploadDir, { recursive: true });

// multer setup for meal plans
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({ storage });

mealPlanRouter.get('/', getMealPlan);
mealPlanRouter.post('/', upload.single("photo"), addMealPlan);
mealPlanRouter.put('/:id', upload.single("photo"), updateMealPlan);
mealPlanRouter.delete("/:id", deleteMeal);
mealPlanRouter.get('/getOneMealPlan',getOneMealPlan);

export default mealPlanRouter;