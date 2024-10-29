import createError from "../utils/createError.js";
import Booking from "../models/booking-model.js";
import Card from "../models/card-model.js";

export const createBooking = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return next(createError(404, "Card não encontrado"));

    const newBooking = {
      cardId: card.id,
      img: card.cover,
      title: card.title,
      buyerId: req.userId,
      sellerId: card.userId,
      price: card.price,
      isCompleted: false,
      isAccepted: null, 
    };

    const savedBooking = await Booking.createBooking(newBooking);

    res.status(201).send(savedBooking);
  } catch (err) {
    next(err);
  }
};

export const respondToBooking = async (req, res, next) => {
  if (!req.isSeller) return next(createError(403, "Acesso negado. Somente o vendedor pode responder ao booking."));

  const { bookingId, isAccepted } = req.body;

  try {
    const updatedBooking = await Booking.updateBookingStatus(bookingId, { isAccepted });
    
    if (!updatedBooking) return next(createError(404, "Booking não encontrado"));

    const statusMessage = isAccepted ? "Booking aceito com sucesso." : "Booking rejeitado com sucesso.";
    res.status(200).send(statusMessage);
  } catch (err) {
    next(err);
  }
};

export const confirmBooking = async (req, res, next) => {
  try {
    const booking = await Booking.getBookingById(req.body.bookingId);

    if (!booking || booking.isAccepted !== true) 
      return next(createError(400, "Booking não foi aceito ainda ou não existe."));

    const updatedBooking = await Booking.updateBookingStatus(req.body.bookingId, { isCompleted: true });

    res.status(200).send("Booking foi confirmado com sucesso.");
  } catch (err) {
    next(err);
  }
};


export default {
  createBooking,
  respondToBooking,
  confirmBooking,
};
