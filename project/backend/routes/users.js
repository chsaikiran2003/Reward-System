const router = require("express").Router();
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/users  (admin only — list admin panel users)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ email: { $exists: true } }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id/role
router.put("/:id/role", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
