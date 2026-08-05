const bcrypt = require("bcrypt");
const User = require("../models/User");
const asyncHandler = require("../middleware/async.middleware");
const {
  createRandomToken,
  createVerificationCode,
  hashToken,
  signAuthToken,
  getVerificationExpiryDate
} = require("../services/token.service");
const { sendEmail, hasSmtpConfig } = require("../services/email.service");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isAdminEmail(email) {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase());
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRegistrationInput({ name, email, address, phone, password }) {
  if (!name || !email || !address || !phone || !password) {
    throw createError("Name, email, address, phone, and password are required.", 400);
  }

  if (!isValidEmail(String(email).trim())) {
    throw createError("Please provide a valid email address.", 400);
  }

  if (String(name).trim().length < 2) {
    throw createError("Name must be at least 2 characters long.", 400);
  }

  if (String(phone).trim().length < 7) {
    throw createError("Phone number must be at least 7 characters long.", 400);
  }

  if (String(password).length < 6) {
    throw createError("Password must be at least 6 characters long.", 400);
  }
}

function normalizeCoordinate(value) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function buildResetLink(token) {
  const baseUrl = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${baseUrl}/auth/reset-password/${token}`;
}

async function sendVerificationEmail(user, verificationCode) {
  const verifyPageUrl = `${(process.env.FRONTEND_URL || "http://127.0.0.1:5500").replace(/\/$/, "")}/verify-email.html?email=${encodeURIComponent(user.email)}`;
  const expiresInMinutes = Number(process.env.EMAIL_VERIFICATION_CODE_EXPIRES_MINUTES) || 10;

  console.log("[AUTH] Sending verification email", {
    email: user.email,
    verificationCode,
    verifyPageUrl
  });

  try {
    const info = await sendEmail({
      to: user.email,
      subject: "Verify your MADOLOGY account",
      text: `Your MADOLOGY verification code is ${verificationCode}. It expires in ${expiresInMinutes} minutes.`,
      replyTo: process.env.EMAIL_FROM,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="margin-bottom:8px;">Welcome to MADOLOGY</h2>
          <p>Hello ${user.name},</p>
          <p>Thanks for creating your account. Use this verification code to activate it:</p>
          <div style="margin:24px 0;padding:18px 22px;border-radius:16px;background:#fff7ed;border:1px solid #fed7aa;text-align:center;">
            <span style="font-size:32px;letter-spacing:10px;font-weight:800;color:#c2410c;">${verificationCode}</span>
          </div>
          <p>This code expires in ${expiresInMinutes} minutes.</p>
          <p>Open the verification page and enter the code:</p>
          <p><a href="${verifyPageUrl}" style="color:#ea580c;font-weight:700;">${verifyPageUrl}</a></p>
        </div>
      `
    });

    console.log("[AUTH] Verification email send result", {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected
    });
  } catch (error) {
    console.error("[AUTH] Verification email failed", error);
    throw error;
  }
}

async function sendPasswordResetEmail(user, rawToken) {
  const resetLink = buildResetLink(rawToken);

  await sendEmail({
    to: user.email,
    subject: "Reset your MADOLOGY password",
    text: `Reset your password using this link: ${resetLink}`,
    html: `
      <h2>Password Reset</h2>
      <p>Hello ${user.name},</p>
      <p>Click the link below to set a new password. This link will expire in 15 minutes.</p>
      <p><a href="${resetLink}">Reset my password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `
  });
}

async function createAndSendVerificationCode(user) {
  const verificationCode = createVerificationCode();
  console.log("[AUTH] Generating verification code", {
    userId: user._id?.toString(),
    email: user.email,
    verificationCode
  });

  user.verificationToken = hashToken(verificationCode);
  user.verificationTokenExpires = getVerificationExpiryDate();
  await user.save();

  console.log("[AUTH] Verification token stored", {
    userId: user._id?.toString(),
    email: user.email,
    verificationTokenExpires: user.verificationTokenExpires
  });

  await sendVerificationEmail(user, verificationCode);
}

const register = asyncHandler(async (req, res) => {
  const { name, email, address, phone, password, latitude, longitude } = req.body;

  console.log("[AUTH] Registration request received", {
    name: String(name || "").trim(),
    email: String(email || "").trim().toLowerCase(),
    phone: String(phone || "").trim(),
    address: String(address || "").trim()
  });

  validateRegistrationInput({ name, email, address, phone, password });

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw createError("Email already exists.", 409);
  }

  if (!hasSmtpConfig()) {
    throw createError("Email sending is not configured. Add email settings to continue.", 500);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const normalizedLatitude = normalizeCoordinate(latitude);
  const normalizedLongitude = normalizeCoordinate(longitude);

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    address: String(address).trim(),
    latitude: normalizedLatitude,
    longitude: normalizedLongitude,
    phone: String(phone).trim(),
    password: hashedPassword,
    role: isAdminEmail(normalizedEmail) ? "admin" : "user",
    isVerified: false
  });

  console.log("[AUTH] User created; sending verification email", {
    userId: user._id?.toString(),
    email: user.email
  });

  await createAndSendVerificationCode(user);

  res.status(201).json({
    success: true,
    message: "Registration successful. We sent a verification code to your email.",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        latitude: user.latitude,
        longitude: user.longitude,
        isVerified: user.isVerified
      },
      requiresVerification: true
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError("Email and password are required.", 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw createError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw createError("Invalid email or password.", 401);
  }

  if (!user.isVerified) {
    throw createError("Please verify your email first", 403);
  }

  const token = signAuthToken(user);

  res.json({
    success: true,
    message: "Login successful.",
    token,
    name: user.name,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
      latitude: user.latitude,
      longitude: user.longitude,
      phone: user.phone,
      role: user.role
    }
  });
});

const verifyEmailCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw createError("Email and verification code are required.", 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    verificationToken: hashToken(String(code).trim()),
    verificationTokenExpires: { $gt: new Date() }
  });

  if (!user) {
    throw createError("Verification code is invalid or has expired.", 400);
  }

  user.isVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpires = null;
  await user.save();

  const loginToken = signAuthToken(user);

  res.json({
    success: true,
    message: "Email verified successfully.",
    token: loginToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
      latitude: user.latitude,
      longitude: user.longitude,
      phone: user.phone,
      role: user.role
    }
  });
});

const resendVerificationCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw createError("Email is required.", 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw createError("No account found for that email.", 404);
  }

  if (user.isVerified) {
    throw createError("Email is already verified.", 400);
  }

  if (!hasSmtpConfig()) {
    throw createError("Email sending is not configured. Add email settings to continue.", 500);
  }

  await createAndSendVerificationCode(user);

  res.json({
    success: true,
    message: "A new verification code has been sent to your email."
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw createError("Email is required.", 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    const resetToken = createRandomToken();
    user.passwordResetTokenHash = hashToken(resetToken);
    user.passwordResetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 15);
    await user.save();

    if (!hasSmtpConfig()) {
      throw createError("Password reset email could not be sent because email is not configured.", 500);
    }

    await sendPasswordResetEmail(user, resetToken);
  }

  res.json({
    success: true,
    message: "If that email exists, a password reset link has been sent."
  });
});

const renderResetPasswordForm = asyncHandler(async (req, res) => {
  res.type("html").send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Password | MADOLOGY</title>
        <style>
          body { font-family: Arial, sans-serif; background:#f5f5f5; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
          .card { background:#fff; width:min(420px, 92vw); padding:24px; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,.1); }
          h1 { margin-top:0; }
          input, button { width:100%; padding:12px; margin-top:12px; border-radius:10px; border:1px solid #ddd; box-sizing:border-box; }
          button { background:#ff9d00; color:#fff; border:none; cursor:pointer; font-weight:bold; }
          #message { margin-top:12px; color:#333; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Reset Password</h1>
          <p>Choose a new password for your MADOLOGY account.</p>
          <form id="resetForm">
            <input type="password" id="password" placeholder="New password" required minlength="6" />
            <button type="submit">Update Password</button>
          </form>
          <p id="message"></p>
        </div>
        <script>
          const form = document.getElementById("resetForm");
          const message = document.getElementById("message");
          form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const password = document.getElementById("password").value;
            const response = await fetch(window.location.pathname, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password })
            });
            const data = await response.json();
            message.textContent = data.message;
            if (response.ok) {
              form.reset();
            }
          });
        </script>
      </body>
    </html>
  `);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw createError("New password is required.", 400);
  }

  const hashedResetToken = hashToken(req.params.token);
  const user = await User.findOne({
    passwordResetTokenHash: hashedResetToken,
    passwordResetTokenExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    throw createError("Reset token is invalid or has expired.", 400);
  }

  user.password = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = null;
  user.passwordResetTokenExpiresAt = null;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successful. You can now log in."
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = {
  register,
  login,
  verifyEmailCode,
  resendVerificationCode,
  forgotPassword,
  renderResetPasswordForm,
  resetPassword,
  getMe
};
