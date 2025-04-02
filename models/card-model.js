import mongoose from "mongoose";
const { Schema } = mongoose;

const CardSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    totalStars: {
      type: Number,
      default: 0,
    },
    starNumber: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    cover: {
      type: String,
      required: true,
    },
    shortDesc: {
      type: String,
      required: true,
    },
    revisionNumber: {
      type: Number,
      required: false,
    },
    features: {
      type: [String],
      required: false,
    },
    lang: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    video: {
      type: String,  // Agora é uma string simples como a cover
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Card", CardSchema);