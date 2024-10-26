import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import { getCards, intent, confirm } from "../controllers/cards-controller.js";

const router = express.Router();

// router.post("/:gigId", verifyToken, createCards);
router.get("/", verifyToken, getCards);
router.post("/create-payment-intent/:id", verifyToken, intent);
router.put("/", verifyToken, confirm);

export default router;