import { getChannel } from './rabbitmq.js';
import mongoose from 'mongoose';
import { UserProfile } from '../models/user-profile.model.js';
import { UserPreferences } from '../models/user-performance.model.js';
import { UserStats } from '../models/user-stats.model.js';
import { UserCourseEnrollment } from '../models/user-course-enrollment.model.js';

export const consumeEvent = async (queueName, callbackFxn) => {
  try {
    const channel = getChannel();

    await channel.assertQueue(queueName, { durable: true });

    console.log(`👂 Listening to queue: ${queueName}`);

    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());

          console.log(`📥 Event received from ${queueName}:`, data);

          await callbackFxn(data);
          channel.ack(msg);
        } catch (error) {
          console.error(`❌ Failed processing message from ${queueName}:`, error);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.error('❌ Error consuming event:', error);
  }
};

const pickDefinedFields = (source, fields) => {
  const output = {};

  for (const key of fields) {
    if (source[key] !== undefined && source[key] !== null) {
      output[key] = source[key];
    }
  }

  return output;
};

const profileFields = [
  'fullName',
  'username',
  'bio',
  'avatar',
  'coverImage',
  'phone',
  'dateOfBirth',
  'gender',
  'location',
  'socialLinks',
];

export const startCreateUserProfileConsumer = async () => {
  await consumeEvent('create_user_profile', async (data) => {
    const { userId } = data;

    if (!userId) {
      throw new Error('userId is required in create_user_profile event');
    }

    const existing = await UserProfile.findOne({ userId }).lean();
    if (existing) {
      return;
    }

    const payload = pickDefinedFields(data, profileFields);
    if (!payload.fullName) {
      throw new Error('fullName is required in create_user_profile event');
    }

    await UserProfile.create({ userId, ...payload });

    await Promise.all([
      UserPreferences.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId } },
        { upsert: true, new: true }
      ),
      UserStats.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId } },
        { upsert: true, new: true }
      ),
    ]);

    console.log(`✅ User profile created from event for userId: ${userId}`);
  });
};

export const startCourseEnrollmentSuccessConsumer = async () => {
  await consumeEvent('course_enrollment_success', async (data) => {
    const { userId, courseId, enrollmentId = null, paymentId = null } = data || {};

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Valid userId is required in course_enrollment_success event');
    }

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error('Valid courseId is required in course_enrollment_success event');
    }

    const enrollmentUpsertResult = await UserCourseEnrollment.updateOne(
      { userId, courseId },
      {
        $setOnInsert: {
          userId,
          courseId,
        },
        $set: {
          enrollmentId: enrollmentId && mongoose.Types.ObjectId.isValid(enrollmentId) ? enrollmentId : null,
          paymentId: paymentId && mongoose.Types.ObjectId.isValid(paymentId) ? paymentId : null,
        },
      },
      { upsert: true }
    );

    await UserStats.findOneAndUpdate(
      { userId },
      enrollmentUpsertResult.upsertedCount === 1
        ? {
            $setOnInsert: { userId },
            $inc: { enrolledCourses: 1 },
          }
        : {
            $setOnInsert: { userId },
          },
      { upsert: true, new: true }
    );

    if (enrollmentUpsertResult.upsertedCount === 1) {
      console.log(`✅ User stats updated for new enrollment: userId=${userId} courseId=${courseId}`);
      return;
    }

    console.log(`ℹ️ Enrollment already processed for userId=${userId} courseId=${courseId}`);
  });
};