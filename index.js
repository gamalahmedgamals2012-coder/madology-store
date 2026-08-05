const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("./backend/models/User");
const Order = require("./backend/models/order");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // <-- public folder for HTML/CSS/JS
app.use(
  "/ascets",
  express.static(path.join(__dirname, "ascets"), {
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

// Database
mongoose.set('strictQuery', false);
mongoose
  .connect("mongodb://127.0.0.1:27017/madology", {
    bufferCommands: false,
    connectTimeoutMS: 60000,
    socketTimeoutMS: 60000,
    serverSelectionTimeoutMS: 60000,
    retryWrites: false,
  })
  .then(() => {
    console.log("✅ DB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ DB Connection Error:", err);
    // لا تخرج من العملية، اترك السيرفر يحاول الاتصال من جديد
  });

// Test
app.get("/", (req, res) => {
  res.send("Backend is working 🎉");
});

// Register
app.post("/register", async (req, res) => {
  try {
    const { email, name, address, password } = req.body;
    if (!email || !name || !address || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ email, name, address, password: hashedPassword });
    await user.save();

    // إنشاء التوكن
    const token = jwt.sign({ id: user._id }, "SECRET123", { expiresIn: "7d" });

    // إرجاع التوكن واسم المستخدم
    res.json({ message: "Registered successfully ✅", token, name: user.name });
  } catch (err) {
    console.error("❌ Register Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user._id }, "SECRET123", { expiresIn: "7d" });
    res.json({ token, name: user.name });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Order
app.post("/order", async (req, res) => {
  try {
    const { token, cart } = req.body;
    console.log('[/order] received request — token present:', !!token, 'cart items:', Array.isArray(cart) ? cart.length : 'invalid');

    if (!token) {
      console.warn('[/order] missing token');
      return res.status(401).json({ message: "Login required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, "SECRET123");
    } catch (verifyErr) {
      console.warn('[/order] token verification failed:', verifyErr.message);
      return res.status(401).json({ message: 'Invalid token', error: verifyErr.message });
    }

    const order = new Order({ user: decoded.id, items: cart });
    await order.save();

    console.log('[/order] order saved for user:', decoded.id, 'orderId:', order._id);
    res.json({ message: "Order placed successfully 🛒" });
  } catch (err) {
    console.error("❌ Order Error:", err && err.message ? err.message : err);
    res.status(500).json({ message: "Server error", error: err && err.message ? err.message : String(err) });
  }
});

// Debug: verify token payload (for troubleshooting only — remove in production)
app.post('/debug/verify-token', (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ message: 'token required' });

  try {
    const decoded = jwt.verify(token, 'SECRET123');
    res.json({ ok: true, decoded });
  } catch (err) {
    res.status(401).json({ ok: false, message: 'Invalid token', error: err.message });
  }
});

// Admin: list orders (simple JSON endpoint)
app.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .select('-__v')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (err) {
    console.error('❌ Admin orders error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Start server
app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
