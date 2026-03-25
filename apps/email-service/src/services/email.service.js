import { getTransporter } from '../config/mail.config.js';

const normalizeAddressField = (value) => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  return [value];
};

export const sendEmail = async ({ to, subject, text, html, cc, bcc, from, replyTo }) => {
  if (!to || !subject || (!text && !html)) {
    throw new Error('to, subject and text/html are required');
  }

  const smtp = getTransporter();

  const mailOptions = {
    from: from || process.env.SMTP_FROM,
    to: normalizeAddressField(to),
    cc: normalizeAddressField(cc),
    bcc: normalizeAddressField(bcc),
    subject,
    text,
    html,
    replyTo,
  };

  if (!mailOptions.from) {
    throw new Error('SMTP_FROM is required when request does not provide from');
  }

  const info = await smtp.sendMail(mailOptions);

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  };
};
