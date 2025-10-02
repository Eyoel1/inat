import { Request, Response } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import User from "../models/User";

// Generate JWT token with proper typing
const signToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const payload = { id, role };

  // ✅ Fix: cast expiresIn safely
  const expiresIn = (process.env.JWT_EXPIRES_IN ||
    "90d") as unknown as SignOptions["expiresIn"];

  return jwt.sign(payload, secret as Secret, { expiresIn });
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, pin } = req.body;

    if (!username || !pin) {
      return res.status(400).json({
        success: false,
        message: "Please provide username and PIN",
      });
    }

    const user = await User.findOne({ username }).select("+pin");

    if (!user || !(await user.comparePin(pin))) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or PIN",
      });
    }

    // Convert ObjectId to string
    const userId = String(user._id);
    const token = signToken(userId, user.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
