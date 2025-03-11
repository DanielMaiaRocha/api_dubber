import express from "express";
import {
  createMessage,
  getMessages,
} from "../controllers/message-controller.js";
import { protectRoute } from "../middleware/jwt.js";


const router = express.Router();

router.post("/:id", protectRoute, createMessage);
router.get("/:id", protectRoute, getMessages);

export default router;