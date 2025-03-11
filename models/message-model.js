import mongoose from "mongoose";
const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId, // Referência à collection Conversation
      ref: "Conversation",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Referência à collection User
      ref: "User",
      required: true,
    },
    text: {
      type: String, // Renomeado para "text" para maior clareza
      required: true,
    },
  },
  { timestamps: true } // Adiciona createdAt e updatedAt automaticamente
);

export default mongoose.model("Message", MessageSchema);