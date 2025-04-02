import mongoose from "mongoose";
const { Schema } = mongoose;

const ConversationSchema = new Schema(
  {
    participant1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participant2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Índice único para evitar chats duplicados entre os mesmos usuários
ConversationSchema.index(
  { participant1: 1, participant2: 1 },
  { unique: true }
);

// Método para buscar conversa entre dois usuários
ConversationSchema.statics.findByParticipants = async function (userId1, userId2) {
  return this.findOne({
    $or: [
      { participant1: userId1, participant2: userId2 },
      { participant1: userId2, participant2: userId1 },
    ],
  });
};

export default mongoose.model("Conversation", ConversationSchema);