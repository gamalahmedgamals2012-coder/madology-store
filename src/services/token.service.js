const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function ensureJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Add it to your .env file.");
  }

  return process.env.JWT_SECRET;
}

function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      type: "auth"
    },
    ensureJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
}

function verifyAuthToken(token) {
  return jwt.verify(token, ensureJwtSecret());
}

function createRandomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function createVerificationCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getVerificationExpiryDate() {
  const minutes = Number(process.env.EMAIL_VERIFICATION_CODE_EXPIRES_MINUTES) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
  createRandomToken,
  createVerificationCode,
  hashToken,
  getVerificationExpiryDate
};
