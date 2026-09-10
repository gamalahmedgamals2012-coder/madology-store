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
      username: user.username,
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

module.exports = {
  signAuthToken,
  verifyAuthToken
};
