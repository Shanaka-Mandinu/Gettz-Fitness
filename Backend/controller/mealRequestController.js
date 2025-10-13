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
  if (req.user.role == "user" || req.user.role == "member") {
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
        res.status(200).json({ response });
      })
      .catch((error) => {
        res.status(500).json({ error: error });
      });
  } else {
    res.status(401).json({
      message: "You need User authorization...",
    });
  }
};


export const updateMealRequest = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required..." });
    }

    const request_id = Number(req.params.id);
    const existing = await MealRequest.findOne({ request_id });
    if (!existing) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Allow owner or trainer/admin to update
    const role = String(req.user.role || '').toLowerCase();
    const isOwner = String(existing.user_id) === String(req.user._id);
    if (!(isOwner || role === 'trainer' || role === 'admin')) {
      return res.status(403).json({ message: "Forbidden" });
    }

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

    const update = {
      ...(user_id ? { user_id } : {}),
      ...(user_name !== undefined ? { user_name } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(weight !== undefined ? { weight } : {}),
      ...(height !== undefined ? { height } : {}),
      ...(last_name !== undefined ? { last_name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(mealType !== undefined ? { mealType } : {}),
    };

    const response = await MealRequest.updateOne(
      { request_id },
      { $set: update }
    );
    return res.json({ response });
  } catch (error) {
    return res.status(500).json({ error });
  }
};


export const deleteMealRequest = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required..." });
    }
    const request_id = Number(req.params.id);
    const existing = await MealRequest.findOne({ request_id });
    if (!existing) {
      return res.status(404).json({ message: "Request not found" });
    }
    const role = String(req.user.role || '').toLowerCase();
    const isOwner = String(existing.user_id) === String(req.user._id);
    if (!(isOwner || role === 'trainer' || role === 'admin')) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const response = await MealRequest.deleteOne({ request_id });
    return res.json({ response });
  } catch (error) {
    return res.status(500).json({ error });
  }
};
