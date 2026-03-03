const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({ email, password, role: role || "observer" });
    res.status(201).json({ token: sign(user._id), user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({ token: sign(user._id), user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.json({ user: { id: req.user._id, email: req.user.email, role: req.user.role } });
});

// POST /api/auth/device  — register/update a Flutter device user
router.post("/device", async (req, res) => {
  try {
    const { deviceId, location } = req.body;
    if (!deviceId) return res.status(400).json({ message: "deviceId required" });

    let user = await User.findOne({ deviceId });
    if (!user) {
      user = new User({ deviceId, role: "observer" });
    }
    if (location) {
      user.location = { ...location, updatedAt: new Date() };
    }
    user.lastSeen = new Date();
    await user.save();

    res.json({ userId: user._id, deviceId: user.deviceId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/seed  — create default admin (dev only)
router.post("/seed", async (req, res) => {
  try {
    const exists = await User.findOne({ email: "admin@demo.com" });
    if (exists) return res.json({ message: "Admin already exists" });
    await User.create({ email: "admin@demo.com", password: "admin123", role: "admin" });
    await User.create({ email: "observer@demo.com", password: "observer123", role: "observer" });
    res.json({ message: "Seeded admin@demo.com / admin123 and observer@demo.com / observer123" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
