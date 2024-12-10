import mongoose from "mongoose";
const { Schema } = mongoose;

const GigSchema = new Schema(
  {
    userId: {
      type: String,
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
      enum: ["Dubbing Actor", "Translator", "Dubbing Director","Project Manager", "Dubbing Operator"], 
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Gig", GigSchema);
