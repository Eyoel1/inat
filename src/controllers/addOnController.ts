import { Request, Response } from "express";
import AddOn from "../models/AddOn";

export const getAllAddOns = async (req: Request, res: Response) => {
  try {
    const addOns = await AddOn.find().sort({ nameEn: 1 });

    res.status(200).json({
      success: true,
      count: addOns.length,
      data: addOns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching add-ons",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createAddOn = async (req: Request, res: Response) => {
  try {
    const { nameEn, nameAm, price, cost } = req.body;

    if (!nameEn || !nameAm || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const addOn = await AddOn.create({
      nameEn,
      nameAm,
      price,
      cost,
    });

    res.status(201).json({
      success: true,
      data: addOn,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating add-on",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateAddOn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nameEn, nameAm, price, cost } = req.body;

    const addOn = await AddOn.findByIdAndUpdate(
      id,
      { nameEn, nameAm, price, cost },
      { new: true, runValidators: true }
    );

    if (!addOn) {
      return res.status(404).json({
        success: false,
        message: "Add-on not found",
      });
    }

    res.status(200).json({
      success: true,
      data: addOn,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating add-on",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteAddOn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const addOn = await AddOn.findByIdAndDelete(id);

    if (!addOn) {
      return res.status(404).json({
        success: false,
        message: "Add-on not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Add-on deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error deleting add-on",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
