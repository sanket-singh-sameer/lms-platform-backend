import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import paymentRoutes from './routes/payment.routes.js';
import { connectRabbitMQ } from './messaging/rabbitmq.js';
import { startUserDeletedConsumer } from './messaging/consumer.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PAYMENT_SERVICE_PORT || process.env.COURSE_SERVICE_PORT || 3005;

app.use('/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Payment service is running' });
});

app.use('/payments', paymentRoutes);

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'payment-service' });
});

app.use('/', (req, res) => {
    res.status(404).json({ status: 'ERROR', message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ status: 'ERROR', message: 'Internal Server Error' });
});

const startServer = async () => {
	try {
		await connectDB();
		await connectRabbitMQ();
		await startUserDeletedConsumer();

		app.listen(PORT, () => {
			console.log(`Payment service listening on port ${PORT}`);
		});
	} catch (error) {
		console.error('Failed to start payment service:', error);
		process.exit(1);
	}
};

startServer();
