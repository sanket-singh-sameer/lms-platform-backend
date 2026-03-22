import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
	res.json({ message: 'Auth service is running' });
});

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'auth-service' });
});

app.listen(PORT, () => {
	console.log(`Auth service listening on port ${PORT}`);
});
