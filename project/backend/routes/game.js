const router = require("express").Router();
const { Reward, GameSession, GameSettings } = require("../models/index");
const { protect, adminOnly } = require("../middleware/auth");

// ─── Weighted random selection ────────────────────────────────────────────────
function pickReward(rewards) {
  const eligible = rewards.filter((r) => r.enabled && r.probabilityWeight > 0);
  if (!eligible.length) return null;

  const total = eligible.reduce((s, r) => s + r.probabilityWeight, 0);
  let rand = Math.random() * total;

  for (const reward of eligible) {
    rand -= reward.probabilityWeight;
    if (rand <= 0) return reward;
  }
  return eligible[eligible.length - 1];
}

// ─── POST /api/game/play ─────────────────────────────────────────────────────
router.post("/play", protect, async (req, res) => {
  try {
    const { userId, gameType } = req.body;
    if (!userId || !gameType)
      return res.status(400).json({ message: "userId and gameType required" });

    // Check game settings
    const settings = await GameSettings.findOne({ gameType });
    if (settings && !settings.enabled)
      return res.status(403).json({ message: "This game is currently disabled" });

    if (settings) {
      // Daily cap check
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayCount = await GameSession.countDocuments({
        userId,
        gameType,
        playedAt: { $gte: startOfDay },
      });
      if (todayCount >= settings.maxPlaysPerDay) {
        return res.status(429).json({ message: "Daily play limit reached" });
      }

      // Cooldown check
      if (settings.cooldownMinutes > 0) {
        const lastSession = await GameSession.findOne({ userId, gameType }).sort({
          playedAt: -1,
        });
        if (lastSession) {
          const elapsed = (Date.now() - lastSession.playedAt.getTime()) / 60000;
          if (elapsed < settings.cooldownMinutes) {
            const remaining = Math.ceil(settings.cooldownMinutes - elapsed);
            return res.status(429).json({
              message: `Cooldown active. Try again in ${remaining} min`,
              remainingMinutes: remaining,
            });
          }
        }
      }
    }

    // Pick reward server-side
    const rewards = await Reward.find({ gameType, enabled: true });
    const winner = pickReward(rewards);

    if (!winner) {
      return res.status(500).json({ message: "No rewards configured" });
    }

    // Save session
    const session = await GameSession.create({
      userId,
      gameType,
      rewardId: winner._id,
      rewardLabel: winner.label,
      rewardValue: winner.value,
    });

    // Emit real-time game analytics
    req.app.get("io").emit("game_analytics_update", {
      gameType,
      userId,
      rewardLabel: winner.label,
      rewardValue: winner.value,
      playedAt: session.playedAt,
    });

    res.json({
      rewardId: winner._id,
      rewardLabel: winner.label,
      rewardValue: winner.value,
      icon: winner.icon,
      color: winner.color,
      imageUrl: winner.imageUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/game/settings ───────────────────────────────────────────────────
router.get("/settings", protect, async (req, res) => {
  try {
    const settings = await GameSettings.find();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/game/settings/:gameType ────────────────────────────────────────
router.put("/settings/:gameType", protect, adminOnly, async (req, res) => {
  try {
    const settings = await GameSettings.findOneAndUpdate(
      { gameType: req.params.gameType },
      req.body,
      { upsert: true, new: true, runValidators: true }
    );
    req.app.get("io").emit("game_config_updated", { gameType: req.params.gameType });
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── GET /api/game/can-play ───────────────────────────────────────────────────
router.get("/can-play", protect, async (req, res) => {
  try {
    const { userId, gameType } = req.query;
    const settings = await GameSettings.findOne({ gameType });

    const result = { canPlay: true, reason: null, remainingPlays: null };

    if (settings && !settings.enabled) {
      return res.json({ canPlay: false, reason: "Game disabled" });
    }

    if (settings) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayCount = await GameSession.countDocuments({
        userId,
        gameType,
        playedAt: { $gte: startOfDay },
      });
      result.remainingPlays = Math.max(0, settings.maxPlaysPerDay - todayCount);
      if (todayCount >= settings.maxPlaysPerDay) {
        result.canPlay = false;
        result.reason = "Daily limit reached";
      }

      if (result.canPlay && settings.cooldownMinutes > 0) {
        const last = await GameSession.findOne({ userId, gameType }).sort({ playedAt: -1 });
        if (last) {
          const elapsed = (Date.now() - last.playedAt.getTime()) / 60000;
          if (elapsed < settings.cooldownMinutes) {
            result.canPlay = false;
            result.cooldownRemaining = Math.ceil(settings.cooldownMinutes - elapsed);
            result.reason = `Cooldown: ${result.cooldownRemaining} min remaining`;
          }
        }
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
