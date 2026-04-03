import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      default: 'razorpay',
      enum: ['razorpay'],
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'partially_refunded', 'refunded'],
      default: 'created',
      index: true,
    },
    receipt: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    providerOrderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    providerPaymentId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    providerSignature: {
      type: String,
      default: null,
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: Object,
      default: {},
    },
    metadata: {
      type: Object,
      default: {},
    },
    failureReason: {
      type: String,
      default: null,
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ courseId: 1, userId: 1, status: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);