import express from "express";
import { deleteUser, getUser, handlePostRequest, updateUser } from "../controllers/user-controller.js";
import { protectRoute } from "../middleware/jwt.js";

const router = express.Router();

router.delete("/:id", protectRoute, deleteUser);
router.get("/user", getUser);
router.post("/:id", protectRoute, handlePostRequest);
router.put("/update-profile",protectRoute, updateUser)

export default router;