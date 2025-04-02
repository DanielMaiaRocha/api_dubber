import express from "express";
import {
  createCard,
  deleteCard,
  getCard,
  getCards,
  getUserCard,
  updateCard,
} from "../controllers/card-controller.js";
import { protectRoute } from "../middleware/jwt.js";

const router = express.Router();

router.post("/", protectRoute, createCard);
router.delete("/:id", protectRoute, deleteCard);
router.get("/user-card", protectRoute, getUserCard);
router.put("/:id", protectRoute, updateCard);
router.get("/:id", getCard);
router.get("/", getCards);

export default router;