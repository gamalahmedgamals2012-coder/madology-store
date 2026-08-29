const rateLimit = require("express-rate-limit");

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

function buildLimiter(max, message) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message
    }
  });
}

const apiLimiter = buildLimiter(Number(process.env.RATE_LIMIT_MAX) || 200, "Too many requests. Please try again later.");
const loginLimiter = buildLimiter(Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5, "Too many login attempts. Please try again later.");
const registerLimiter = buildLimiter(Number(process.env.REGISTER_RATE_LIMIT_MAX) || 5, "Too many registration attempts. Please try again later.");
const forgotPasswordLimiter = buildLimiter(Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX) || 3, "Too many password reset requests. Please try again later.");
const verifyEmailLimiter = buildLimiter(Number(process.env.VERIFY_EMAIL_RATE_LIMIT_MAX) || 10, "Too many verification attempts. Please try again later.");
const resendVerificationCodeLimiter = buildLimiter(Number(process.env.RESEND_VERIFICATION_RATE_LIMIT_MAX) || 5, "Too many resend requests. Please try again later.");
const resetPasswordLimiter = buildLimiter(Number(process.env.RESET_PASSWORD_RATE_LIMIT_MAX) || 5, "Too many password reset submissions. Please try again later.");

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  verifyEmailLimiter,
  resendVerificationCodeLimiter,
  resetPasswordLimiter
};
