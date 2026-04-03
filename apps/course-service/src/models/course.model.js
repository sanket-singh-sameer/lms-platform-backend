import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    durationInMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    thumbnail: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    lessons: {
      type: [lessonSchema],
      default: [],
    },
    totalLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDurationInMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

courseSchema.index({ title: 'text', description: 'text', tags: 'text', category: 'text' });
courseSchema.index({ category: 1, level: 1, status: 1, createdAt: -1 });

export const Course = mongoose.model('Course', courseSchema);