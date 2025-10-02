import { Request, Response } from "express";
import Order from "../models/Order";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get all completed orders
    const completedOrders = await Order.find({ overallStatus: "completed" })
      .populate("waitressId", "fullName username")
      .sort({ completedAt: -1 });

    // Calculate total sales
    const totalSales = completedOrders.reduce(
      (sum, order) => sum + order.total,
      0
    );

    // Calculate today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = completedOrders.filter(
      (order) => new Date(order.completedAt || order.createdAt) >= today
    );

    // Calculate average order value
    const averageOrder =
      completedOrders.length > 0 ? totalSales / completedOrders.length : 0;

    // Sales by waitress
    const salesByWaitress: {
      [key: string]: { name: string; total: number; count: number };
    } = {};

    completedOrders.forEach((order) => {
      const waitressId = order.waitressId._id.toString();
      if (!salesByWaitress[waitressId]) {
        salesByWaitress[waitressId] = {
          name: order.waitressName,
          total: 0,
          count: 0,
        };
      }
      salesByWaitress[waitressId].total += order.total;
      salesByWaitress[waitressId].count += 1;
    });

    // Convert to array and sort by total
    const waitressStats = Object.values(salesByWaitress).sort(
      (a, b) => b.total - a.total
    );

    // Top selling items
    const itemSales: {
      [key: string]: {
        nameAm: string;
        nameEn: string;
        quantity: number;
        revenue: number;
      };
    } = {};

    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = `${item.nameEn}-${item.nameAm}`;
        if (!itemSales[key]) {
          itemSales[key] = {
            nameAm: item.nameAm,
            nameEn: item.nameEn,
            quantity: 0,
            revenue: 0,
          };
        }
        itemSales[key].quantity += item.quantity;
        itemSales[key].revenue += item.price * item.quantity;
      });
    });

    // Convert to array and sort by quantity
    const topItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        totalSales,
        totalOrders: completedOrders.length,
        todayOrders: todayOrders.length,
        averageOrder,
        salesByWaitress: waitressStats,
        topSellingItems: topItems,
        recentOrders: completedOrders.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
