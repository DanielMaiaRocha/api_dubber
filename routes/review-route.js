import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import {
  createReview,
  getReviewsByCard,
} from "../controllers/review-controller.js";

const router = express.Router();

router.post("/", verifyToken, createReview )
router.get("/:gigId", getReviewsByCard )


export default router;