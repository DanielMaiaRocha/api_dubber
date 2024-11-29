import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import { getOrders, confirm } from "../controllers/booking-controller.js";

const router = express.Router();

// router.post("/:gigId", verifyToken, createOrder);
router.get("/", verifyToken, getOrders);
router.put("/", verifyToken, confirm);

export default router;