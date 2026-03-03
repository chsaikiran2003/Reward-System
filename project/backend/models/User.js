const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // For admin panel users
    email: { type: String, sparse: true, lowercase: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["admin", "observer"],
      default: "observer",
    },

    // For Flutter app users (device-based)
    deviceId: { type: String, sparse: true, unique: true },
    location: {
      lat: Number,
      lng: Number,
      city: String,
      state: String,
      updatedAt: Date,
    },

    // Session info
    lastSeen: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
