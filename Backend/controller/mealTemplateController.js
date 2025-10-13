import MealTemplate from "../model/mealTemplate.js";
import path from "path";

export const addMealTemplate = async (req, res) => {
  console.log("addMealTemplate - req.user:", req.user);
  console.log("addMealTemplate - req.body:", req.body);
  console.log("addMealTemplate - req.file:", req.file);
  
  if (!req.user) {
    console.log("No user found in request");
    return res.status(401).json({
      message: "Authentication required...",
    });
  }
  
  if (req.user.role !== "trainer" && req.user.role !== "admin") {
    console.log("User role not authorized:", req.user.role);
    return res.status(401).json({
      message: "You need Trainer or Admin authorization...",
    });
  }
  
  try {
    const {
      templateName,
      mealType,
      foodItems,
      calories,
      protein,
      carbs,
      fats,
      dietCategory,
      duration,
    } = req.body;

    const photo = req.file ? req.file.path.replace(process.cwd() + path.sep, '') : null;

    console.log("Creating meal template with data:", {
      templateName,
      mealType,
      foodItems,
      calories,
      protein,
      carbs,
      fats,
      dietCategory,
      duration,
      photo
    });

    const doc = await MealTemplate.create({
      templateName,
      mealType,
      foodItems,
      calories,
      protein,
      carbs,
      fats,
      dietCategory,
      duration,
      photo,
    });

    console.log("Meal template created successfully:", doc);
    return res.status(201).json(doc);
  } catch (err) {
    console.error("Error creating meal template:", err);
    return res.status(400).json({ error: err.message });
  }
};


export const updateMealTemplate = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required...",
    });
  }
  
  if (req.user.role !== "trainer" && req.user.role !== "admin") {
    return res.status(401).json({
      message: "You need Trainer or Admin authorization...",
    });
  }
  
  try {
    const {
      templateName,
      mealType,
      foodItems,
      calories,
      protein,
      carbs,
      fats,
      dietCategory,
      duration,
      photo: photoFromBody,
    } = req.body;

    const photo = req.file ? req.file.path.replace(process.cwd() + path.sep, '') : photoFromBody ?? undefined;

    const updated = await MealTemplate.findByIdAndUpdate(
      req.params.id,
      {
        templateName,
        mealType,
        foodItems,
        calories,
        protein,
        carbs,
        fats,
        dietCategory,
        duration,
        photo,
      },
      { new: true, runValidators: true } //enforce schema
    );

    if (!updated) {
      return res.status(404).json({ error: "Template not found" });
    }

    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};


export const getAllMealTemplates = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required...",
    });
  }
  
  if (req.user.role !== "trainer" && req.user.role !== "admin") {
    return res.status(401).json({
      message: "You need Trainer or Admin authorization...",
    });
  }
  
  try {
    const docs = await MealTemplate.find().sort({ _id: -1 });
    return res.json(docs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Public endpoint for getting meal templates (no authentication required)
export const getPublicMealTemplates = async (req, res) => {
  try {
    const docs = await MealTemplate.find().sort({ _id: -1 });
    return res.json(docs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


export const getOneMealTemplate = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required...",
    });
  }
  
  if (req.user.role !== "trainer" && req.user.role !== "admin") {
    return res.status(401).json({
      message: "You need Trainer or Admin authorization...",
    });
  }
  
  try {
    const doc = await MealTemplate.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: "Template not found" });
    }
    return res.json(doc);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};



export const deleteMealTemplate = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required...",
    });
  }
  
  if (req.user.role !== "trainer" && req.user.role !== "admin") {
    return res.status(401).json({
      message: "You need Trainer or Admin authorization...",
    });
  }
  
  try {
    const deleted = await MealTemplate.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Template not found" });
    }
    return res.json({ message: "Template deleted successfully" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
