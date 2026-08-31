const bcrypt = require("bcryptjs");
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

function normalizeRequiredText(value, label, minLength, maxLength) {
  if (typeof value !== "string") {
    throw createError(`${label} must be a string.`, 400);
  }

  const normalized = value.trim();

  if (normalized.length < minLength) {
    throw createError(`${label} must be at least ${minLength} characters long.`, 400);
  }

  if (maxLength && normalized.length > maxLength) {
    throw createError(`${label} must be ${maxLength} characters or fewer.`, 400);
  }

  return normalized;
}

function normalizeRequiredCoordinate(value, label, min, max) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw createError(`${label} must be a number between ${min} and ${max}.`, 400);
  }

  const coordinate = Number(value);

  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    throw createError(`${label} must be a number between ${min} and ${max}.`, 400);
  }

  return coordinate;
}

function normalizeAddressDetails(addressDetails) {
  if (addressDetails === undefined || addressDetails === null) {
    return undefined;
  }

  if (typeof addressDetails !== "object" || Array.isArray(addressDetails)) {
    throw createError("Address details must be an object.", 400);
  }

  const city = typeof addressDetails.city === "string" ? addressDetails.city.trim() : "";
  const state = typeof addressDetails.state === "string" ? addressDetails.state.trim() : "";
  const country = typeof addressDetails.country === "string" ? addressDetails.country.trim() : "";
  const postalCode = typeof addressDetails.postalCode === "string" ? addressDetails.postalCode.trim() : "";

  if (!city && !state && !country && !postalCode) {
    return undefined;
  }

  return {
    city,
    state,
    country,
    postalCode
  };
}

function validateRegistrationInput({ name, email, address, phone, password, latitude, longitude, addressDetails }) {
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

  normalizeRequiredText(address, "Address", 5, 250);
  normalizeRequiredCoordinate(latitude, "Latitude", -90, 90);
  normalizeRequiredCoordinate(longitude, "Longitude", -180, 180);
  normalizeAddressDetails(addressDetails);
}

function normalizeCoordinate(value) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function buildResetLink(token) {
  const baseUrl = process.env.BACKEND_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || process.env.DEPLOY_URL;

  if (!baseUrl) {
    throw createError("BACKEND_PUBLIC_URL is missing. Configure the public backend URL.", 500);
  }

  return `${baseUrl}/auth/reset-password/${token}`;
}

async function sendVerificationEmail(user, verificationCode) {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw createError("FRONTEND_URL is missing. Configure the public frontend URL.", 500);
  }

  const verifyPageUrl = `${frontendUrl.replace(/\/$/, "")}/verify-email.html?email=${encodeURIComponent(user.email)}`;
  const expiresInMinutes =
    Number(process.env.EMAIL_VERIFICATION_CODE_EXPIRES_MINUTES || process.env.EMAIL_VERIFICATION_EXPIRES_IN) || 10;

  console.log("[AUTH] Sending verification email", {
    userId: user._id?.toString()
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

  user.verificationToken = hashToken(verificationCode);
  user.verificationTokenExpires = getVerificationExpiryDate();
  await user.save();

  console.log("[AUTH] Verification token stored", {
    userId: user._id?.toString()
  });

  await sendVerificationEmail(user, verificationCode);
}

const register = asyncHandler(async (req, res) => {
  const { name, email, address, phone, password, latitude, longitude, addressDetails } = req.body;

  console.log("[AUTH] Registration request received");

  validateRegistrationInput({ name, email, address, phone, password, latitude, longitude, addressDetails });

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw createError("Email already exists.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const normalizedAddress = normalizeRequiredText(address, "Address", 5, 250);
  const normalizedAddressDetails = normalizeAddressDetails(addressDetails);
  const normalizedLatitude = normalizeRequiredCoordinate(latitude, "Latitude", -90, 90);
  const normalizedLongitude = normalizeRequiredCoordinate(longitude, "Longitude", -180, 180);

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    address: normalizedAddress,
    addressDetails: normalizedAddressDetails,
    latitude: normalizedLatitude,
    longitude: normalizedLongitude,
    phone: String(phone).trim(),
    password: hashedPassword,
    role: isAdminEmail(normalizedEmail) ? "admin" : "user",
    isVerified: false
  });

  console.log("[AUTH] User created; sending verification email", {
    userId: user._id?.toString()
  });

  if (hasSmtpConfig()) {
    await createAndSendVerificationCode(user);
  } else {
    user.verificationToken = hashToken(createVerificationCode());
    user.verificationTokenExpires = getVerificationExpiryDate();
    await user.save();
    console.warn("[AUTH] SMTP not configured. Verification code stored but not emailed.");
  }

  res.status(201).json({
    success: true,
    message: hasSmtpConfig()
      ? "Registration successful. We sent a verification code to your email."
      : "Registration successful. Email delivery is not configured, so the verification code could not be sent.",
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
      requiresVerification: true,
      verificationEmailSent: hasSmtpConfig()
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
        <script src="/reset-password-form.js"></script>
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

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, latitude, longitude } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw createError("User not found.", 404);
  }

  if (name !== undefined) {
    if (String(name).trim().length < 2) {
      throw createError("Name must be at least 2 characters long.", 400);
    }

    user.name = String(name).trim();
  }

  if (phone !== undefined) {
    user.phone = String(phone).trim();
  }

  if (address !== undefined) {
    user.address = String(address).trim();
  }

  if (latitude !== undefined) {
    user.latitude = Number.isFinite(Number(latitude)) ? Number(latitude) : null;
  }

  if (longitude !== undefined) {
    user.longitude = Number.isFinite(Number(longitude)) ? Number(longitude) : null;
  }

  await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully.",
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

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw createError("Current and new password are required.", 400);
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw createError("User not found.", 404);
  }

  const match = await bcrypt.compare(currentPassword, user.password);

  if (!match) {
    throw createError("Current password is incorrect.", 401);
  }

  if (String(newPassword).length < 6) {
    throw createError("New password must be at least 6 characters long.", 400);
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json({
    success: true,
    message: "Password updated successfully."
  });
});

const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    wishlist: user.wishlist || []
  });
});

const updateWishlist = asyncHandler(async (req, res) => {
  const { productId, name, price, image } = req.body;
  const user = await User.findById(req.user._id);

  if (!productId || !name) {
    throw createError("Product ID and name are required.", 400);
  }

  const existingItem = user.wishlist.find((item) => item.productId === productId);

  if (existingItem) {
    user.wishlist = user.wishlist.filter((item) => item.productId !== productId);
  } else {
    user.wishlist.push({ productId, name, price: Number(price) || 0, image: image || "" });
  }

  await user.save();

  res.json({
    success: true,
    message: existingItem ? "Removed from wishlist." : "Added to wishlist.",
    wishlist: user.wishlist || []
  });
});

const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    addresses: user.addresses || []
  });
});

const updateAddresses = asyncHandler(async (req, res) => {
  const { addresses } = req.body;
  const user = await User.findById(req.user._id);

  if (!Array.isArray(addresses)) {
    throw createError("Addresses must be an array.", 400);
  }

  if (addresses.length > 8) {
    throw createError("You can save up to 8 addresses.", 400);
  }

  user.addresses = addresses.map((entry, index) => {
    const address = String(entry.address || "").trim();

    if (!address) {
      throw createError(`Address ${index + 1} is required.`, 400);
    }

    return {
      label: String(entry.label || `Address ${index + 1}`).trim().slice(0, 60),
      address,
      latitude: Number.isFinite(Number(entry.latitude)) ? Number(entry.latitude) : null,
      longitude: Number.isFinite(Number(entry.longitude)) ? Number(entry.longitude) : null,
      isDefault: Boolean(entry.isDefault)
    };
  });

  if (user.addresses.length > 0 && !user.addresses.some((entry) => entry.isDefault)) {
    user.addresses[0].isDefault = true;
  }

  let defaultWasAssigned = false;
  user.addresses = user.addresses.map((entry) => {
    if (entry.isDefault && !defaultWasAssigned) {
      defaultWasAssigned = true;
      return entry;
    }

    entry.isDefault = false;
    return entry;
  });

  await user.save();

  res.json({
    success: true,
    addresses: user.addresses || []
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
  getMe,
  updateProfile,
  changePassword,
  getWishlist,
  updateWishlist,
  getAddresses,
  updateAddresses,
  validateRegistrationInput,
  normalizeRequiredText,
  normalizeRequiredCoordinate,
  normalizeAddressDetails
};
