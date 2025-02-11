import express from "express";
import {
  createGig,
  deleteGig,
  getGig,
  getGigs
} from "../controllers/card-controller.js";
import { protectRoute } from "../middleware/jwt.js";


const router = express.Router();

router.post("/", protectRoute, createGig);
router.delete("/:id", protectRoute, deleteGig);
router.get("/single/:id", getGig);
router.get("/", getGigs);

export default router;