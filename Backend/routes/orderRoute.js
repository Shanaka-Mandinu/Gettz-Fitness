
import express from "express";
import { createOrder, fetchOrder } from "../controller/orderController.js";
import verifyJWT from "../middleware/auth.js";

const router = express.Router();


// Create supplement order and Stripe session
router.post("/create", verifyJWT, createOrder);
router.get("/fetchOrder/:id", fetchOrder);



export default router;
