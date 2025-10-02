import express from "express";
import {
  getAllAddOns,
  createAddOn,
  updateAddOn,
  deleteAddOn,
} from "../controllers/addOnController";
import { protect, restrictTo } from "../middleware/auth";

const router = express.Router();

router.use(protect);

router.route("/").get(getAllAddOns).post(restrictTo("owner"), createAddOn);

router
  .route("/:id")
  .patch(restrictTo("owner"), updateAddOn)
  .delete(restrictTo("owner"), deleteAddOn);

export default router;
