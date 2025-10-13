import express from "express";
import { getRevenueSummary, listRevenue } from "../controller/revenueController.js";

const revenueRouter = express.Router();

// GET /api/revenue/summary
revenueRouter.get("/summary", getRevenueSummary);
revenueRouter.get("/list", listRevenue);

export default revenueRouter;
