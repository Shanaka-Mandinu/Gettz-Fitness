import MealTemplate from "../model/mealTemplate.js";

export const addMealTemplate = async (req, res) => {
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

    // Accept URL from body (cloud storage)
    const photo = photoFromBody || null;

    // Create a new document and save the new meal template in database 
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
    return res.status(201).json(doc);
  } catch (err) {
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

    // Accept URL from body; if not provided, don't modify existing photo
    const computedPhoto = (photoFromBody ?? undefined);

    const updateDoc = {
      templateName,
      mealType,
      foodItems,
      calories,
      protein,
      carbs,
      fats,
      dietCategory,
      duration,
    };
    if (computedPhoto !== undefined) {
      updateDoc.photo = computedPhoto;
    }

    const updated = await MealTemplate.findByIdAndUpdate(
      req.params.id,
      updateDoc,
      { new: true, runValidators: true }
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
