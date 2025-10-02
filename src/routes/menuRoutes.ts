import express from "express";
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateStock,
} from "../controllers/menuController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/items", protect, getAllMenuItems);
router.post("/items", protect, restrictTo("owner"), createMenuItem);
router.put("/items/:id", protect, restrictTo("owner"), updateMenuItem);
router.delete("/items/:id", protect, restrictTo("owner"), deleteMenuItem);
router.patch("/items/:id/stock", protect, restrictTo("owner"), updateStock);

export default router;
