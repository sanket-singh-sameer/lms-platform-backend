import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Payment',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
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
      enum: ['created', 'processed', 'failed'],
      default: 'created',
    },
    providerRefundId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

refundSchema.index({ paymentId: 1, createdAt: -1 });

export const Refund = mongoose.model('Refund', refundSchema);