import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AuthUser",
    required: true,
  },

  token: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["email_verification", "password_reset"],
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

// TTL index
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthToken = mongoose.model("AuthToken", tokenSchema);