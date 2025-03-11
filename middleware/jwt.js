import jwt from "jsonwebtoken";
import User from "../models/user-model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // Pega o token do cookie ou do header Authorization
    let accessToken = req.cookies.acessToken;

    if (!accessToken && req.headers.authorization?.startsWith("Bearer ")) {
      accessToken = req.headers.authorization.split(" ")[1];
    }

    console.log("Token recebido:", accessToken); // Log para debug

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(accessToken, process.env.ACESS_TOKEN_SCT);

    console.log("Token decodificado:", decoded); // Log para debug

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
    console.error("Error in protectRoute Middleware:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized - Token Expired" });
    }

    return res.status(401).json({ message: "Unauthorized - Token invalid" });
  }
};

export const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied - Admin only" });
  }
};
