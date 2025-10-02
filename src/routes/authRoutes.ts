import express from "express";
import { login, logout, getMe } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
