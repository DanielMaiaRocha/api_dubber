import createError from "../utils/createError.js";
import { createReview, getReviewsByCard } from "../models/review-model.js";
import { updateCardStarsInDB } from "../models/card-model.js";  

async function updateCardStars(cardId, star) {
  try {
    
    const card = await updateCardStarsInDB(cardId);
    
    if (!card) throw createError(404, "Card not found!");

    
    const newTotalStars = card.total_stars + star;
    const newStarNumber = card.star_number + 1;

  
    await updateCardStarsInDB(cardId, newTotalStars, newStarNumber);
  } catch (err) {
    throw new Error("Error updating card stars and review count: " + err.message);
  }
}

export const createReviewController = async (req, res, next) => {
  if (req.isSeller)
    return next(createError(403, "Sellers can't create a review!"));

  const reviewData = {
    userId: req.userId,
    cardId: req.body.cardId,
    desc: req.body.desc,
    star: req.body.star,
  };

  try {
   
    const existingReviews = await getReviewsByCard(req.body.cardId);
    const userReview = existingReviews.find(
      (review) => review.user_id === req.userId
    );
    
    if (userReview) {
      return next(createError(403, "You have already created a review for this card!"));
    }

  
    const savedReview = await createReview(reviewData);

   
    await updateCardStars(req.body.cardId, req.body.star);

    res.status(201).send(savedReview);
  } catch (err) {
    next(err);
  }
};

export const getReviewsController = async (req, res, next) => {
  try {
    const reviews = await getReviewsByCard(req.params.cardId);
    res.status(200).send(reviews);
  } catch (err) {
    next(err);
  }
};

export const deleteReviewController = async (req, res, next) => {
  try {

  } catch (err) {
    next(err);
  }
};
