import createError from "../utils/create-error.js";
import { createCard as createCardModel, deleteCardById, getCardById, getAllCards } from "../models/card-model.js";

export const createCard = async (req, res, next) => {
  if (!req.isSeller) {
    return next(createError(403, "Only sellers can create a card!"));
  }

  const newCard = {
    userId: req.userId,
    ...req.body,
  };

  try {
    const savedCard = await createCardModel(newCard); // Usando a função renomeada aqui
    res.status(201).json(savedCard);
  } catch (err) {
    next(err);
  }
};

export const deleteCard = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.id);
    if (!card) return next(createError(404, "Card not found!"));
    if (card.user_id !== req.userId) {
      return next(createError(403, "You can delete only your card!"));
    }

    await deleteCardById(req.params.id);
    res.status(200).send("Card has been deleted!");
  } catch (err) {
    next(err);
  }
};

export const getCard = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.id);
    if (!card) return next(createError(404, "Card not found!"));
    res.status(200).json(card);
  } catch (err) {
    next(err);
  }
};

export const getCards = async (req, res, next) => {
  const q = req.query;
  const filters = {
    ...(q.userId && { user_id: q.userId }),
    ...(q.cat && { category: q.cat }),
    ...(q.min && { price: { $gte: q.min } }),
    ...(q.max && { price: { $lte: q.max } }),
    ...(q.search && { title: `%${q.search}%` }),
  };

  try {
    const cards = await getAllCards(filters, q.sort);
    res.status(200).json(cards);
  } catch (err) {
    next(err);
  }
};
