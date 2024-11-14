import { createMessages, getMessagesByConversationId } from '../models/message-model.js';
import { updateConversation } from '../models/conversation-model.js'; 
import createError from '../utils/create-error.js';

export const createMessage = async (req, res, next) => {
  const { conversationId, desc } = req.body;
  const userId = req.userId; 
  const isSeller = req.isSeller; 

  try {
    const newMessage = await createMessages({
      conversationId,
      userId,
      desc,
    });

    await updateConversation(conversationId, {
      readBySeller: isSeller,
      readByBuyer: !isSeller,
      lastMessage: desc,
    });

    res.status(201).json(newMessage);
  } catch (err) {
    next(createError(500, 'Erro ao criar mensagem.'));
  }
};

export const getMessages = async (req, res, next) => {
  const conversationId = req.params.id;

  try {
    const messages = await getMessagesByConversationId(conversationId);
    res.status(200).json(messages);
  } catch (err) {
    next(createError(500, 'Erro ao obter mensagens.'));
  }
};
