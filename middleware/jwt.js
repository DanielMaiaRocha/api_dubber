import jwt from "jsonwebtoken";
import createError from "../utils/create-error.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({
        message: "Token não fornecido. Por favor, faça login novamente.",
      });
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Erro ao verificar o token:", err);
    next(
      createError(
        403,
        "Token inválido ou expirado. Por favor, faça login novamente."
      )
    );
  }
};
