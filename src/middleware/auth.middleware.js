const User = require("../models/User");
const asyncHandler = require("./async.middleware");
const { verifyAuthToken } = require("../services/token.service");

function maskToken(token) {
  if (!token) {
    return null;
  }

  if (token.length <= 16) {
    return `${token.slice(0, 4)}...`;
  }

  return `${token.slice(0, 8)}...${token.slice(-8)}`;
}

function normalizeTokenValue(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const trimmedToken = token.trim();

  if (!trimmedToken || trimmedToken === "null" || trimmedToken === "undefined") {
    return null;
  }

  if (
    (trimmedToken.startsWith('"') && trimmedToken.endsWith('"')) ||
    (trimmedToken.startsWith("'") && trimmedToken.endsWith("'"))
  ) {
    return trimmedToken.slice(1, -1).trim();
  }

  return trimmedToken;
}

function logAuthDebug(message, details = {}) {
  if (process.env.NODE_ENV === "production" && process.env.AUTH_DEBUG !== "true") {
    return;
  }

  console.log(`[AUTH DEBUG] ${message}`, {
    ...details,
    jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
  });
}

function getBearerToken(req) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return normalizeTokenValue(authorization.slice(7));
}

const requireAuth = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req);

  logAuthDebug("Incoming protected request", {
    method: req.method,
    url: req.originalUrl,
    hasAuthorizationHeader: Boolean(req.headers.authorization),
    authorizationPrefix: req.headers.authorization ? req.headers.authorization.slice(0, 16) : null,
    extractedToken: maskToken(token),
    extractedTokenLength: token ? token.length : 0
  });

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required."
    });
  }

  let payload;

  try {
    payload = verifyAuthToken(token);
    logAuthDebug("JWT verified", {
      decodedPayload: {
        sub: payload.sub,
        role: payload.role,
        email: payload.email,
        type: payload.type,
        exp: payload.exp
      }
    });
  } catch (error) {
    logAuthDebug("JWT verification failed", {
      errorName: error.name,
      errorMessage: error.message,
      token: maskToken(token)
    });

    return res.status(401).json({
      success: false,
      code: "INVALID_AUTH_TOKEN",
      message: "Invalid or expired token. Please log in again."
    });
  }

  const user = await User.findById(payload.sub).select("-password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User not found."
    });
  }

  req.user = user;
  req.token = token;
  logAuthDebug("Authenticated user resolved", {
    userId: user._id.toString(),
    role: user.role,
    email: user.email
  });
  next();
});

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required."
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource."
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  getBearerToken,
  normalizeTokenValue
};
