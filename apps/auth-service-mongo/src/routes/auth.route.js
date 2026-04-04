import express from 'express';
import {
	loginController,
	meController,
	oauthController,
	logoutAllController,
	logoutController,
	requestEmailVerificationController,
	requestPasswordResetController,
	resetPasswordController,
	refreshTokenController,
	deleteUserController,
	registerController,
	verifyEmailController,
	getUserEmailByIdController
} from '../controllers/auth.controller.js';



const authRoutes = express.Router();

// Placeholder for authentication routes
authRoutes.post('/register', registerController);
authRoutes.post('/login', loginController);
authRoutes.post('/oauth', oauthController);
authRoutes.post('/logout', logoutController);
authRoutes.post('/logout-all', logoutAllController);
authRoutes.get('/me', meController);
authRoutes.delete('/me', deleteUserController);

authRoutes.post('/refresh', refreshTokenController);
authRoutes.get('/users/:userId/email', getUserEmailByIdController);
authRoutes.post('/verify-email', verifyEmailController);
authRoutes.post('/resend-verification', requestEmailVerificationController);
authRoutes.post('/forgot-password', requestPasswordResetController);
authRoutes.post('/reset-password', resetPasswordController);


export default authRoutes;


