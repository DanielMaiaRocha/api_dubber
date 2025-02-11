import express from "express";
import { protectRoute } from "../middleware/jwt.js";
import {
  createReview,
  getReviews,
  deleteReview,
} from "../controllers/review-controller.js";

const router = express.Router();

router.post("/", protectRoute, createReview )
router.get("/:gigId", getReviews )
router.delete("/:id", deleteReview)

export default router;