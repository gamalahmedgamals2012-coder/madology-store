const express = require("express");
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter
} = require("../middleware/rate-limit.middleware");

const router = express.Router();

router.post("/register", registerLimiter, authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/verify-email-code", authController.verifyEmailCode);
router.post("/resend-verification-code", authController.resendVerificationCode);
router.post("/forgot-password", forgotPasswordLimiter, authController.forgotPassword);
router.get("/reset-password/:token", authController.renderResetPasswordForm);
router.post("/reset-password/:token", authController.resetPassword);
router.get("/me", requireAuth, authController.getMe);

module.exports = router;
