import { getChannel } from './rabbitmq.js';
import mongoose from 'mongoose';
import { Enrollment } from '../models/enrollment.model.js';

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

export const startUserDeletedConsumer = async () => {
  await consumeEvent('user_deleted_course_service', async (data) => {
    const { userId } = data || {};

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Valid userId is required in user_deleted_course_service event');
    }

    await Enrollment.deleteMany({ userId });

    console.log(`✅ Removed enrollments for deleted user: ${userId}`);
  });
};