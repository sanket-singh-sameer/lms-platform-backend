import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },

    enrolledCourses: {
      type: Number,
      default: 0,
    },

    completedCourses: {
      type: Number,
      default: 0,
    },

    totalWatchTime: {
      type: Number,
      default: 0, // minutes
    },
  },
  { timestamps: true }
);

export const UserStats = mongoose.model("UserStats", userStatsSchema);