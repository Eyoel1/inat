import { Request, Response } from "express";
import MenuItem from "../models/MenuItem";

export const getAllMenuItems = async (req: Request, res: Response) => {
  try {
    const menuItems = await MenuItem.find()
      .populate("categoryId", "nameEn nameAm station")
      .populate("addOns", "nameEn nameAm price")
      .sort({ nameEn: 1 });

    res.status(200).json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    console.error("Get menu items error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching menu items",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const {
      nameEn,
      nameAm,
      price,
      categoryId,
      station,
      imageUrl,
      addOns,
      costPerServing,
      inStock,
    } = req.body;

    console.log("=== Create Menu Item ===");
    console.log("Data received:", req.body);

    // Validation
    if (!nameEn || !nameAm || !price || !categoryId || !station) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide nameEn, nameAm, price, categoryId, and station",
      });
    }

    if (!["kitchen", "juicebar"].includes(station)) {
      return res.status(400).json({
        success: false,
        message: "Station must be either kitchen or juicebar",
      });
    }

    // Validate and sanitize image URL - reject file:// URLs
    let validImageUrl = "https://via.placeholder.com/400x300?text=Menu+Item";
    if (imageUrl) {
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        validImageUrl = imageUrl;
      } else if (imageUrl.startsWith("file://")) {
        console.log("Rejected file:// URL, using placeholder");
        validImageUrl = "https://via.placeholder.com/400x300?text=Menu+Item";
      }
    }

    // Check for duplicates
    const existingItem = await MenuItem.findOne({
      $or: [{ nameEn }, { nameAm }],
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "Menu item with this name already exists",
      });
    }

    const menuItem = await MenuItem.create({
      nameEn,
      nameAm,
      price: parseFloat(price),
      categoryId,
      station,
      imageUrl: validImageUrl,
      addOns: addOns || [],
      costPerServing: costPerServing ? parseFloat(costPerServing) : undefined,
      inStock: inStock !== undefined ? inStock : true,
    });

    const populatedItem = await MenuItem.findById(menuItem._id)
      .populate("categoryId", "nameEn nameAm station")
      .populate("addOns", "nameEn nameAm price");

    console.log("Menu item created successfully:", populatedItem?._id);

    res.status(201).json({
      success: true,
      data: populatedItem,
      message: "Menu item created successfully",
    });
  } catch (error) {
    console.error("Create menu item error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating menu item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log("=== Update Menu Item ===");
    console.log("Item ID:", id);
    console.log("Update data:", updateData);

    // Convert price and costPerServing to numbers if they exist
    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }
    if (updateData.costPerServing) {
      updateData.costPerServing = parseFloat(updateData.costPerServing);
    }

    // Validate image URL if provided
    if (updateData.imageUrl) {
      if (updateData.imageUrl.startsWith("file://")) {
        updateData.imageUrl =
          "https://via.placeholder.com/400x300?text=Menu+Item";
      } else if (
        !updateData.imageUrl.startsWith("http://") &&
        !updateData.imageUrl.startsWith("https://")
      ) {
        updateData.imageUrl =
          "https://via.placeholder.com/400x300?text=Menu+Item";
      }
    }

    const menuItem = await MenuItem.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("categoryId", "nameEn nameAm station")
      .populate("addOns", "nameEn nameAm price");

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    console.log("Menu item updated successfully");

    res.status(200).json({
      success: true,
      data: menuItem,
      message: "Menu item updated successfully",
    });
  } catch (error) {
    console.error("Update menu item error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating menu item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log("=== Delete Menu Item ===");
    console.log("Item ID:", id);

    const menuItem = await MenuItem.findByIdAndDelete(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    console.log("Menu item deleted successfully");

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Delete menu item error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting menu item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { inStock } = req.body;

    console.log("=== Update Stock ===");
    console.log("Item ID:", id);
    console.log("In Stock:", inStock);

    const menuItem = await MenuItem.findByIdAndUpdate(
      id,
      { inStock },
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    console.log("Stock updated successfully");

    res.status(200).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error("Update stock error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating stock",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
