import Conversation from "../models/conversation-model.js";
import Message from "../models/message-model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { io } from "../server.js";

// --- Funções Auxiliares --- //
const emitNewMessage = (conversationId, message) => {
  io.to(conversationId).emit("newMessage", message);
};

const emitConversationUpdate = (conversationId, updateData) => {
  io.to(conversationId).emit("conversationUpdated", updateData);
};

// --- Controllers --- //
export const createChat = async (req, res) => {
  try {
    // Verificação de autenticação
    const token = req.cookies.acessToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SCT);
    const { participant } = req.body;

    // Validações básicas
    if (!participant) {
      return res.status(400).json({ message: "Participante é obrigatório" });
    }

    if (!mongoose.Types.ObjectId.isValid(participant)) {
      return res.status(400).json({ message: "ID do participante inválido" });
    }

    const userId = decoded.userId;
    if (userId === participant) {
      return res.status(400).json({ message: "Não pode criar chat consigo mesmo" });
    }

    // Busca conversa existente (não verifica se o outro usuário existe)
    let chat = await Conversation.findOne({
      $or: [
        { participant1: userId, participant2: participant },
        { participant1: participant, participant2: userId }
      ]
    });

    // Cria nova conversa se não existir
    if (!chat) {
      chat = new Conversation({
        participant1: userId,
        participant2: participant,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await chat.save();
      
      // Popula dados básicos para a resposta
      chat = await Conversation.findById(chat._id)
        .populate('participant1', 'name profilePic')
        .populate('participant2', 'name profilePic');
    }

    res.status(201).json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};

export const getChats = async (req, res) => {
  try {
    const token = req.cookies.acessToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SCT);
    const userId = decoded.userId;

    // Busca todas as conversas do usuário
    const chats = await Conversation.find({
      $or: [{ participant1: userId }, { participant2: userId }]
    })
      .populate("participant1", "name profilePic")
      .populate("participant2", "name profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "ID da conversa inválido" });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("senderId", "name profilePic");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createMessage = async (req, res) => {
  try {
    const token = req.cookies.acessToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SCT);
    const { text, conversationId } = req.body;

    if (!text || !conversationId) {
      return res.status(400).json({ 
        message: "Texto e ID da conversa são obrigatórios" 
      });
    }

    // Cria e salva a mensagem
    const message = new Message({
      senderId: decoded.userId,
      conversationId,
      text,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await message.save();

    // Atualiza a conversa
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { 
        lastMessage: text,
        updatedAt: new Date() 
      },
      { new: true }
    );

    // Notifica via WebSocket
    emitNewMessage(conversationId, message);
    emitConversationUpdate(conversationId, {
      lastMessage: text,
      updatedAt: updatedConversation.updatedAt
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getChatDetails = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const token = req.cookies.acessToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.ACESS_TOKEN_SCT);
    const userId = decoded.userId;

    // Busca a conversa
    const conversation = await Conversation.findById(conversationId)
      .populate("participant1", "name profilePic")
      .populate("participant2", "name profilePic")
      .lean();

    if (!conversation) {
      return res.status(404).json({ message: "Conversa não encontrada" });
    }

    // Identifica o outro participante
    const otherParticipant = 
      conversation.participant1._id.toString() === userId 
        ? conversation.participant2 
        : conversation.participant1;

    // Busca a última mensagem
    const lastMessage = await Message.findOne({ conversationId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      otherParticipant: {
        _id: otherParticipant._id,
        name: otherParticipant.name,
        profilePic: otherParticipant.profilePic
      },
      lastMessage: lastMessage?.text || "Nenhuma mensagem ainda",
      lastMessageDate: lastMessage?.createdAt || null
    });
  } catch (error) {
    console.error("Error fetching chat details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};