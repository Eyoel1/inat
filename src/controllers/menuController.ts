import { Request, Response } from "express";
import MenuItem from "../models/MenuItem";
import Category from "../models/Category";

/**
 * Get all menu items with optional filters
 */
export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const { category, inStock } = req.query;

    const filter: Record<string, any> = {};
    if (category) filter.categoryId = category;
    if (inStock !== undefined) filter.inStock = inStock === "true";

    const menuItems = await MenuItem.find(filter)
      .populate("categoryId")
      .populate("addOns")
      .sort({ nameEn: 1 });

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching menu items",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all categories
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ nameEn: 1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update menu item stock and emit socket event
 */
export const updateStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { inStock } = req.body;

    const menuItem = await MenuItem.findByIdAndUpdate(
      id,
      { inStock },
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    io.emit("stock_updated", {
      itemId: id,
      inStock,
    });

    res.status(200).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating stock",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Create a new menu item
 */
export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.create(req.body);
    await menuItem.populate(["categoryId", "addOns"]);

    res.status(201).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating menu item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update a menu item
 */
export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(["categoryId", "addOns"]);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating menu item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a menu item
 */
export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Menu item deleted",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error deleting menu item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
