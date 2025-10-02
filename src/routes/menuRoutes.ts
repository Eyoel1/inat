import express from "express";
import {
  getMenuItems,
  getCategories,
  updateStock,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController";
import { protect, restrictTo } from "../middleware/auth";

const router = express.Router();

router.get("/items", protect, getMenuItems);
router.get("/categories", protect, getCategories);
router.patch(
  "/items/:id/stock",
  protect,
  restrictTo("kitchen", "juicebar", "owner"),
  updateStock
);
router.post("/items", protect, restrictTo("owner"), createMenuItem);
router.patch("/items/:id", protect, restrictTo("owner"), updateMenuItem);
router.delete("/items/:id", protect, restrictTo("owner"), deleteMenuItem);
export default router;
