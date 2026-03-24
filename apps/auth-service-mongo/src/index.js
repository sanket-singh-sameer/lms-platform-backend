import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.route.js';
import sessionRoutes from './routes/session.route.js';
import roleRoutes from './routes/role.route.js';
import morgan from 'morgan';

dotenv.config();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', authRoutes);
app.use('/sessions', sessionRoutes);
app.use('/roles', roleRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Auth service is healthy' });
});

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Auth service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start auth service:', error);
        process.exit(1);
    }
};

startServer();