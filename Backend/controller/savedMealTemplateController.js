import SavedMealTemplate from "../model/savedMealTemplate.js";
import MealTemplate from "../model/mealTemplate.js";

export async function saveTemplate(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const { templateId } = req.params;
    const tmpl = await MealTemplate.findById(templateId);
    if (!tmpl) return res.status(404).json({ message: "Template not found" });

    // Check for existing saved entry
    const existing = await SavedMealTemplate.findOne({ user_id: userId, template_id: tmpl._id });
    if (existing) {
      return res.status(400).json({ message: "This template is already in your meal plans." });
    }

    const saved = await SavedMealTemplate.create({
      user_id: userId,
      template_id: tmpl._id,
      templateName: tmpl.templateName,
      mealType: tmpl.mealType,
      duration: tmpl.duration,
      calories: tmpl.calories,
      protein: tmpl.protein,
      carbs: tmpl.carbs,
      fats: tmpl.fats,
      dietCategory: tmpl.dietCategory,
      foodItems: tmpl.foodItems,
      photo: tmpl.photo,
    });

    return res.json({ message: "Saved", saved });
  } catch (err) {
    // Handle race condition on unique index
    if (err && err.code === 11000) {
      return res.status(400).json({ message: "This template is already in your meal plans." });
    }
    return res.status(500).json({ message: "Failed to save template", error: err.message });
  }
}

export async function unsaveTemplate(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const { templateId } = req.params;
    const tmpl = await MealTemplate.findById(templateId);
    if (!tmpl) return res.status(404).json({ message: "Template not found" });

    await SavedMealTemplate.findOneAndDelete({ user_id: userId, template_id: tmpl._id });
    return res.json({ message: "Removed" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to remove template", error: err.message });
  }
}

export async function listSavedTemplates(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const docs = await SavedMealTemplate.find({ user_id: userId }).sort({ savedAt: -1 });
    return res.json(docs);
  } catch (err) {
    return res.status(500).json({ message: "Failed to list templates", error: err.message });
  }
}
