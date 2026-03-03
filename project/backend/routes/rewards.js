const router = require("express").Router();
const { Reward } = require("../models/index");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/rewards?gameType=spin_wheel
router.get("/", protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.gameType) filter.gameType = req.query.gameType;
    const rewards = await Reward.find(filter).sort({ probabilityWeight: -1 });
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rewards
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    // Validate total weight doesn't exceed 100 for the game type
    const existing = await Reward.find({
      gameType: req.body.gameType,
      enabled: true,
    });
    const currentTotal = existing.reduce((s, r) => s + r.probabilityWeight, 0);
    if (currentTotal + (req.body.probabilityWeight || 0) > 100) {
      return res.status(400).json({
        message: `Total probability weight cannot exceed 100. Currently at ${currentTotal}`,
      });
    }

    const reward = await Reward.create(req.body);

    req.app.get("io").emit("game_config_updated", { gameType: reward.gameType });
    res.status(201).json(reward);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/rewards/:id
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const reward = await Reward.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!reward) return res.status(404).json({ message: "Reward not found" });

    req.app.get("io").emit("game_config_updated", { gameType: reward.gameType });
    res.json(reward);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/rewards/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const reward = await Reward.findByIdAndDelete(req.params.id);
    if (!reward) return res.status(404).json({ message: "Reward not found" });

    req.app.get("io").emit("game_config_updated", { gameType: reward.gameType });
    res.json({ message: "Reward deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
