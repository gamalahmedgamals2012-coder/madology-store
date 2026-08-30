const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const locationRoutes = require("./routes/location.routes");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");
const productRoutes = require("./routes/product.routes");
const { apiLimiter } = require("./middleware/rate-limit.middleware");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const staticOptions = {
  maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
  immutable: process.env.NODE_ENV === "production",
  redirect: false,
  setHeaders(res, filePath) {
    if (filePath.toLowerCase().endsWith(".avif")) {
      res.type("image/avif");
    }
  }
};

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com"
        ],

        styleSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],

        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
          "data:"
        ],

        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:"
        ],

        connectSrc: [
          "'self'",
          "https:"
        ]
      }
    }
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS"));
    }
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(apiLimiter);

app.use(express.static(path.join(__dirname, "../public"), staticOptions));
app.use(
  "/ascets",
  express.static(path.join(__dirname, "../ascets"), {
    ...staticOptions,
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".avif") {
        res.setHeader("Content-Type", "image/avif");
      } else if (ext === ".webp") {
        res.setHeader("Content-Type", "image/webp");
      }
    }
  })
);
app.use("/images", express.static(path.join(__dirname, "../ascets/images"), staticOptions));

app.get("/ascets/images/Logo.png", (req, res) => {
  res.redirect(301, "/ascets/images/logo.png");
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MADOLOGY backend is online"
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok"
  });
});

app.use("/auth", authRoutes);
app.use("/location", locationRoutes);
app.use("/products", productRoutes);
app.use("/", orderRoutes);
app.use("/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
