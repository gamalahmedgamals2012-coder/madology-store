const express = require("express");
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  verifyEmailLimiter,
  resendVerificationCodeLimiter,
  resetPasswordLimiter
} = require("../middleware/rate-limit.middleware");

const router = express.Router();

router.post("/register", registerLimiter, authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/verify-email-code", verifyEmailLimiter, authController.verifyEmailCode);
router.post("/resend-verification-code", resendVerificationCodeLimiter, authController.resendVerificationCode);
router.post("/forgot-password", forgotPasswordLimiter, authController.forgotPassword);
router.get("/reset-password/:token", authController.renderResetPasswordForm);
router.post("/reset-password/:token", resetPasswordLimiter, authController.resetPassword);
router.get("/me", requireAuth, authController.getMe);
router.put("/me", requireAuth, authController.updateProfile);
router.put("/change-password", requireAuth, authController.changePassword);
router.get("/wishlist", requireAuth, authController.getWishlist);
router.put("/wishlist", requireAuth, authController.updateWishlist);
router.get("/addresses", requireAuth, authController.getAddresses);
router.put("/addresses", requireAuth, authController.updateAddresses);

module.exports = router;
