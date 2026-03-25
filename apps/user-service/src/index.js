import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import usersRoutes from './routes/users.routes.js';
import { connectRabbitMQ } from './messaging/rabbitmq.js';
import { startCreateUserProfileConsumer } from './messaging/consumer.js';

dotenv.config();

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3002;

app.use(express.json());
app.use(morgan('dev'));
app.use('/users', usersRoutes);

app.get('/', (req, res) => {
	res.json({ message: 'User service is running' });
});

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'user-service' });
});

const startServer = async () => {
	try {
		await connectDB();
		await connectRabbitMQ();
		await startCreateUserProfileConsumer();

		app.listen(PORT, () => {
			console.log(`User service listening on port ${PORT}`);
		});
	} catch (error) {
		console.error('Failed to start user service:', error);
		process.exit(1);
	}
};

startServer();
