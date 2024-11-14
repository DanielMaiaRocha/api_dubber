import createError from "../utils/create-error.js";
import { createBooking as createBookingModel, getBookingById, getAllBookings, updateBookingStatus, deleteBookingById } from "../models/boking-model.js";
import { getCardById } from "../models/card-model.js";

export const createBooking = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.id);
    if (!card) return next(createError(404, "Card não encontrado"));

    const newBooking = {
      cardId: card.id,
      img: card.cover,
      title: card.title,
      buyerId: req.userId,
      sellerId: card.user_id,
      price: card.price,
      isCompleted: false,
      isAccepted: null, 
    };

    const savedBooking = await createBookingModel(newBooking);

    res.status(201).send(savedBooking);
  } catch (err) {
    next(err);
  }
};

export const respondToBooking = async (req, res, next) => {
  if (!req.isSeller) return next(createError(403, "Acesso negado. Somente o vendedor pode responder ao booking."));

  const { bookingId, isAccepted } = req.body;

  try {
    const booking = await getBookingById(bookingId);
    if (!booking) return next(createError(404, "Booking não encontrado"));

    const updatedBooking = await updateBookingStatus(bookingId, { isAccepted });
    
    const statusMessage = isAccepted ? "Booking aceito com sucesso." : "Booking rejeitado com sucesso.";
    res.status(200).send(statusMessage);
  } catch (err) {
    next(err);
  }
};

export const confirmBooking = async (req, res, next) => {
  try {
    const booking = await getBookingById(req.body.bookingId);

    if (!booking || booking.isAccepted !== true) 
      return next(createError(400, "Booking não foi aceito ainda ou não existe."));

    const updatedBooking = await updateBookingStatus(req.body.bookingId, true);

    res.status(200).send("Booking foi confirmado com sucesso.");
  } catch (err) {
    next(err);
  }
};

export const getBooking = async (req, res, next) => {
  try {
    const booking = await getBookingById(req.params.id);
    if (!booking) return next(createError(404, "Booking não encontrado"));
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const bookings = await getAllBookings();
    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    await deleteBookingById(req.params.id);
    res.status(200).send("Booking deletado com sucesso.");
  } catch (err) {
    next(err);
  }
};
