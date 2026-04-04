import mongoose from 'mongoose';
import { Payment } from '../models/payment.model.js';
import { Refund } from '../models/refund.model.js';
import {
  captureRazorpayPayment,
  createRazorpayOrder,
  createRazorpayRefund,
  fetchRazorpayPayment,
  getRazorpayKeyId,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from './razorpay.service.js';
import { publishEvent } from '../messaging/producer.js';

const createReceipt = () => `rcpt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const normalizeCurrency = (currency = 'INR') => String(currency).toUpperCase().trim();

export const createPaymentOrder = async ({ userId, payload }) => {
  const { courseId, amount, currency = 'INR', notes = {} } = payload || {};

  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error('Valid courseId is required');
  }
  
  const numericAmount = Number(amount);
  if (!Number.isInteger(numericAmount) || numericAmount < 1) {
    throw new Error('amount must be an integer in the smallest currency unit');
  }

  const finalCurrency = normalizeCurrency(currency);
  const receipt = createReceipt();

  const order = await createRazorpayOrder({
    amount: numericAmount,
    currency: finalCurrency,
    receipt,
    notes,
  });

  const payment = await Payment.create({
    userId,
    courseId,
    amount: numericAmount,
    currency: finalCurrency,
    receipt,
    providerOrderId: order.id,
    notes,
  });

  return {
    payment,
    order,
    keyId: getRazorpayKeyId(),
  };
};

export const verifyPaymentAndCapture = async ({ userId, payload }) => {
  const {
    paymentId,
    razorpay_order_id: providerOrderId,
    razorpay_payment_id: providerPaymentId,
    razorpay_signature: providerSignature,
  } = payload || {};

  if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error('Valid paymentId is required');
  }

  if (!providerOrderId || !providerPaymentId || !providerSignature) {
    throw new Error('razorpay_order_id, razorpay_payment_id and razorpay_signature are required');
  }

  const payment = await Payment.findOne({ _id: paymentId, userId });
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.providerOrderId !== providerOrderId) {
    throw new Error('Order id mismatch for this payment');
  }

  const isSignatureValid = verifyRazorpayPaymentSignature({
    providerOrderId,
    providerPaymentId,
    providerSignature,
  });

  if (!isSignatureValid) {
    payment.status = 'failed';
    payment.failureReason = 'Invalid signature';
    await payment.save();
    throw new Error('Invalid payment signature');
  }

  const providerPayment = await fetchRazorpayPayment(providerPaymentId);
  let capturedPayment = providerPayment;

  if (providerPayment.status !== 'captured') {
    capturedPayment = await captureRazorpayPayment({
      providerPaymentId,
      amount: payment.amount,
      currency: payment.currency,
    });
  }

  payment.providerPaymentId = providerPaymentId;
  payment.providerSignature = providerSignature;
  payment.status = capturedPayment.status === 'captured' ? 'captured' : 'authorized';
  payment.paidAt = capturedPayment.captured_at
    ? new Date(Number(capturedPayment.captured_at) * 1000)
    : new Date();
  payment.metadata = {
    ...payment.metadata,
    razorpayPayment: capturedPayment,
  };

  await payment.save();

  await publishEvent('payment_events', 'payment.exchange', 'payment.captured', {
    paymentId: String(payment._id),
    userId: String(payment.userId),
    courseId: String(payment.courseId),
    amount: payment.amount,
    currency: payment.currency,
    providerPaymentId,
  });

  await publishEvent('course_enrollment_requests', 'course.exchange', 'course.enroll.requested', {
    userId: String(payment.userId),
    courseId: String(payment.courseId),
    paymentId: String(payment._id),
  });

  return payment;
};

export const listMyPayments = async ({ userId, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Payment.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments({ userId }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export const getMyPaymentById = async ({ userId, paymentId }) => {
  return Payment.findOne({ _id: paymentId, userId });
};

export const refundPayment = async ({ userId, paymentId, payload = {} }) => {
  const payment = await Payment.findOne({ _id: paymentId, userId });
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (!payment.providerPaymentId || !['captured', 'partially_refunded'].includes(payment.status)) {
    throw new Error('Only captured payments can be refunded');
  }

  const refundAmount = Number(payload.amount || payment.amount - payment.refundedAmount);
  if (!Number.isInteger(refundAmount) || refundAmount < 1) {
    throw new Error('Valid integer refund amount is required');
  }

  if (refundAmount > payment.amount - payment.refundedAmount) {
    throw new Error('Refund amount exceeds refundable balance');
  }

  const refund = await createRazorpayRefund({
    providerPaymentId: payment.providerPaymentId,
    amount: refundAmount,
    notes: {
      reason: payload.reason || 'requested_by_user',
      paymentId: String(payment._id),
      userId: String(payment.userId),
    },
  });

  await Refund.create({
    paymentId: payment._id,
    userId: payment.userId,
    amount: refundAmount,
    currency: payment.currency,
    status: refund.status === 'processed' ? 'processed' : 'created',
    providerRefundId: refund.id,
    reason: payload.reason || '',
    notes: payload.notes || {},
  });

  payment.refundedAmount += refundAmount;
  payment.status = payment.refundedAmount >= payment.amount ? 'refunded' : 'partially_refunded';
  await payment.save();

  await publishEvent('payment_events', 'payment.exchange', 'payment.refunded', {
    paymentId: String(payment._id),
    userId: String(payment.userId),
    courseId: String(payment.courseId),
    refundAmount,
    refundedAmount: payment.refundedAmount,
    status: payment.status,
  });

  return payment;
};

export const processRazorpayWebhook = async ({ rawBody, signature }) => {
  if (!signature) {
    throw new Error('Missing x-razorpay-signature header');
  }

  const isValid = verifyRazorpayWebhookSignature({
    rawBodyBuffer: rawBody,
    signature,
  });

  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }

  const event = JSON.parse(Buffer.from(rawBody).toString('utf8'));

  if (event.event === 'payment.captured') {
    const providerPaymentId = event.payload?.payment?.entity?.id;
    if (!providerPaymentId) {
      return { received: true };
    }

    await Payment.findOneAndUpdate(
      { providerPaymentId },
      {
        $set: {
          status: 'captured',
          paidAt: new Date(),
        },
      }
    );
  }

  if (event.event === 'payment.failed') {
    const providerPaymentId = event.payload?.payment?.entity?.id;
    const failureReason = event.payload?.payment?.entity?.error_description || 'Payment failed';

    if (!providerPaymentId) {
      return { received: true };
    }

    await Payment.findOneAndUpdate(
      { providerPaymentId },
      {
        $set: {
          status: 'failed',
          failureReason,
        },
      }
    );
  }

  if (event.event === 'refund.processed') {
    const providerRefundId = event.payload?.refund?.entity?.id;
    if (providerRefundId) {
      await Refund.findOneAndUpdate({ providerRefundId }, { $set: { status: 'processed' } });
    }
  }

  return { received: true };
};