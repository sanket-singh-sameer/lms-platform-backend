import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import usersRoutes from './routes/users.routes.js';
import { connectRabbitMQ } from './messaging/rabbitmq.js';
import { startCourseEnrollmentSuccessConsumer } from './messaging/consumer.js';

dotenv.config();

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3002;

app.use(express.json());
app.use(morgan('dev'));
app.use('/users', usersRoutes);

app.get('/', (req, res) => {
	res.json({ message: 'Welcome to the User Service' });
});

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'user-service' });
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
		await startCourseEnrollmentSuccessConsumer();

		app.listen(PORT, () => {
			console.log(`User service listening on port ${PORT}`);
		});
	} catch (error) {
		console.error('Failed to start user service:', error);
		process.exit(1);
	}
};

startServer();
