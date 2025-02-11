import express from "express";
import { signup, login, logout, refreshToken, getProfile, updateProfile} from "../controllers/auth-controller.js";
import { protectRoute } from "../middleware/jwt.js";

const router = express.Router();

router.post("/register", signup)
router.post("/login", login)
router.post("/logout", logout)
router.post("/refresh-token", refreshToken)
router.get("/profile", protectRoute, getProfile)
router.put("/profile", protectRoute, updateProfile)

export default router;