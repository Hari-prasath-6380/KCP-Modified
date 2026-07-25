// ================= IMPORTS =================
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder with CORS headers for images
app.use("/uploads", (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  // QR code image must never cache — it changes every ~20 seconds
  if (req.path === '/last_qr.png') {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  } else {
    // Short cache for product images so updates appear quickly on all devices
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  }
  next();
}, express.static(path.join(__dirname, "uploads")));

// ================= DATABASE =================
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

// ================= MODELS =================
const User = require("./models/User");

// ================= INITIALIZE WHATSAPP =================
// Initialize WhatsApp client for notifications (auto-loads in background)
console.log("\n");
console.log("╔════════════════════════════════════════════════════════╗");
console.log("║    📱 INITIALIZING NOTIFICATION SERVICES              ║");
console.log("╚════════════════════════════════════════════════════════╝");
console.log("");

try {
  const whatsappModule = require("./whatsapp");
  console.log("✅ WhatsApp module loaded - Check above for QR code if device not linked");
  console.log("📝 Note: WhatsApp may take 20-30 seconds to initialize");
  console.log("");
} catch (error) {
  console.error("❌ WhatsApp module error:", error.message);
  console.error("📋 Details:", error);
  console.warn("⚠️  WhatsApp notifications disabled - Only Telegram will work");
  console.log("");
}

// Also initialize the notification service to ensure dependencies are loaded
try {
  require("./services/notificationService");
  console.log("✅ Notification services initialized (Telegram + WhatsApp)");
} catch (error) {
  console.error("❌ Notification service error:", error.message);
}

console.log("════════════════════════════════════════════════════════\n");

// ================= API ROUTES =================
app.use("/api/products", require("./routes/products"));
app.use("/api/users", require("./routes/admins"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/uploads", require("./routes/uploads"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/wishlist", require("./routes/wishlists"));
app.use("/api/coupons", require("./routes/coupons"));
app.use("/api/search", require("./routes/search"));
app.use("/api/videos", require("./routes/videos"));
app.use("/api/diagnostics", require("./routes/diagnostics")); // 🔍 WhatsApp & system diagnostics

// ================= AUTH ROUTES =================
app.post("/user/signup", async (req, res) => {
  try {
    const { name, email, number, password, role } = req.body;

    if (!name || !email || !number || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, email, number, password, role });
    await user.save();

    res.status(201).json({
      message: "Signup successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: `Welcome ${user.name}`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= HEALTH CHECK =================
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// Serve frontend static files from the frontend/ directory
const rootPath = path.join(__dirname, "../frontend");

// serve css, js, images from frontend folder
app.use(express.static(rootPath));

// homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(rootPath, "home.html"));
});

// all non-API routes → serve home page from frontend/
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (req.path.startsWith("/uploads")) return next();
  // Try to serve from frontend/ first, fallback to home.html
  const filePath = path.join(rootPath, req.path);
  if (require('fs').existsSync(filePath) && require('fs').statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(rootPath, "home.html"));
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Server error" });
});

// ================= API 404 ONLY =================
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});


// ================= START SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
