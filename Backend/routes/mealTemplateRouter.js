import express from "express";
import path from "path";
import {
  getAllMealTemplates,
  getOneMealTemplate,
  addMealTemplate,
  updateMealTemplate,
  deleteMealTemplate,
  getPublicMealTemplates,
} from "../controller/mealTemplateController.js";

const mealTemplateRouter = express.Router();

// No local uploads

// routes
mealTemplateRouter.get("/", getAllMealTemplates);
mealTemplateRouter.get("/public", getPublicMealTemplates); // Public endpoint for predefined templates
mealTemplateRouter.get("/:id", getOneMealTemplate);
mealTemplateRouter.post("/", addMealTemplate);
mealTemplateRouter.put("/:id", updateMealTemplate);
mealTemplateRouter.delete("/:id", deleteMealTemplate);

export default mealTemplateRouter;
