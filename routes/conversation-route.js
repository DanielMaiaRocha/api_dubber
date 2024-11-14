import express from "express";
import {
  createNewConversation,
  getUserConversations,
  getSingleConversation,
  updateConversationStatus,
} from "../controllers/conversation-controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.get("/", verifyToken, getUserConversations);
router.post("/", verifyToken, createNewConversation);
router.get("/single/:id", verifyToken, getSingleConversation);
router.put("/:id", verifyToken, updateConversationStatus);

export default router;