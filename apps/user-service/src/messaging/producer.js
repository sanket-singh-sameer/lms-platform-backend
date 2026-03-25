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