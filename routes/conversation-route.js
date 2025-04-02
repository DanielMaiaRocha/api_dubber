import express from "express";
import {
  createChat,
  getChats,
  createMessage,
  getMessages,
  getChatDetails,
} from "../controllers/conversation-controller.js";
import { protectRoute } from "../middleware/jwt.js";

const router = express.Router();

// --- Rotas do Chat --- //
router.post("/chat", protectRoute, createChat);          // Criar novo chat 1:1
router.get("/chats", protectRoute, getChats);           // Listar chats do usuário
router.get("/messages/:conversationId", protectRoute, getMessages); // Buscar mensagens
router.post("/message", protectRoute, createMessage);   // Enviar mensagem
router.get("/chat-details/:conversationId", protectRoute, getChatDetails); // Detalhes do chat

export default router;