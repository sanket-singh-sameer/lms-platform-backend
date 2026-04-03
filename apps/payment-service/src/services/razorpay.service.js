import crypto from 'crypto';
import Razorpay from 'razorpay';

let razorpayClient;

const getRazorpayClient = () => {
  if (razorpayClient) {
    return razorpayClient;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required');
  }

  razorpayClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return razorpayClient;
};

export const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID || '';

export const createRazorpayOrder = async ({ amount, currency, receipt, notes = {} }) => {
  const client = getRazorpayClient();
  return client.orders.create({ amount, currency, receipt, notes });
};

export const fetchRazorpayPayment = async (providerPaymentId) => {
  const client = getRazorpayClient();
  return client.payments.fetch(providerPaymentId);
};

export const captureRazorpayPayment = async ({ providerPaymentId, amount, currency }) => {
  const client = getRazorpayClient();
  return client.payments.capture(providerPaymentId, amount, currency);
};

export const createRazorpayRefund = async ({ providerPaymentId, amount, notes = {} }) => {
  const client = getRazorpayClient();
  return client.payments.refund(providerPaymentId, { amount, notes });
};

export const verifyRazorpayPaymentSignature = ({
  providerOrderId,
  providerPaymentId,
  providerSignature,
}) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET is required');
  }

  const payload = `${providerOrderId}|${providerPaymentId}`;
  const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return digest === providerSignature;
};

export const verifyRazorpayWebhookSignature = ({ rawBodyBuffer, signature }) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is required');
  }

  const body = Buffer.isBuffer(rawBodyBuffer)
    ? rawBodyBuffer
    : Buffer.from(String(rawBodyBuffer || ''), 'utf8');

  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expectedSignature === signature;
};