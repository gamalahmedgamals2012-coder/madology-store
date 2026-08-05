const nodemailer = require("nodemailer");

let transporter;

function hasSmtpConfig() {
  return Boolean(
    (process.env.EMAIL_HOST || process.env.SMTP_HOST) &&
      (process.env.EMAIL_PORT || process.env.SMTP_PORT) &&
      (process.env.EMAIL_USER || process.env.SMTP_USER) &&
      (process.env.EMAIL_PASS || process.env.SMTP_PASS) &&
      process.env.EMAIL_FROM
  );
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!hasSmtpConfig()) {
    throw new Error("SMTP configuration is incomplete. Check your email environment variables.");
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
    port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT),
    secure: String(process.env.EMAIL_SECURE || process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
    }
  });

  return transporter;
}

async function sendEmail({ to, subject, html, text, replyTo, headers }) {
  const activeTransporter = getTransporter();
  const fromAddress = process.env.EMAIL_FROM;
  const resolvedReplyTo = replyTo || fromAddress;

  console.log("[EMAIL] Starting send", {
    to,
    subject,
    from: fromAddress,
    replyTo: resolvedReplyTo,
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
    port: process.env.EMAIL_PORT || process.env.SMTP_PORT,
    secure: process.env.EMAIL_SECURE || process.env.SMTP_SECURE,
    user: process.env.EMAIL_USER || process.env.SMTP_USER
  });

  try {
    console.log("[EMAIL] Verifying SMTP transporter...");
    await activeTransporter.verify();
    console.log("[EMAIL] SMTP transporter verified successfully");

    const info = await activeTransporter.sendMail({
      from: fromAddress,
      to,
      replyTo: resolvedReplyTo,
      subject,
      html,
      text,
      priority: "normal",
      headers: {
        "X-Mailer": "MADOLOGY",
        "X-Priority": "3",
        ...(headers || {})
      }
    });

    console.log("[EMAIL] Send completed", {
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending || [],
      response: info.response,
      messageId: info.messageId
    });

    return info;
  } catch (error) {
    console.error("[EMAIL] Mail send failed", {
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = {
  sendEmail,
  hasSmtpConfig
};
