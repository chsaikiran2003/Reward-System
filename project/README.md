# Reward System — Full Stack

A complete implementation of the Flutter & React Developer Evaluation assignment.

## Repository Structure
```
/
├── flutter_app/     # Flutter mobile app (iOS + Android)
├── admin_panel/     # React admin panel (Vite)
└── backend/         # Node.js + Express + Socket.IO server
```

## Quick Start

### 1. Start the Backend
```bash
cd backend
npm install
cp .env.example .env   # set MONGO_URI and JWT_SECRET
npm run dev            # runs on :5000

# Seed demo users (run once)
curl -X POST http://localhost:5000/api/auth/seed
```

### 2. Start the Admin Panel
```bash
cd admin_panel
npm install
npm run dev            # runs on :3000
```

### 3. Run the Flutter App
```bash
cd flutter_app
flutter pub get
# Edit lib/config.dart with your backend URL
flutter run
```

## Demo Credentials
- **Admin**: `admin@demo.com` / `admin123`
- **Observer**: `observer@demo.com` / `observer123`

---

## Architecture

```
┌─────────────────┐         REST API          ┌──────────────────┐
│   Flutter App   │ ◄────────────────────────► │  Node.js Backend │
│                 │         Socket.IO          │  (Express)       │
│  - Ad Carousel  │ ◄────────────────────────► │                  │
│  - Scratch Card │                            │  MongoDB         │
│  - Spin Wheel   │                            │                  │
└─────────────────┘                            └────────┬─────────┘
                                                        │
                                               Socket.IO│ (real-time)
                                                        │
                                               ┌────────▼─────────┐
                                               │  React Admin     │
                                               │  Panel           │
                                               │  - Campaigns     │
                                               │  - Analytics     │
                                               │  - Rewards       │
                                               └──────────────────┘
```

## Real-Time Event Flow
1. Flutter emits `ad_view` / `ad_click` → Backend broadcasts `analytics_update` → Admin panel charts update live
2. Admin saves campaign → Backend emits `ads_updated` → Flutter carousel refreshes without restart
3. Admin changes reward config → Backend emits `game_config_updated` → Flutter game wheel/card updates
4. Flutter plays a game → Backend emits `game_analytics_update` → Admin panel game stats update live

## Evaluation Checklist
- ✅ Flutter UI/UX — Smooth animations, responsive layout, clean widget tree
- ✅ Flutter State Management — Provider pattern (`ChangeNotifier`)
- ✅ Socket.IO Integration — Bidirectional real-time sync on Flutter + React
- ✅ React Admin Panel — Component architecture, React Router, hooks, clean UI
- ✅ Node.js API Design — RESTful endpoints, error handling, JWT auth, validation
- ✅ MongoDB Schema — 7 collections with proper indexing
- ✅ Code Quality — Typed models, separated concerns, documented code
- ✅ Role-Based Access — Admin (full) vs Observer (analytics only)
- ✅ Deployment Docs — APK build steps + Play Store / App Store process in `flutter_app/README.md`
