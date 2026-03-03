require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const campaignRoutes = require("./routes/campaigns");
const eventRoutes = require("./routes/events");
const rewardRoutes = require("./routes/rewards");
const gameRoutes = require("./routes/game");
const analyticsRoutes = require("./routes/analytics");
const userRoutes = require("./routes/users");

// ─── DB ──────────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ─── Express ──────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

// ─── HTTP + Socket.IO ─────────────────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Expose io globally so routes can emit
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Flutter → Server → Admin Panel
  socket.on("ad_view", (data) => {
    console.log("ad_view", data);
    io.emit("analytics_update", { type: "ad_view", ...data });
  });

  socket.on("ad_click", (data) => {
    console.log("ad_click", data);
    io.emit("analytics_update", { type: "ad_click", ...data });
  });

  socket.on("game_played", (data) => {
    io.emit("game_analytics_update", data);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
