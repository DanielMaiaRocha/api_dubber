import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoute from "./routes/user-route.js";
import cardRoute from "./routes/card-route.js";
import bookingRoute from "./routes/booking-route.js";
import conversationRoute from "./routes/conversation-route.js";
import messageRoute from "./routes/message-route.js";
import reviewRoute from "./routes/review-route.js";
import authRoute from "./routes/auth-route.js";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();
mongoose.set("strictQuery", true);

const app = express();

// Conectar ao MongoDB
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};

// Configuração do CORS
app.use(cors({ origin: "https://dubber-nine.vercel.app/", credentials: true }));

// Middleware para requisições grandes
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(cookieParser());

// Definição das rotas
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/cards", cardRoute);
app.use("/api/booking", bookingRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/reviews", reviewRoute);

// Middleware de erro global
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  console.error("Error:", errorMessage);
  return res.status(errorStatus).json({ success: false, message: errorMessage });
});

// Iniciar servidor
app.listen(8800, () => {
  connect();
  console.log("Backend server is running on port 8800!");
});