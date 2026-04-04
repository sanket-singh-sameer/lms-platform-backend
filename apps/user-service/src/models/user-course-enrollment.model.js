import mongoose from 'mongoose';

const userCourseEnrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

userCourseEnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const UserCourseEnrollment = mongoose.model('UserCourseEnrollment', userCourseEnrollmentSchema);
