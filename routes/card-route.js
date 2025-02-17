import express from "express";
import {
  createCard,
  deleteCard,
  getCard,
  getCards
} from "../controllers/card-controller.js";
import { protectRoute } from "../middleware/jwt.js";

const router = express.Router();

router.post("/", protectRoute, createCard);
router.delete("/:id", protectRoute, deleteCard);
router.get("/:id", getCard);
router.get("/", getCards);

export default router;
