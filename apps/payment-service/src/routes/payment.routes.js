import { Router } from 'express';
import {
  createPaymentOrderController,
  createRefundController,
  getMyPaymentByIdController,
  listMyPaymentsController,
  razorpayWebhookController,
  verifyPaymentController,
} from '../controllers/payment.controller.js';

const router = Router();

router.post('/orders', createPaymentOrderController);
router.post('/verify', verifyPaymentController);
router.post('/webhook', razorpayWebhookController);

router.get('/me', listMyPaymentsController);
router.get('/:paymentId', getMyPaymentByIdController);
router.post('/:paymentId/refund', createRefundController);

export default router;