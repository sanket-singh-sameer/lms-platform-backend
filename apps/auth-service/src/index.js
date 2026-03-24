import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { connectDB, disconnectDB } from './config/db.config.js';
import authRouter from './routes/auth.route.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;
let server;
let shuttingDown = false;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
	res.json({ message: 'Auth service is running' });
});

app.use('/', authRouter);

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'auth-service' });
});

app.use(notFoundHandler);
app.use(errorHandler);

const shutdown = async (reason, exitCode = 0) => {
	if (shuttingDown) return;
	shuttingDown = true;

	console.log(`Shutting down auth-service (${reason})`);

	if (server) {
		await new Promise((resolve) => {
			server.close(() => resolve());
		});
	}

	try {
		await disconnectDB();
	} catch (error) {
		console.error('Error during DB disconnect:', error);
	}

	process.exit(exitCode);
};

const start = async () => {
	try {
		await connectDB();
		server = app.listen(PORT, () => {
			console.log(`Auth service listening on port ${PORT}`);
		});
	} catch (error) {
		console.error('Startup failure:', error);
		await shutdown('startup failure', 1);
	}
};

process.on('unhandledRejection', async (reason) => {
	console.error('Unhandled Rejection:', reason);
	await shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', async (error) => {
	console.error('Uncaught Exception:', error);
	await shutdown('uncaughtException', 1);
});

process.on('SIGTERM', async () => {
	await shutdown('SIGTERM', 0);
});

process.on('SIGINT', async () => {
	await shutdown('SIGINT', 0);
});

start();