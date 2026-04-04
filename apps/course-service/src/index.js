import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import courseRoutes from './routes/course.routes.js';
import { connectRabbitMQ } from './messaging/rabbitmq.js';
import { startCourseEnrollmentConsumer, startUserDeletedConsumer } from './messaging/consumer.js';

dotenv.config();

const app = express();
const PORT = process.env.COURSE_SERVICE_PORT || process.env.USER_SERVICE_PORT || 3004;

app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Course service is running' });
});

app.use('/courses', courseRoutes);

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'course-service' });
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
		await startCourseEnrollmentConsumer();

		app.listen(PORT, () => {
			console.log(`Course service listening on port ${PORT}`);
		});
	} catch (error) {
		console.error('Failed to start course service:', error);
		process.exit(1);
	}
};

startServer();
