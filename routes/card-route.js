import express from "express";
import {
  createCard,
  deleteCard,
  getCard,
  getCards
} from "../controllers/card.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.post("/", verifyToken, createCard);
router.delete("/:id", verifyToken, deleteCard);
router.get("/single/:id", getCard);
router.get("/", getCards);

export default router;