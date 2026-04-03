import { Enrollment } from '../models/enrollment.model.js';
import { Course } from '../models/course.model.js';

export const enrollInCourse = async ({ courseId, userId }) => {
  const course = await Course.findById(courseId).lean();
  if (!course) {
    throw new Error('Course not found');
  }

  const enrollment = await Enrollment.findOneAndUpdate(
    { courseId, userId },
    {
      $setOnInsert: {
        courseId,
        userId,
        totalLessons: course.totalLessons || 0,
      },
      $set: { lastAccessedAt: new Date() },
    },
    { upsert: true, new: true }
  );

  return enrollment;
};

export const getEnrollment = async ({ courseId, userId }) => {
  return Enrollment.findOne({ courseId, userId });
};

export const updateEnrollmentProgress = async ({
  courseId,
  userId,
  completedLessons,
  totalLessons,
}) => {
  const boundedCompleted = Math.max(0, Number(completedLessons) || 0);
  const boundedTotal = Math.max(0, Number(totalLessons) || 0);

  const progressPercent =
    boundedTotal > 0 ? Math.min(100, Math.round((boundedCompleted / boundedTotal) * 100)) : 0;

  const enrollment = await Enrollment.findOneAndUpdate(
    { courseId, userId },
    {
      $set: {
        completedLessons: boundedCompleted,
        totalLessons: boundedTotal,
        progressPercent,
        lastAccessedAt: new Date(),
      },
      $setOnInsert: {
        courseId,
        userId,
      },
    },
    { upsert: true, new: true }
  );

  return enrollment;
};

export const listMyEnrollments = async ({ userId, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Enrollment.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('courseId', 'title slug category level status thumbnail'),
    Enrollment.countDocuments({ userId }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};