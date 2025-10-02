import express from "express";
import {
  createOrder,
  getActiveOrders,
  updateOrderStatus,
  processPayment,
} from "../controllers/orderController";
import { protect, restrictTo } from "../middleware/authMiddleware";

const router = express.Router();

// Create new order
router.post("/", protect, restrictTo("waitress", "owner"), createOrder);

// Get active orders
router.get("/active", protect, getActiveOrders);

// Update order status
router.patch("/:orderId/status", protect, updateOrderStatus);

// Process payment
router.post(
  "/:orderId/payment",
  protect,
  restrictTo("waitress", "owner"),
  processPayment
);

export default router;
