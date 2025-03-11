import createError from "../utils/create-error.js";
import Message from "../models/message-model.js";
import Conversation from "../models/conversation-model.js";

export const createMessage = async (req, res, next) => {
  const newMessage = new Message({
    conversationId: req.body.conversationId,
    userId: req.userId, // Obtido do token JWT
    text: req.body.text, // Usar "text" conforme o modelo
  });

  try {
    const savedMessage = await newMessage.save();

    // Atualizar a conversa com a última mensagem
    await Conversation.findOneAndUpdate(
      { id: req.body.conversationId },
      {
        $set: {
          lastMessage: req.body.text, // Atualiza apenas a última mensagem
        },
      },
      { new: true }
    );

    res.status(201).send(savedMessage);
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id });
    res.status(200).send(messages);
  } catch (err) {
    next(err);
  }
};