import { createMessage, getMessagesByConversationId } from './message-model.js';
import { updateConversation } from './conversation-model.js'; 
import createError from '../utils/createError.js';


export const createMessage = async (req, res, next) => {
  const { conversationId, desc } = req.body;
  const userId = req.userId; 
  const isSeller = req.isSeller; 

  try {
  
    const newMessage = await createMessage({
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
