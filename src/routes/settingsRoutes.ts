import express from "express";
import { resetDashboard } from "../controllers/settingsController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/reset-dashboard", protect, restrictTo("owner"), resetDashboard);

export default router;
