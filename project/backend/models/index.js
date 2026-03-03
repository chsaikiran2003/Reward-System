const mongoose = require("mongoose");

// ─── AdImage ──────────────────────────────────────────────────────────────────
const adImageSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdCampaign",
      required: true,
    },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    originalName: String,
    mimeType: String,
    size: Number,
  },
  { timestamps: true }
);

// ─── AdEvent ──────────────────────────────────────────────────────────────────
const adEventSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["ad_view", "ad_click"], required: true },
    adId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdCampaign",
      required: true,
    },
    userId: { type: String, required: true }, // deviceId
    timestamp: { type: Date, default: Date.now },
    location: {
      lat: Number,
      lng: Number,
      city: String,
      state: String,
    },
  },
  { timestamps: true }
);

// Indexes for analytics queries
adEventSchema.index({ adId: 1, type: 1 });
adEventSchema.index({ adId: 1, userId: 1 });
adEventSchema.index({ timestamp: -1 });

// ─── Reward ───────────────────────────────────────────────────────────────────
const rewardSchema = new mongoose.Schema(
  {
    gameType: {
      type: String,
      enum: ["scratch_card", "spin_wheel"],
      required: true,
    },
    label: { type: String, required: true },
    icon: String,
    imageUrl: String,
    probabilityWeight: { type: Number, min: 0, max: 100, default: 0 },
    color: { type: String, default: "#4CAF50" },
    enabled: { type: Boolean, default: true },
    value: { type: Number, default: 0 }, // monetary value in ₹
  },
  { timestamps: true }
);

// ─── GameSession ──────────────────────────────────────────────────────────────
const gameSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    gameType: {
      type: String,
      enum: ["scratch_card", "spin_wheel"],
      required: true,
    },
    rewardId: { type: mongoose.Schema.Types.ObjectId, ref: "Reward" },
    rewardLabel: String,
    rewardValue: Number,
    playedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

gameSessionSchema.index({ userId: 1, gameType: 1, playedAt: -1 });

// ─── GameSettings ─────────────────────────────────────────────────────────────
const gameSettingsSchema = new mongoose.Schema(
  {
    gameType: {
      type: String,
      enum: ["scratch_card", "spin_wheel"],
      required: true,
      unique: true,
    },
    maxPlaysPerDay: { type: Number, default: 3 },
    cooldownMinutes: { type: Number, default: 60 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = {
  AdImage: mongoose.model("AdImage", adImageSchema),
  AdEvent: mongoose.model("AdEvent", adEventSchema),
  Reward: mongoose.model("Reward", rewardSchema),
  GameSession: mongoose.model("GameSession", gameSessionSchema),
  GameSettings: mongoose.model("GameSettings", gameSettingsSchema),
};
