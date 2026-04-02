import amqp from 'amqplib';

let channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ || 'amqp://localhost:5672');
    channel = await connection.createChannel();

    console.log('✅ RabbitMQ connected');

    return channel;
  } catch (error) {
    console.error('❌ RabbitMQ connection error:', error);
    process.exit(1);
  }
};

export const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};