import MealRequest from "../model/mealRequest.js";

export const getMealRequest = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required...",
    });
  }
  
  if (req.user.role == "admin" || req.user.role == "trainer") {
    MealRequest.find()
      .then((response) => {
        console.log("Fetched meal requests:", response);
        res.json({ response });
      })
      .catch((error) => {
        res.json({ error: error });
      });
  } else {
    res.status(401).json({
      message: "You need Trainer or Admin authorization...",
    });
  }
};

export const getOneMealRequest = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required...",
    });
  }
  
  const user = req.user._id;
  if (req.user.role == "user") {
    MealRequest.find({ user_id: user })
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

export const addMealRequest = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required...",
    });
  }
  
  const user = req.user._id;
  if (req.user.role == "user" || req.user.role == "member") {
    console.log("Received meal request data:", req.body);
    console.log("Status field:", req.body.status);
    
    const mealrequest = new MealRequest({
      user_id: user,
      user_name: req.body.user_name,
      status: req.body.status,
      weight: req.body.weight,
      height: req.body.height,
      last_name: req.body.last_name,
      description: req.body.description,
      mealType: req.body.mealType,
    });
    mealrequest
      .save()
      .then((response) => {
        console.log(response);
        res.status(200).json({ response });
      })
      .catch((error) => {
        res.status(500).json({ error: error });
        console.log(error);
      });
  } else {
    res.status(401).json({
      message: "You need User authorization...",
    });
  }
};

export const updateMealRequest = (req, res) => {
  req.user = { role: "User" };
  if (req.user.role == "User") {
    const {
      user_id,
      user_name,
      status,
      weight,
      height,
      last_name,
      description,
      mealType,
    } = req.body;
    const request_id = Number(req.params.id);
    MealRequest.updateOne(
      { request_id: request_id },
      {
        $set: {
          user_id,
          user_name,
          status,
          weight,
          height,
          last_name,
          description,
          mealType,
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
      message: "You need User authorization...",
    });
  }
};

export const deleteMealRequest = (req, res) => {
  console.log("Delete request - User:", req.user);
  console.log("Delete request - Request ID:", req.params.id);
  
  if (!req.user) {
    console.log("No user authentication found");
    return res.status(401).json({
      message: "Authentication required...",
    });
  }
  
  if (req.user.role == "trainer" || req.user.role == "admin" || req.user.role == "user") {
    const request_id = Number(req.params.id);
    console.log("Attempting to delete request with ID:", request_id);
    
    MealRequest.deleteOne({ request_id: request_id })
      .then((response) => {
        console.log("Delete response:", response);
        res.json({ response });
      })
      .catch((error) => {
        console.log("Delete error:", error);
        res.json({ error: error });
      });
  } else {
    console.log("Unauthorized - User role:", req.user.role);
    res.status(401).json({
      message: "You need proper authorization...",
    });
  }
};
