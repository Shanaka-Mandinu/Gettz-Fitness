import MealPlan from "../model/mealplan.js";
import path from "path";
import { createNotificationForUser } from "./notificatinController.js";


export const getMealPlan = (req, res) => {
  req.user = { role: "trainer" };
  if (req.user.role == "trainer") {
    MealPlan.find()
      .then((response) => {
        res.json({ response });
      })
      .catch((error) => {
        res.json({ error: error });
      });
  } else {
    res.status(401).json({
      message: "You need Trainer authorization...",
    });
  }
};


export const getOneMealPlan = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required...",
    });
  }
  
  const user = req.user._id;
  if (req.user.role == "user" || req.user.role == "member") {
    // Try both ObjectId and string matching
    MealPlan.find({ 
      $or: [
        { user_id: user },
        { user_id: user.toString() }
      ]
    })
      .then((response) => {
        res.json({ response });
      })
      .catch((error) => {
        res.json({ error: error });
      });
  } else {
    res.status(401).json({
      message: "You need User authorization...",
    });
  }
};


export const addMealPlan = (req, res) => {
  req.user = { role: "trainer" };
  if (req.user.role == "trainer") {
    const mealplan = new MealPlan({
      // User information
      user_name: req.body.user_name,
      user_id: req.body.user_id, // This will be converted to ObjectId by Mongoose
      
      // Meal plan details 
      meal_name: req.body.meal_name,
      meal_type: req.body.meal_type,
      foodItems: req.body.foodItems,
      description: req.body.description,
      calories: req.body.calories,
      protein: req.body.protein,
      carbs: req.body.carbs,
      fats: req.body.fats,
      dietCategory: req.body.dietCategory,
      duration: req.body.duration,
      photo: req.file ? req.file.path.replace(process.cwd() + path.sep, '') : null,
    });
    mealplan
      .save()
      .then(async(response) => {
        //changed to async

        //try catch block added by sandeep for create notification
        try{

          const mockReq = {
            body: {
              title: "Meal Plan Created!",
              body: "Your requested meal plan is ready",
              type: "alert",
              userId: req.body.user_id,
              deliveryTo: req.body.user_name
            }
          }

          const mockRes = {
            status: () => mockRes,
            json: () => {}
          }

          await createNotificationForUser(mockReq, mockRes)

        }catch(err){
          console.log("Meal plan notification failed : ", err)
          res.json({
            message : "Meal plan notification error"
          })
        }

        res.json({ response });
      })
      .catch((error) => {
        res.json({ error: error });
      });
  } else {
    res.status(401).json({
      message: "You need Trainer authorization...",
    });
  }
};


export const updateMealPlan = (req, res) => {
  req.user = { role: "trainer" };
  if (req.user.role == "trainer") {
    const {
      user_name,
      user_id,
      meal_name,
      meal_type,
      foodItems,
      description,
      calories,
      protein,
      carbs,
      fats,
      dietCategory,
      duration,
      photo: photoFromBody,
    } = req.body;
    
    const photo = req.file ? req.file.path.replace(process.cwd() + path.sep, '') : photoFromBody ?? undefined;
    const mealPlan_id = Number(req.params.id);
    MealPlan.updateOne(
      { mealPlan_id: mealPlan_id },
      {
        $set: {
          // User information
          user_name,
          user_id,
          
          // Meal plan details (matching mealTemplate structure)
          meal_name,
          meal_type,
          foodItems,
          description,
          calories,
          protein,
          carbs,
          fats,
          dietCategory,
          duration,
          photo,
        },
      }
    )
      .then((response) => {
        res.json({ response });
      })
      .catch((error) => {
        res.json({ error: error });
      });
  } else {
    res.status(401).json({
      message: "You need Trainer authorization...",
    });
  }
};


export const deleteMeal = (req, res) => {
  req.user = { role: "trainer" };
  if (req.user.role == "trainer") {
    const mealPlan_id = Number(req.params.id);
    MealPlan.findOneAndDelete({ mealPlan_id: mealPlan_id })
      .then((response) => {
        res.status(200).json({
          message: "Delete Successful",
        });
      })
      .catch((error) => {
        res.json({ error: error });
      });
  } else {
    res.status(401).json({
      message: "You need Trainer authorization...",
    });
  }
};
