import express from "express";
import {
  createOrder,
  getActiveOrders,
  updateOrderStatus,
  processPayment,
} from "../controllers/orderController";
import { protect, restrictTo } from "../middleware/auth";

const router = express.Router();

router.post("/", protect, restrictTo("waitress", "owner"), createOrder);
router.get("/active", protect, getActiveOrders);
router.patch(
  "/:id/status",
  protect,
  restrictTo("kitchen", "juicebar", "owner"),
  updateOrderStatus
);
router.post(
  "/:id/payment",
  protect,
  restrictTo("waitress", "owner"),
  processPayment
);
router.post(
  "/:orderId/payment",
  protect,
  restrictTo("waitress", "owner"),
  processPayment
);
export default router;
