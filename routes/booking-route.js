import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import {
  createBooking,
  respondToBooking,
  confirmBooking,
} from "../controllers/booking-controller.js";

const router = express.Router();

router.post("/:id", verifyToken, createBooking);

router.put("/respond", verifyToken, respondToBooking);

router.put("/confirm", verifyToken, confirmBooking);

export default router;
