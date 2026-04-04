import { getChannel } from './rabbitmq.js';
import { sendEmail } from '../services/email.service.js';
import { getUserEmailByUserId } from '../services/auth-user.service.js';

export const consumeEvent = async (queueName, callbackFxn) => {
  try {
    const channel = getChannel();

    await channel.assertQueue(queueName, { durable: true });

    console.log(`👂 Listening to queue: ${queueName}`);

    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());

          console.log(`📥 Event received from ${queueName}:`, data);

          await callbackFxn(data);
          channel.ack(msg);
        } catch (error) {
          console.error(`❌ Failed processing message from ${queueName}:`, error);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.error('❌ Error consuming event:', error);
  }
};


export const startEmailVerificationEmailConsumer = async () => {
  const queueName = 'send_verification_email';

  await consumeEvent(queueName, async (payload) => {
    const { to, verificationToken } = payload;

    if (!to || !verificationToken) {
      throw new Error('Invalid email payload: to and verificationToken are required');
    }

    const subject = 'Email Verification';
    const text = `${verificationToken}`;

    await sendEmail({ to, subject, text});
    console.log(`✅ Verification email sent to ${to} with token: ${verificationToken}`);
  });
}

export const startPasswordResetEmailConsumer = async () => {
  const queueName = 'send_password_reset_email';

  await consumeEvent(queueName, async (payload) => {
    const { to, resetToken } = payload;

    if (!to || !resetToken) {
      throw new Error('Invalid email payload: to and resetToken are required');
    }

    const subject = 'Password Reset';
    const text = `${resetToken}`;

    await sendEmail({ to, subject, text});
    console.log(`✅ Password reset email sent to ${to} with token: ${resetToken}`);
  });
}

export const startCourseEnrollmentSuccessEmailConsumer = async () => {
  const queueName = 'course_enrollment_success';

  await consumeEvent(queueName, async (payload) => {
    const { to, userId, userName, courseTitle, courseId, paymentId } = payload || {};

    let recipient = to || null;
    if (!recipient && userId) {
      recipient = await getUserEmailByUserId(userId);
    }

    if (!recipient) {
      console.log('ℹ️ Skipping enrollment success email: recipient email is missing in payload and lookup');
      return;
    }

    const learnerName = userName || 'Learner';
    const courseLabel = courseTitle || `Course (${courseId || 'N/A'})`;

    const subject = 'Enrollment Confirmed';
    const text = [
      `Hi ${learnerName},`,
      '',
      `Your enrollment is confirmed for: ${courseLabel}`,
      paymentId ? `Payment Reference: ${paymentId}` : '',
      '',
      'Happy learning!',
    ]
      .filter(Boolean)
      .join('\n');

    await sendEmail({ to: recipient, subject, text });
    console.log(`✅ Enrollment confirmation email sent to ${recipient}`);
  });
};

export const startPaymentEventsEmailConsumer = async () => {
  const queueName = 'payment_events';

  await consumeEvent(queueName, async (payload) => {
    const {
      to,
      email,
      userId,
      userName,
      courseTitle,
      amount,
      currency,
      paymentId,
      providerPaymentId,
      refundAmount,
      refundedAmount,
      status,
    } = payload || {};

    let recipient = to || email || null;
    if (!recipient && userId) {
      recipient = await getUserEmailByUserId(userId);
    }

    if (!recipient) {
      console.log('ℹ️ Skipping payment event email: recipient email is missing in payload');
      return;
    }

    const learnerName = userName || 'Learner';
    const courseLabel = courseTitle || 'your course';

    const isRefundEvent = refundAmount !== undefined || refundedAmount !== undefined || status === 'refunded';

    if (isRefundEvent) {
      const subject = 'Refund Processed';
      const text = [
        `Hi ${learnerName},`,
        '',
        `Your refund has been initiated/processed for ${courseLabel}.`,
        refundAmount !== undefined ? `Refund Amount: ${refundAmount} ${currency || ''}`.trim() : '',
        refundedAmount !== undefined ? `Total Refunded: ${refundedAmount} ${currency || ''}`.trim() : '',
        paymentId ? `Payment Reference: ${paymentId}` : '',
        '',
        'If this was unexpected, please contact support.',
      ]
        .filter(Boolean)
        .join('\n');

      await sendEmail({ to: recipient, subject, text });
      console.log(`✅ Refund email sent to ${recipient}`);
      return;
    }

    const subject = 'Payment Successful';
    const text = [
      `Hi ${learnerName},`,
      '',
      `Your payment for ${courseLabel} was successful.`,
      amount !== undefined ? `Amount Paid: ${amount} ${currency || ''}`.trim() : '',
      paymentId ? `Payment ID: ${paymentId}` : '',
      providerPaymentId ? `Gateway Reference: ${providerPaymentId}` : '',
      '',
      'Thank you for learning with us!',
    ]
      .filter(Boolean)
      .join('\n');

    await sendEmail({ to: recipient, subject, text });
    console.log(`✅ Payment success email sent to ${recipient}`);
  });
};