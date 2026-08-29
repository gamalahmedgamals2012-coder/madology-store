const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_ENV";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
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

// Simple JSON file storage
const usersFile = path.join(__dirname, "users.json");

function loadUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      return JSON.parse(fs.readFileSync(usersFile, "utf8"));
    }
  } catch (err) {
    console.error("Error loading users:", err.message);
  }
  return [];
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Test route
app.get("/", (req, res) => {
  res.send("✅ Backend is working!");
});

// Register
app.post("/register", async (req, res) => {
  try {
    const { email, name, address, password } = req.body;

    if (!email || !name || !address || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const users = loadUsers();

    // Check if email exists
    if (users.some(u => u.email === email)) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      name,
      address,
      password: hashedPassword
    };

    users.push(user);
    saveUsers(users);

    // Create token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ 
      message: "✅ Registered successfully", 
      token, 
      name: user.name 
    });
  } catch (err) {
    console.error("❌ Register Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = loadUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // Create token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ 
      token, 
      name: user.name,
      message: "✅ Login successful"
    });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("📁 Using local JSON storage (no MongoDB required)");
  console.log("✅ Ready to accept requests!");
});
