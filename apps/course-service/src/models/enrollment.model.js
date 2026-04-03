import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'Course',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

enrollmentSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);