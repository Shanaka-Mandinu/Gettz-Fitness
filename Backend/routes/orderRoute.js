
import express from "express";
import { createOrder } from "../controller/orderController.js";
import verifyJWT from "../middleware/auth.js";

const router = express.Router();


// Create supplement order and Stripe session
router.post("/create", verifyJWT, createOrder);



export default router;
