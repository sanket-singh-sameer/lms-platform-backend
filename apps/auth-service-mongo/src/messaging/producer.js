import { requestEmailVerificationFunction, requestPasswordResetFunction } from './helper/email.helper.js';
import { getChannel } from './rabbitmq.js';

export const publishEvent = async (queueName, exchangeName, exchangeKey, data) => {
  try {
    const channel = getChannel();

    await channel.assertQueue(queueName, { durable: true });
    await channel.assertExchange(exchangeName, 'direct', { durable: true });
    await channel.bindQueue(queueName, exchangeName, exchangeKey);

    channel.publish(exchangeName, exchangeKey, Buffer.from(JSON.stringify(data)), { persistent: true });

    console.log(`📤 Event sent to ${queueName}:`, data);
  } catch (error) {
    console.error('❌ Error publishing event:', error);
  }
};


export const publishEmailVerficationEmailEvent = async (to) => {
  const queueName = 'send_verification_email';
  const exchangeName = 'email_exchange';
  const exchangeKey = 'verification_email';
  const { verificationToken } = await requestEmailVerificationFunction(to);
  await publishEvent(queueName, exchangeName, exchangeKey, { to, verificationToken });
};

export const publishPasswordResetEmailEvent = async (to) => {
  const queueName = 'send_password_reset_email';
  const exchangeName = 'email_exchange';
  const exchangeKey = 'password_reset_email';
  const { resetToken } = await requestPasswordResetFunction(to);
  await publishEvent(queueName, exchangeName, exchangeKey, { to, resetToken });
};

export const publishUserDeletedEvent = async ({ userId, email }) => {
  const queueName = 'user_deleted_course_service';
  const exchangeName = 'course.exchange';
  const exchangeKey = 'user.deleted';
  await publishEvent(queueName, exchangeName, exchangeKey, { userId, email });
};