import express from "express";
import { getOrders, confirm } from "../controllers/booking-controller.js";
import { protectRoute } from "../middleware/jwt.js";

const router = express.Router();

// router.post("/:gigId", verifyToken, createOrder);
router.get("/",protectRoute, getOrders);
router.put("/",protectRoute, confirm);

export default router;