import express from "express";
import { saveTemplate, unsaveTemplate, listSavedTemplates } from "../controller/savedMealTemplateController.js";

const router = express.Router();

// All require auth via verifyJWT from index.js
router.post("/save/:templateId", saveTemplate);
router.delete("/save/:templateId", unsaveTemplate);
router.get("/mine", listSavedTemplates);

export default router;
