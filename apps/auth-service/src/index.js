import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import sql from './config/connectDB.js';

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
	res.json({ message: 'Auth service is running' });
});

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'auth-service' });
});
app.get('/pool-test', async (req, res) => {
	try {
		const result = await sql`SELECT NOW() AS db_time`;
		res.status(200).json({
			status: 'ok',
			service: 'auth-service',
			dbConnected: true,
			dbTime: result
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			service: 'auth-service',
			dbConnected: false,
			message: error.message
		});
	}
});

app.listen(PORT, () => {
	console.log(`Auth service listening on port ${PORT}`);
});
