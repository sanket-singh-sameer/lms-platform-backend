import { getChannel } from './rabbitmq.js';

export const publishEvent = async (queueName, data) => {
  try {
    const channel = getChannel();

    await channel.assertQueue(queueName, { durable: true });

    channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(data)),
      { persistent: true }
    );

    console.log(`📤 Event sent to ${queueName}:`, data);
  } catch (error) {
    console.error('❌ Error publishing event:', error);
  }
};