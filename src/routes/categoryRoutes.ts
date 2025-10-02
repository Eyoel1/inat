import express from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", protect, getAllCategories);
router.post("/", protect, restrictTo("owner"), createCategory);
router.put("/:id", protect, restrictTo("owner"), updateCategory);
router.delete("/:id", protect, restrictTo("owner"), deleteCategory);

export default router;
