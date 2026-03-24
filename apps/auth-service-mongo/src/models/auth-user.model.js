import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      default: null, // null for OAuth users
    },

    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },

    providerId: {
      type: String,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    roles: [
      {
        type: String,
        enum: ["student", "instructor", "admin"],
        default: "student",
      },
    ],
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

export const AuthUser = mongoose.model("AuthUser", userSchema);