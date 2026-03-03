const router = require("express").Router();
const { AdEvent } = require("../models/index");
const { protect } = require("../middleware/auth");

// POST /api/events  — Flutter emits ad_view / ad_click via REST fallback
router.post("/", protect, async (req, res) => {
  try {
    const { type, adId, userId, location } = req.body;
    if (!["ad_view", "ad_click"].includes(type))
      return res.status(400).json({ message: "Invalid event type" });

    const event = await AdEvent.create({ type, adId, userId, location });

    // Also emit via socket so admin panel updates in real time
    req.app.get("io").emit("analytics_update", {
      type,
      adId,
      userId,
      location,
      timestamp: event.timestamp,
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/impression-count  — used by Flutter to check frequency cap
router.get("/impression-count", protect, async (req, res) => {
  try {
    const { adId, userId } = req.query;
    const count = await AdEvent.countDocuments({ type: "ad_view", adId, userId });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
