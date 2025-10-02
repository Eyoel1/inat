import { Request, Response } from "express";
import Order from "../models/Order";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, customerName, customerPhone } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // Calculate total (no tax)
    let total = 0;
    items.forEach((item: any) => {
      const itemTotal = item.price * item.quantity;
      const addOnsTotal = item.addOns.reduce(
        (sum: number, addon: any) => sum + addon.price * item.quantity,
        0
      );
      total += itemTotal + addOnsTotal;
    });

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = String(orderCount + 1).padStart(3, "0");

    // Determine statuses based on items
    const hasKitchenItems = items.some(
      (item: any) => item.station === "kitchen"
    );
    const hasJuicebarItems = items.some(
      (item: any) => item.station === "juicebar"
    );

    const order = await Order.create({
      orderNumber,
      items,
      kitchenStatus: hasKitchenItems ? "pending" : undefined,
      juicebarStatus: hasJuicebarItems ? "pending" : undefined,
      overallStatus: "pending",
      total,
      waitressId: req.user?._id,
      waitressName: req.user?.fullName,
      customerName,
      customerPhone,
    });

    // Emit socket event
    const io = req.app.get("io");
    io.emit("new_order", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      kitchenStatus: order.kitchenStatus,
      juicebarStatus: order.juicebarStatus,
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getActiveOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({
      overallStatus: { $ne: "completed" },
    })
      .populate("waitressId", "fullName username")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { station, newStatus } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (station === "kitchen") {
      order.kitchenStatus = newStatus;
    } else if (station === "juicebar") {
      order.juicebarStatus = newStatus;
    }

    // Update overall status
    const statuses = [order.kitchenStatus, order.juicebarStatus].filter(
      Boolean
    );

    if (statuses.every((s) => s === "ready")) {
      order.overallStatus = "ready";
      order.readyAt = new Date();
    } else if (statuses.some((s) => s === "inprogress")) {
      order.overallStatus = "inprogress";
    }

    await order.save();

    // Emit socket event
    const io = req.app.get("io");
    io.emit("order_status_updated", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      station,
      newStatus,
      overallStatus: order.overallStatus,
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const processPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, amountReceived, change, mobileProvider } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.paymentMethod = paymentMethod;
    order.paymentDetails = {
      amountReceived,
      change,
      mobileProvider,
    };
    order.overallStatus = "completed";
    order.completedAt = new Date();

    await order.save();

    // Emit socket event
    const io = req.app.get("io");
    io.emit("order_completed", {
      orderId: order._id,
      orderNumber: order.orderNumber,
    });

    res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing payment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
