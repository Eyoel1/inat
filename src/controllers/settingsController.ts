import { Request, Response } from "express";
import Order from "../models/Order";

export const resetDashboard = async (req: Request, res: Response) => {
  try {
    // Delete all completed orders (keep active ones)
    await Order.deleteMany({ overallStatus: "completed" });

    res.status(200).json({
      success: true,
      message: "Dashboard reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error resetting dashboard",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
