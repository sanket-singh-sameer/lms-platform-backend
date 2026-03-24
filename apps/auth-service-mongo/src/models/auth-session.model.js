import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AuthUser",
    required: true,
  },

  refreshToken: {
    type: String,
    required: true,
  },

  userAgent: String,
  ipAddress: String,

  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

// Auto-delete expired sessions (TTL index)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthSession = mongoose.model("AuthSession", sessionSchema);