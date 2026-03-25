import { verifySMTPConnection } from '../config/mail.config.js';
import { sendEmail } from '../services/email.service.js';

export const sendEmailController = async (req, res) => {
  try {
    const { to, subject, text, html, cc, bcc, from, replyTo } = req.body;

    const result = await sendEmail({
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      from,
      replyTo,
    });

    return res.status(202).json({
      message: 'Email queued to SMTP server successfully',
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to send email',
      error: error.message,
    });
  }
};

export const verifySmtpController = async (req, res) => {
  try {
    await verifySMTPConnection();
    return res.status(200).json({ message: 'SMTP connection is valid' });
  } catch (error) {
    return res.status(500).json({
      message: 'SMTP connection failed',
      error: error.message,
    });
  }
};
