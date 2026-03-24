import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true, // one profile per user
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
    },

    bio: {
      type: String,
      default: "",
    },

    avatar: {
      type: String, // URL (S3 / Cloudinary)
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    dateOfBirth: Date,

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    location: {
      country: String,
      city: String,
    },

    socialLinks: {
      linkedin: String,
      github: String,
      twitter: String,
      website: String,
    },
  },
  { timestamps: true }
);

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);