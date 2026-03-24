import mongoose from 'mongoose';

const userPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },

    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },

    language: {
      type: String,
      default: "en",
    },

    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const UserPreferences = mongoose.model(
  "UserPreferences",
  userPreferencesSchema
);