import express from "express";
import {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController";
import { protect, restrictTo } from "../middleware/auth";

const router = express.Router();

router.use(protect);
router.use(restrictTo("owner"));

router.route("/").get(getAllStaff).post(createStaff);
router.route("/:id").patch(updateStaff).delete(deleteStaff);

export default router;
