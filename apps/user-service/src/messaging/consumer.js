import { getChannel } from './rabbitmq.js';

export const consumeEvent = async (queueName, callback) => {
  try {
    const channel = getChannel();

    await channel.assertQueue(queueName, { durable: true });

    console.log(`👂 Listening to queue: ${queueName}`);

    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());

        console.log(`📥 Event received from ${queueName}:`, data);

        await callback(data);

        channel.ack(msg); // acknowledge message
      }
    });
  } catch (error) {
    console.error('❌ Error consuming event:', error);
  }
};