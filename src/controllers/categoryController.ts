import { Request, Response } from "express";
import Category from "../models/Category";

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ nameEn: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
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

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { nameEn, nameAm, station } = req.body;

    if (!nameEn || !nameAm || !station) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const category = await Category.create({
      nameEn,
      nameAm,
      station,
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(400).json({
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

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating category",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error deleting category",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
