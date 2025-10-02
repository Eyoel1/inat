import express from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/stats", protect, restrictTo("owner"), getDashboardStats);

export default router;
