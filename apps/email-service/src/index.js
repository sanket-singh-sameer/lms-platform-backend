import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import morgan from 'morgan';
import { connectRabbitMQ } from './messaging/rabbitmq.js';
import emailRoutes from './routes/email.routes.js';
import { startEmailVerificationEmailConsumer, startPasswordResetEmailConsumer } from './messaging/consumer.js';
import { verifySMTPConnection } from './config/mail.config.js';

dotenv.config();

const app = express();
const PORT = process.env.EMAIL_SERVICE_PORT || 3003;

app.use(express.json());
app.use(morgan('dev'));
app.use('/emails', emailRoutes);


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Email service is healthy' });
});

const startServer = async () => {
    try {
        await connectDB();
        await connectRabbitMQ();

        try {
            await verifySMTPConnection();
        } catch (smtpError) {
            console.warn('SMTP verification failed during startup:', smtpError.message);
        }

        await startEmailVerificationEmailConsumer();
        await startPasswordResetEmailConsumer();

        app.listen(PORT, () => {
            console.log(`Email service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start email service:', error);
        process.exit(1);
    }
};

startServer();