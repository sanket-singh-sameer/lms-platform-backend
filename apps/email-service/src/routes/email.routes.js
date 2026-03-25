import { Router } from 'express';
import { sendEmailController, verifySmtpController } from '../controllers/email.controller.js';

const router = Router();

router.get('/health/smtp', verifySmtpController);
router.post('/send', sendEmailController);

export default router;
