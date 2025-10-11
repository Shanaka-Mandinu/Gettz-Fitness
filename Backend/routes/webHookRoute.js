import express from "express";
import {handleWebhook}  from "../controller/webhookController.js";
import { stripeWebhook } from "../controller/orderController.js";

const webhookRoutes = express.Router();

// POST /webhook
webhookRoutes.post("/",handleWebhook);
webhookRoutes.post("/store",stripeWebhook);

export default webhookRoutes;
