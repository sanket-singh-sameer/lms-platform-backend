import { getChannel } from './rabbitmq.js';
import { sendEmail } from '../services/email.service.js';

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


export const startEmailVerificationEmailConsumer = async () => {
  const queueName = 'send_verification_email';

  await consumeEvent(queueName, async (payload) => {
    const { to, verificationToken } = payload;

    if (!to || !verificationToken) {
      throw new Error('Invalid email payload: to and verificationToken are required');
    }

    const subject = 'Email Verification';
    const text = `${verificationToken}`;

    await sendEmail({ to, subject, text});
    console.log(`✅ Verification email sent to ${to} with token: ${verificationToken}`);
  });
}

export const startPasswordResetEmailConsumer = async () => {
  const queueName = 'send_password_reset_email';

  await consumeEvent(queueName, async (payload) => {
    const { to, resetToken } = payload;

    if (!to || !resetToken) {
      throw new Error('Invalid email payload: to and resetToken are required');
    }

    const subject = 'Password Reset';
    const text = `${resetToken}`;

    await sendEmail({ to, subject, text});
    console.log(`✅ Password reset email sent to ${to} with token: ${resetToken}`);
  });
}