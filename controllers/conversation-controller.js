import Conversation from "../models/conversation-model.js";
import Message from "../models/message-model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Armazena conexões SSE por conversa
const sseConnections = new Map();

// Enviar atualizações via SSE
const sendSSEUpdate = (conversationId, data) => {
  const clients = sseConnections.get(conversationId) || [];
  if (clients.length > 0) {
    clients.forEach((res) => res.write(`data: ${JSON.stringify(data)}\n\n`));
  }
};

// Configurar conexão SSE
export const setupSSE = (req, res) => {
  const { conversationId } = req.query;

  if (!conversationId) {
    return res.status(400).json({ message: "Conversation ID is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (!sseConnections.has(conversationId)) {
    sseConnections.set(conversationId, []);
  }
  sseConnections.get(conversationId).push(res);

  req.on("close", () => {
    const clients = sseConnections.get(conversationId) || [];
    sseConnections.set(
      conversationId,
      clients.filter((client) => client !== res)
    );
    if (sseConnections.get(conversationId).length === 0) {
      sseConnections.delete(conversationId);
    }
  });
};

// Criar um novo chat entre dois usuários
export const createChat = async (req, res) => {
  try {
    const token = req.cookies.acessToken;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SCT);
    const { participant } = req.body; // O ID do outro usuário

    if (!participant) {
      return res.status(400).json({ message: "Participant is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(participant)) {
      return res.status(400).json({ message: "Invalid participant ID" });
    }

    const userId = decoded.userId;

    // Verifica se já existe uma conversa entre os dois usuários
    let chat = await Conversation.findOne({
      participants: { $all: [userId, participant] },
    });

    if (!chat) {
      chat = new Conversation({
        participants: [userId, participant], // Insere os dois IDs no array
      });
      await chat.save();
    }

    res.status(201).json(chat);
  } catch (error) {
    console.error("Error creating chat", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Obter todas as conversas do usuário pelo ID
export const getChats = async (req, res) => {
  try {
    const token = req.cookies.acessToken;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SCT);
    const userId = decoded.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Busca todas as conversas onde o usuário está presente no array participants
    const chats = await Conversation.find({ participants: userId })
      .populate("participants", "name email") // Popula os participantes do chat
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Obter mensagens de uma conversa específica
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("userId", "name email");

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Criar uma nova mensagem em uma conversa
export const createMessage = async (req, res) => {
  try {
    const token = req.cookies.acessToken;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SCT);
    const { text, conversationId } = req.body;

    if (!text || !conversationId) {
      return res.status(400).json({ message: "Message text and conversation ID are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const message = new Message({
      userId: decoded.userId,
      conversationId,
      text,
    });
    await message.save();

    // Atualizar última mensagem e data de atualização na conversa
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      updatedAt: Date.now(),
    });

    // Enviar atualização via SSE
    sendSSEUpdate(conversationId, message);

    res.status(201).json(message);
  } catch (error) {
    console.error("Error creating message", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
