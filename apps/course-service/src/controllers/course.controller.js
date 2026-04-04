import mongoose from 'mongoose';
import {
  createCourse,
  deleteCourse,
  getCourseById,
  listCourses,
  listInstructorCourses,
  publishCourse,
  updateCourse,
} from '../services/course.service.js';
import {
  enrollInCourse,
  getEnrollment,
  listMyEnrollments,
  updateEnrollmentProgress,
} from '../services/enrollment.service.js';
import { getRequestUserId } from '../utils/request-user.js';
import { publishEvent } from '../messaging/producer.js';

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  return { page, limit };
};

const requireValidCourseId = (courseId, res) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    res.status(400).json({ message: 'Invalid courseId.' });
    return false;
  }
  return true;
};

const sendAuthError = (res, authError) => {
  const statusCode = authError.includes('Missing') ? 401 : 400;
  return res.status(statusCode).json({ message: authError });
};

export const createCourseController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const course = await createCourse({ payload: req.body, instructorId: auth.userId });

    return res.status(201).json(course);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create course.' });
  }
};

export const listCoursesController = async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const result = await listCourses({ query: req.query, page, limit });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list courses.', error: error.message });
  }
};

export const getCourseByIdController = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!requireValidCourseId(courseId, res)) return;

    const course = await getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    return res.status(200).json(course);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch course.', error: error.message });
  }
};

export const updateCourseController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const { courseId } = req.params;
    if (!requireValidCourseId(courseId, res)) return;

    const updated = await updateCourse({
      courseId,
      payload: req.body,
      instructorId: auth.userId,
    });

    if (!updated) {
      return res.status(404).json({ message: 'Course not found or not owned by you.' });
    }

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update course.' });
  }
};

export const deleteCourseController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const { courseId } = req.params;
    if (!requireValidCourseId(courseId, res)) return;

    const deleted = await deleteCourse({ courseId, instructorId: auth.userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Course not found or not owned by you.' });
    }

    return res.status(200).json({ message: 'Course deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete course.', error: error.message });
  }
};

export const publishCourseController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const { courseId } = req.params;
    if (!requireValidCourseId(courseId, res)) return;

    const published = await publishCourse({ courseId, instructorId: auth.userId });
    if (!published) {
      return res.status(404).json({ message: 'Course not found or not owned by you.' });
    }

    return res.status(200).json(published);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to publish course.', error: error.message });
  }
};

export const listMyCoursesController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const { page, limit } = parsePagination(req.query);
    const result = await listInstructorCourses({ instructorId: auth.userId, page, limit });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list your courses.', error: error.message });
  }
};

export const enrollInCourseController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const { courseId } = req.params;
    if (!requireValidCourseId(courseId, res)) return;

    const enrollment = await enrollInCourse({ courseId, userId: auth.userId });

    await publishEvent('course_events', 'course.exchange', 'course.enrolled', {
      courseId,
      userId: auth.userId,
      enrollmentId: enrollment._id,
    });

    return res.status(200).json(enrollment);
  } catch (error) {
    const status = error.message === 'Course not found' ? 404 : 500;
    return res.status(status).json({ message: error.message || 'Failed to enroll in course.' });
  }
};

export const getMyCourseProgressController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const { courseId } = req.params;
    if (!requireValidCourseId(courseId, res)) return;

    const enrollment = await getEnrollment({ courseId, userId: auth.userId });
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found for this user and course.' });
    }

    return res.status(200).json(enrollment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch progress.', error: error.message });
  }
};

export const updateMyCourseProgressController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const { courseId } = req.params;
    if (!requireValidCourseId(courseId, res)) return;

    const { completedLessons, totalLessons } = req.body;
    const enrollment = await updateEnrollmentProgress({
      courseId,
      userId: auth.userId,
      completedLessons,
      totalLessons,
    });

    return res.status(200).json(enrollment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update progress.', error: error.message });
  }
};

export const listMyEnrollmentsController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const { page, limit } = parsePagination(req.query);
    const result = await listMyEnrollments({ userId: auth.userId, page, limit });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list enrollments.', error: error.message });
  }
};