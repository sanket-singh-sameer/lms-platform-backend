import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3001;

app.use(express.json());
app.use(morgan('dev'));

const targets = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  user: process.env.USER_SERVICE_URL || "http://localhost:3002",
	course: process.env.COURSE_SERVICE_URL || "http://localhost:3004",
  email: process.env.EMAIL_SERVICE_URL || "http://localhost:3003",
};

app.use('/api/auth', createProxyMiddleware({
	target: targets.auth,
	changeOrigin: true,
	pathRewrite: {'^/api/auth': ''}
}));
app.use('/api/user', createProxyMiddleware({
	target: targets.user,
	changeOrigin: true,
	pathRewrite: {'^/api/user': ''}
}));
app.use('/api/course', createProxyMiddleware({
	target: targets.course,
	changeOrigin: true,
	pathRewrite: {'^/api/course': ''}
}));
app.use('/api/email', createProxyMiddleware({
	target: targets.email,
	changeOrigin: true,
	pathRewrite: {'^/api/email': ''}
}));


app.get('/', (req, res) => {
	res.json({ message: 'API gateway is running' });
});

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

app.listen(PORT, () => {
	console.log(`API gateway listening on port ${PORT}`);
});
