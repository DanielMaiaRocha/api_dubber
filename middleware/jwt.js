import jwt from "jsonwebtoken";
import User from "../models/user-model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const acessToken = req.cookies.acessToken; 

    if (!acessToken) {
      return res 
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(acessToken, process.env.ACESS_TOKEN_SCT);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Unauthorized - Token Expired" });
    }

    console.error("Error in protectRoute Middleware:", error.message);
    return res.status(401).json({ message: "Unauthorized - Token invalid" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Access denied - Admin only" }); 
  }
};
