const mongoose = require("mongoose");

const locationTargetSchema = new mongoose.Schema({
  type: { type: String, enum: ["city", "state", "bbox"], required: true },
  city: String,
  state: String,
  // Bounding box: { minLat, maxLat, minLng, maxLng }
  bbox: {
    minLat: Number,
    maxLat: Number,
    minLng: Number,
    maxLng: Number,
  },
});

const adCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,

    // Images stored as references to AdImage documents
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: "AdImage" }],

    // Location targeting
    locationTargets: [locationTargetSchema],

    // Schedule
    schedule: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },

    // Frequency cap — max impressions per user
    frequencyCap: { type: Number, default: 5 },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "scheduled"],
      default: "scheduled",
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Auto-derive status based on schedule dates
adCampaignSchema.methods.deriveStatus = function () {
  const now = new Date();
  if (this.schedule.startDate > now) return "scheduled";
  if (this.schedule.endDate < now) return "inactive";
  return "active";
};

module.exports = mongoose.model("AdCampaign", adCampaignSchema);
