import express from "express";
import {
  createChat,
  getChats,
  createMessage,
  getMessages,
  setupSSE,
  getChatDetails, // Nova função para buscar detalhes do chat
} from "../controllers/conversation-controller.js";
import { protectRoute } from "../middleware/jwt.js";

const router = express.Router();

// Criar um novo chat
router.post("/chat", protectRoute, createChat);

// Obter todos os chats do usuário
router.get("/chats", protectRoute, getChats);

// Obter mensagens de um chat específico
router.get("/messages/:conversationId", protectRoute, getMessages);

// Enviar uma nova mensagem
router.post("/message", protectRoute, createMessage);

// Rota para Server-Sent Events (SSE)
router.get("/sse", protectRoute, setupSSE);

// Nova rota para buscar detalhes do chat
router.get("/chat-details/:conversationId", protectRoute, getChatDetails);

export default router;