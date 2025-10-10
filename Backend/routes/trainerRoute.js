import express from "express";
import {deleteTrainer,getAllTrainers,getTrainerById,loginTrainer,registerTrainer,updateTrainer,getTrainerProfile,updateTrainerProfile,getTrainerStats} from "../controller/trainerController.js";
import verifyJWT from "../middleware/auth.js";

const trainerRouter = express.Router();

trainerRouter.post("/register", registerTrainer);
trainerRouter.post("/login", loginTrainer);
trainerRouter.get("/viewTrainers", getAllTrainers);
trainerRouter.put("/updateTrainer/:id", updateTrainer);
trainerRouter.delete("/deleteTrainer/:id", deleteTrainer);
trainerRouter.get("/viewTrainer/:id", getTrainerById);

// Profile routes (protected)
trainerRouter.get("/profile", verifyJWT, getTrainerProfile);
trainerRouter.put("/profile", verifyJWT, updateTrainerProfile);
trainerRouter.get("/stats", verifyJWT, getTrainerStats);

export default trainerRouter;
