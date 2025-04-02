import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http"; // Importe createServer do http
import { Server } from "socket.io"; // Importe Server do socket.io
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

// --- Configuração do Express e Socket.io --- //
const app = express();
const httpServer = createServer(app); // Crie um servidor HTTP a partir do Express
const io = new Server(httpServer, {
  // Inicialize o Socket.io
  cors: {
    origin: "http://localhost:5173", // Permita conexões do frontend
    credentials: true,
  },
});

// --- Conexão com o MongoDB --- //
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};

// --- Middlewares --- //
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

// --- Rotas --- //
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/cards", cardRoute);
app.use("/api/booking", bookingRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/reviews", reviewRoute);

// --- Lógica do WebSocket --- //
io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);

  // Entrar em uma sala de conversa específica
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Cliente ${socket.id} entrou na sala: ${conversationId}`);
  });

  // Sair de uma sala
  socket.on("leaveConversation", (conversationId) => {
    socket.leave(conversationId);
    console.log(`Cliente ${socket.id} saiu da sala: ${conversationId}`);
  });

  // Lidar com desconexão
  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// Exporte o `io` para uso nos controllers
export { io };

// --- Middleware de Erro Global --- //
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  console.error("Error:", errorMessage);
  return res
    .status(errorStatus)
    .json({ success: false, message: errorMessage });
});

// --- Iniciar Servidor --- //
httpServer.listen(8800, () => {
  // Use httpServer em vez de app.listen()
  connect();
  console.log("Backend server is running on port 8800!");
});
