const router = require("express").Router();
const { AdEvent, GameSession, Reward } = require("../models/index");
const { protect } = require("../middleware/auth");

// GET /api/analytics/ads/:campaignId
router.get("/ads/:campaignId", protect, async (req, res) => {
  try {
    const { campaignId } = req.params;

    const [totalViews, totalClicks, uniqueViewers, frequencyDist] = await Promise.all([
      AdEvent.countDocuments({ type: "ad_view", adId: campaignId }),
      AdEvent.countDocuments({ type: "ad_click", adId: campaignId }),
      AdEvent.distinct("userId", { type: "ad_view", adId: campaignId }).then(
        (ids) => ids.length
      ),
      // Frequency distribution: how many users saw ad 1x, 2x, 3x…
      AdEvent.aggregate([
        { $match: { type: "ad_view", adId: require("mongoose").Types.ObjectId.createFromHexString(campaignId) } },
        { $group: { _id: "$userId", count: { $sum: 1 } } },
        { $group: { _id: "$count", users: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;

    res.json({
      totalViews,
      totalClicks,
      uniqueViewers,
      ctr: parseFloat(ctr),
      frequencyDistribution: frequencyDist.map((d) => ({
        impressions: d._id,
        users: d.users,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/games/:gameType
router.get("/games/:gameType", protect, async (req, res) => {
  try {
    const { gameType } = req.params;

    const [totalPlays, uniquePlayers, rewardDist] = await Promise.all([
      GameSession.countDocuments({ gameType }),
      GameSession.distinct("userId", { gameType }).then((ids) => ids.length),
      GameSession.aggregate([
        { $match: { gameType } },
        { $group: { _id: "$rewardLabel", count: { $sum: 1 }, totalValue: { $sum: "$rewardValue" } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const revenueExposure = rewardDist.reduce((s, r) => s + (r.totalValue || 0), 0);

    res.json({
      totalPlays,
      uniquePlayers,
      revenueExposure,
      rewardDistribution: rewardDist.map((r) => ({
        label: r._id,
        count: r.count,
        totalValue: r.totalValue,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/overview  — dashboard summary
router.get("/overview", protect, async (req, res) => {
  try {
    const [totalAdViews, totalAdClicks, totalGames] = await Promise.all([
      AdEvent.countDocuments({ type: "ad_view" }),
      AdEvent.countDocuments({ type: "ad_click" }),
      GameSession.countDocuments(),
    ]);

    res.json({ totalAdViews, totalAdClicks, totalGames });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
