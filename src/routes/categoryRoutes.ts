import express from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { protect, restrictTo } from "../middleware/auth";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getAllCategories)
  .post(restrictTo("owner"), createCategory);

router
  .route("/:id")
  .patch(restrictTo("owner"), updateCategory)
  .delete(restrictTo("owner"), deleteCategory);

export default router;
