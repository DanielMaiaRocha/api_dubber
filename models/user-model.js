import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: true, 
      minlength: [6, "Password must be at least 6 characters long"] 
    },
    isSeller: { 
      type: Boolean, 
      default: false
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: function () {
        return this.isSeller ? new mongoose.Types.ObjectId() : null;
      },
    },
    lang: { 
      type: String, 
    },
    country: { 
      type: String, 
    },
    role: {
      type: String,
      default: false,
    },
    profilePic: {
      type: String
    }
  },
  { timestamps: true }
);

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const modelName = mongoose.models.User || mongoose.model("User", userSchema);

export default modelName;
