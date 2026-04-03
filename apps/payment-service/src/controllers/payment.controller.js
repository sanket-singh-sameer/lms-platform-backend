import mongoose from 'mongoose';
import {
  createPaymentOrder,
  getMyPaymentById,
  listMyPayments,
  processRazorpayWebhook,
  refundPayment,
  verifyPaymentAndCapture,
} from '../services/payment.service.js';
import { getRequestUserId } from '../utils/request-user.js';

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  return { page, limit };
};

const sendAuthError = (res, authError) => {
  const statusCode = authError.includes('Missing') ? 401 : 400;
  return res.status(statusCode).json({ message: authError });
};

export const createPaymentOrderController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const result = await createPaymentOrder({ userId: auth.userId, payload: req.body });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to create payment order' });
  }
};

export const verifyPaymentController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const payment = await verifyPaymentAndCapture({ userId: auth.userId, payload: req.body });
    return res.status(200).json({ message: 'Payment verified successfully', payment });
  } catch (error) {
    const status = error.message === 'Payment not found' ? 404 : 400;
    return res.status(status).json({ message: error.message || 'Failed to verify payment' });
  }
};

export const razorpayWebhookController = async (req, res) => {
  try {
    const signature = req.header('x-razorpay-signature');
    const result = await processRazorpayWebhook({ rawBody: req.body, signature });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Invalid webhook' });
  }
};

export const listMyPaymentsController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const { page, limit } = parsePagination(req.query);
    const result = await listMyPayments({ userId: auth.userId, page, limit });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list payments', error: error.message });
  }
};

export const getMyPaymentByIdController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const { paymentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: 'Invalid paymentId' });
    }

    const payment = await getMyPaymentById({ userId: auth.userId, paymentId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch payment', error: error.message });
  }
};

export const createRefundController = async (req, res) => {
  try {
    const auth = getRequestUserId(req);
    if (auth.error) return sendAuthError(res, auth.error);

    const { paymentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: 'Invalid paymentId' });
    }

    const payment = await refundPayment({
      userId: auth.userId,
      paymentId,
      payload: req.body,
    });

    return res.status(200).json({ message: 'Refund initiated successfully', payment });
  } catch (error) {
    const status = error.message === 'Payment not found' ? 404 : 400;
    return res.status(status).json({ message: error.message || 'Failed to create refund' });
  }
};