import express from "express";
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
import { connectToDatabase } from "./models/user-model.js"; 

dotenv.config();

const app = express();


const connect = async () => {
    try {
        await connectToDatabase();
        console.log('DB connection successful!');
    } catch (err) {
        console.error('Failed to connect to the database:', err);
    }
};

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/gigs", cardRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/reviews", reviewRoute);


app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  return res.status(errorStatus).send(errorMessage);
});


app.listen(8800, () => {
  connect();
  console.log("Backend server is running on port 8800");
});
