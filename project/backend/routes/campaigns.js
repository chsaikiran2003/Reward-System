const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const AdCampaign = require("../models/AdCampaign");
const { AdImage } = require("../models/index");
const { protect, adminOnly } = require("../middleware/auth");

// ─── Multer setup ─────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Helper to build full image URL
const imageUrl = (req, filename) =>
  `${req.protocol}://${req.get("host")}/uploads/${filename}`;

// ─── GET all campaigns (Flutter & Admin) ─────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const { lat, lng, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    let campaigns = await AdCampaign.find(filter)
      .populate("images")
      .populate("createdBy", "email")
      .sort({ createdAt: -1 });

    // Location filtering for Flutter clients
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      campaigns = campaigns.filter((c) => {
        if (!c.locationTargets || c.locationTargets.length === 0) return true;
        return c.locationTargets.some((t) => {
          if (t.type === "bbox" && t.bbox) {
            return (
              userLat >= t.bbox.minLat &&
              userLat <= t.bbox.maxLat &&
              userLng >= t.bbox.minLng &&
              userLng <= t.bbox.maxLng
            );
          }
          return true; // city/state matching done client-side or via geocoding
        });
      });
    }

    // Filter by schedule for Flutter (only active now)
    if (req.query.active === "true") {
      const now = new Date();
      campaigns = campaigns.filter(
        (c) => c.schedule.startDate <= now && c.schedule.endDate >= now
      );
    }

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET single campaign ──────────────────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const c = await AdCampaign.findById(req.params.id).populate("images");
    if (!c) return res.status(404).json({ message: "Campaign not found" });
    res.json(c);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST create campaign ─────────────────────────────────────────────────────
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const campaign = await AdCampaign.create({
      ...req.body,
      createdBy: req.user._id,
    });

    // Notify all Flutter clients
    req.app.get("io").emit("ads_updated", { action: "created", campaign });

    res.status(201).json(campaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── PUT update campaign ──────────────────────────────────────────────────────
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const campaign = await AdCampaign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("images");

    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // Push real-time update to all Flutter clients
    req.app.get("io").emit("ads_updated", { action: "updated", campaign });

    res.json(campaign);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── DELETE campaign ──────────────────────────────────────────────────────────
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const campaign = await AdCampaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // Also delete related images from disk
    const images = await AdImage.find({ campaign: req.params.id });
    for (const img of images) {
      const fp = path.join(uploadDir, img.filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await AdImage.deleteMany({ campaign: req.params.id });

    req.app.get("io").emit("ads_updated", { action: "deleted", id: req.params.id });
    res.json({ message: "Campaign deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST upload images to a campaign ────────────────────────────────────────
router.post(
  "/:id/images",
  protect,
  adminOnly,
  upload.array("images", 10),
  async (req, res) => {
    try {
      const campaign = await AdCampaign.findById(req.params.id);
      if (!campaign) return res.status(404).json({ message: "Campaign not found" });

      const saved = [];
      for (const file of req.files) {
        const img = await AdImage.create({
          campaign: campaign._id,
          filename: file.filename,
          url: imageUrl(req, file.filename),
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        });
        campaign.images.push(img._id);
        saved.push(img);
      }
      await campaign.save();

      const populated = await AdCampaign.findById(campaign._id).populate("images");
      req.app.get("io").emit("ads_updated", { action: "updated", campaign: populated });

      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── DELETE a single image ────────────────────────────────────────────────────
router.delete("/:campaignId/images/:imageId", protect, adminOnly, async (req, res) => {
  try {
    const img = await AdImage.findByIdAndDelete(req.params.imageId);
    if (!img) return res.status(404).json({ message: "Image not found" });

    const fp = path.join(uploadDir, img.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);

    await AdCampaign.findByIdAndUpdate(req.params.campaignId, {
      $pull: { images: img._id },
    });

    res.json({ message: "Image deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
