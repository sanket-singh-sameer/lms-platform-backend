import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';

dotenv.config();

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3002;

app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
	res.json({ message: 'User service is running' });
});

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'user-service' });
});

app.listen(PORT, () => {
	console.log(`User service listening on port ${PORT}`);
});
