import mongoose from 'mongoose';
import { Course } from '../models/course.model.js';

const allowedUpdateFields = [
  'title',
  'description',
  'category',
  'level',
  'price',
  'thumbnail',
  'tags',
  'lessons',
  'status',
];

const sanitizeUpdatePayload = (payload) => {
  const output = {};

  for (const field of allowedUpdateFields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      output[field] = payload[field];
    }
  }

  return output;
};

const deriveCourseNumbers = (updates) => {
  if (!Array.isArray(updates.lessons)) {
    return {};
  }

  const totalLessons = updates.lessons.length;
  const totalDurationInMinutes = updates.lessons.reduce((sum, lesson) => {
    const duration = Number(lesson?.durationInMinutes) || 0;
    return sum + Math.max(0, duration);
  }, 0);

  return { totalLessons, totalDurationInMinutes };
};

const toSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const buildUniqueSlug = async (title, excludeCourseId = null) => {
  const base = toSlug(title) || 'course';
  let candidate = base;
  let counter = 1;

  while (
    await Course.exists({
      slug: candidate,
      ...(excludeCourseId ? { _id: { $ne: excludeCourseId } } : {}),
    })
  ) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
};

export const createCourse = async ({ payload, instructorId }) => {
  if (!payload?.title) {
    throw new Error('title is required');
  }

  const slug = await buildUniqueSlug(payload.title);
  const sanitizedPayload = sanitizeUpdatePayload(payload);
  const numbers = deriveCourseNumbers(sanitizedPayload);

  const course = await Course.create({
    ...sanitizedPayload,
    ...numbers,
    title: payload.title,
    slug,
    instructorId,
  });

  return course;
};

export const listCourses = async ({ query = {}, page = 1, limit = 10 }) => {
  const filters = {};

  if (query.status) filters.status = query.status;
  if (query.category) filters.category = query.category;
  if (query.level) filters.level = query.level;
  if (query.instructorId && mongoose.Types.ObjectId.isValid(query.instructorId)) {
    filters.instructorId = query.instructorId;
  }

  if (query.tags) {
    const tags = String(query.tags)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (tags.length) {
      filters.tags = { $in: tags };
    }
  }

  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
    filters.price = {};
    if (!Number.isNaN(minPrice)) filters.price.$gte = Math.max(0, minPrice);
    if (!Number.isNaN(maxPrice)) filters.price.$lte = Math.max(0, maxPrice);
  }

  if (query.search) {
    filters.$text = { $search: String(query.search).trim() };
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Course.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Course.countDocuments(filters),
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

export const getCourseById = async (courseId) => {
  return Course.findById(courseId);
};

export const updateCourse = async ({ courseId, payload, instructorId }) => {
  const updates = sanitizeUpdatePayload(payload);
  if (!Object.keys(updates).length) {
    throw new Error('No valid fields provided for update');
  }

  if (updates.title) {
    updates.slug = await buildUniqueSlug(updates.title, courseId);
  }

  Object.assign(updates, deriveCourseNumbers(updates));

  const updated = await Course.findOneAndUpdate(
    { _id: courseId, instructorId },
    { $set: updates },
    { new: true }
  );

  return updated;
};

export const deleteCourse = async ({ courseId, instructorId }) => {
  return Course.findOneAndDelete({ _id: courseId, instructorId });
};

export const publishCourse = async ({ courseId, instructorId }) => {
  return Course.findOneAndUpdate(
    { _id: courseId, instructorId },
    { $set: { status: 'published', publishedAt: new Date() } },
    { new: true }
  );
};

export const listInstructorCourses = async ({ instructorId, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Course.find({ instructorId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Course.countDocuments({ instructorId }),
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