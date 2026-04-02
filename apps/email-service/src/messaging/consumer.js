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

export const startEmailConsumer = async () => {
  const queueName = process.env.EMAIL_SEND_QUEUE || 'send_email';

  await consumeEvent(queueName, async (payload) => {
    const { to, subject, text, html, cc, bcc, from, replyTo } = payload;

    if (!to || !subject || (!text && !html)) {
      throw new Error('Invalid email payload: to, subject and text/html are required');
    }

    await sendEmail({ to, subject, text, html, cc, bcc, from, replyTo });
  });
};