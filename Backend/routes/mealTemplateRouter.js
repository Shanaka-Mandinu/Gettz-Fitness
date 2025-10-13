import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getAllMealTemplates,
  getOneMealTemplate,
  addMealTemplate,
  updateMealTemplate,
  deleteMealTemplate,
  getPublicMealTemplates,
} from "../controller/mealTemplateController.js";

const mealTemplateRouter = express.Router();

//upload folder
const uploadDir = path.join(process.cwd(), "uploads", "mealTemplates");
fs.mkdirSync(uploadDir, { recursive: true });

// multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({ storage });

// routes
mealTemplateRouter.get("/", getAllMealTemplates);
mealTemplateRouter.get("/public", getPublicMealTemplates); // Public endpoint for predefined templates
mealTemplateRouter.get("/:id", getOneMealTemplate);
mealTemplateRouter.post("/", upload.single("photo"), addMealTemplate);
mealTemplateRouter.put("/:id", upload.single("photo"), updateMealTemplate);
mealTemplateRouter.delete("/:id", deleteMealTemplate);

export default mealTemplateRouter;
