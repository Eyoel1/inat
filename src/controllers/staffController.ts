import { Request, Response } from "express";
import User from "../models/User";

export const getAllStaff = async (req: Request, res: Response) => {
  try {
    const staff = await User.find().select("-pin");
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching staff" });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const staff = await User.create(req.body);
    res.status(201).json({ success: true, data: staff });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const staff = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(400).json({ success: false, message: "Update failed" });
  }
};

export const deleteStaff = async (req: Request, res: Response) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Staff deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Delete failed" });
  }
};
