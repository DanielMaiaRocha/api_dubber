import express from "express";
import {
  createConversation,
  getConversations,
  getSingleConversation,
  updateConversation,
} from "../controllers/conversation-controller.js";
import { protectRoute } from "../middleware/jwt.js";


const router = express.Router();

router.get("/", protectRoute, getConversations);
router.post("/", protectRoute, createConversation);
router.get("/single/:id", protectRoute, getSingleConversation);
router.put("/:id", protectRoute, updateConversation);

export default router;