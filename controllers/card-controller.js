import { createError } from "../utils/create-error.js";
import { createCard, deleteCardById, getCardById, getAllCards } from "../models/card-model.js";

export const createCardController = async (req, res, next) => {
  if (!req.isSeller) {
    return next(createError(403, "Only sellers can create a card!"));
  }

  const newCard = {
    userId: req.userId,
    ...req.body,bb
  };

  try {
    const savedCard = await createCard(newCard);
    res.status(201).json(savedCard);
  } catch (err) {
    next(err);
  }
};

export const deleteCardController = async (req, res, next) => {
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

export const getCardController = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.id);
    if (!card) return next(createError(404, "Card not found!"));
    res.status(200).json(card);
  } catch (err) {
    next(err);
  }
};

export const getCardsController = async (req, res, next) => {
  const q = req.query;
  const filters = {
    ...(q.userId && { user_id: q.userId }),
    ...(q.cat && { cat: q.cat }),
    ...(q.min && { price: { $gt: q.min } }),
    ...(q.max && { price: { $lt: q.max } }),
    ...(q.search && { title: `%${q.search}%` }),
  };

  try {
    const cards = await getAllCards(filters, q.sort);
    res.status(200).json(cards);
  } catch (err) {
    next(err);
  }
};
