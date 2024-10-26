import createError from "../utils/create-error.js";
import { createConversation, getConversationById, updateConversationReadStatus } from "../models/conversation-model.js";

export const createNewConversation = async (req, res, next) => {
  const newConversationData = {
    id: req.isSeller ? req.userId + req.body.to : req.body.to + req.userId,
    sellerId: req.isSeller ? req.userId : req.body.to,
    buyerId: req.isSeller ? req.body.to : req.userId,
    readBySeller: req.isSeller,
    readByBuyer: !req.isSeller,
  };

  try {
    const savedConversation = await createConversation(newConversationData);
    res.status(201).send(savedConversation);
  } catch (err) {
    next(err);
  }
};

export const updateConversationStatus = async (req, res, next) => {
  try {
    const updatedConversation = await updateConversationReadStatus(
      req.params.id,
      req.isSeller ? true : undefined,
      req.isSeller ? undefined : true
    );

    res.status(200).send(updatedConversation);
  } catch (err) {
    next(err);
  }
};

export const getSingleConversation = async (req, res, next) => {
  try {
    const conversation = await getConversationById(req.params.id);
    if (!conversation) return next(createError(404, "Not found!"));
    res.status(200).send(conversation);
  } catch (err) {
    next(err);
  }
};

export const getUserConversations = async (req, res, next) => {
  const query = req.isSeller ? { sellerId: req.userId } : { buyerId: req.userId };
  try {
    const conversations = await getConversations(query);
    res.status(200).send(conversations);
  } catch (err) {
    next(err);
  }
};
