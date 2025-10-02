import { Request, Response } from "express";
import Category from "../models/Category";

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ nameEn: 1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { nameEn, nameAm, station } = req.body;

    console.log("=== Create Category ===");
    console.log("Data received:", { nameEn, nameAm, station });

    // Validation
    if (!nameEn || !nameAm || !station) {
      return res.status(400).json({
        success: false,
        message: "Please provide nameEn, nameAm, and station",
      });
    }

    if (!["kitchen", "juicebar"].includes(station)) {
      return res.status(400).json({
        success: false,
        message: "Station must be either kitchen or juicebar",
      });
    }

    // Check for duplicates
    const existingCategory = await Category.findOne({
      $or: [{ nameEn }, { nameAm }],
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const category = await Category.create({
      nameEn,
      nameAm,
      station,
    });

    console.log("Category created successfully:", category._id);

    res.status(201).json({
      success: true,
      data: category,
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating category",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nameEn, nameAm, station } = req.body;

    console.log("=== Update Category ===");
    console.log("Category ID:", id);
    console.log("Data:", { nameEn, nameAm, station });

    if (!nameEn || !nameAm || !station) {
      return res.status(400).json({
        success: false,
        message: "Please provide nameEn, nameAm, and station",
      });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { nameEn, nameAm, station },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    console.log("Category updated successfully");

    res.status(200).json({
      success: true,
      data: category,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log("=== Delete Category ===");
    console.log("Category ID:", id);

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    console.log("Category deleted successfully");

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
