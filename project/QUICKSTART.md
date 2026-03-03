# Quick Start Guide - Reward System

## 📋 Prerequisites
- Node.js 16+ and npm
- Flutter 3.0+
- MongoDB (local or Atlas connection)
- A terminal/command prompt

---

## 🚀 Running the Full Stack (3 Terminals)

### Terminal 1: Backend Server
```bash
cd project/backend
npm run dev
```
✅ Runs on: `http://localhost:5000`
✅ MongoDB: Auto-connects at startup
✅ Demo Users: Already seeded

### Terminal 2: Admin React Panel
```bash
cd project/admin_panel
npm run dev
```
✅ Runs on: `http://localhost:3000`
✅ Login with:
- **Admin:** admin@demo.com / admin123
- **Observer:** observer@demo.com / observer123

### Terminal 3: Flutter App
```bash
cd project/flutter_app

# First time setup
flutter pub get

# Run on emulator or device
flutter run
```

---

## 🔗 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Admin login |
| `/api/campaigns` | GET/POST | Ad campaigns |
| `/api/campaigns/:id/images` | POST | Upload ad images |
| `/api/game/play` | POST | Play scratch card or spin wheel |
| `/api/rewards` | GET/POST | Game rewards |
| `/api/analytics/ads/:id` | GET | Ad statistics |
| `/api/analytics/games/:gameType` | GET | Game statistics |

---

## 📊 Real-Time Events via Socket.IO

### Server → Flutter Client
```
ads_updated             → Carousel refreshes when campaign changes
game_config_updated     → Game rewards/settings update instantly
```

### Flutter Client → Server
```
ad_view                 → User sees an ad banner (tracked)
ad_click                → User clicks an ad banner (tracked)
```

### Server → Admin Panel
```
analytics_update        → Live ad stats dashboard update
game_analytics_update   → Live game scores update
```

---

## 🎮 Features Overview

### Ad Banner Carousel
- Auto-scrolling full-width images
- Location-based filtering (GPS)
- Schedule compliance (start/end dates)
- Per-user frequency capping
- Real-time updates when admin uploads new images

### Scratch Card Game
- Reveal reward by scratching 60% of card
- Server-side probability calculation
- Daily play limit (configurable)
- Cooldown between plays

### Spin Wheel Game
- Animated spinning with deceleration
- Server-determined winning reward
- Configurable segments with probabilities
- Max plays per day & cooldown

### Admin Dashboard
- Create/edit/delete ad campaigns
- Upload & preview images
- Configure "Advanced Rewards" (probabilities)
- Real-time analytics with charts (CTR, frequency distribution)
- Game settings (cooldown, daily caps)
- Role-based access (Admin vs Observer)

---

## 🔐 Authentication

| User | Role | Access |
|------|------|--------|
| admin@demo.com | Admin | Full CRUD for campaigns, rewards, settings |
| observer@demo.com | Observer | Readonly analytics dashboard |
| (Flutter devices) | Device User | Play games, view ads (no auth needed) |

---

## 📱 Flutter Data Flow

1. **App Launch**
   - Request device registration + location
   - Fetch active campaigns (filtered by location & schedule)
   - Fetch reward configs for both games
   - Connect to WebSocket for real-time updates

2. **Ad View**
   - User sees ad banner → `ad_view` event sent to server
   - Local impression count tracked
   - Frequency cap checked before showing next ad

3. **Game Play**
   - User taps "Spin" or scratches card
   - Request to `/api/game/play` with userId + gameType
   - Server rolls probability, returns awarded reward
   - Flutter app animates to result

4. **Real-Time Sync**
   - Admin uploads new campaign image → Flutter carousel updates
   - Admin changes reward probabilities → Flutter game wheel updates instantly

---

## 🛠️ Environment Variables

All configured in `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/reward_system
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
UPLOAD_DIR=uploads
```

---

## 📂 Project Structure

```
project/
├── backend/
│   ├── server.js                 # Express + Socket.IO
│   ├── models/
│   │   ├── User.js               # Admin + device users
│   │   ├── AdCampaign.js         # Ad campaigns
│   │   └── index.js              # Reward, GameSession, GameSettings
│   └── routes/                   # API endpoints
│
├── admin_panel/
│   ├── src/
│   │   ├── pages/                # Dashboard, Campaigns, Rewards, Analytics
│   │   ├── contexts/             # Auth, Socket.IO
│   │   └── services/api.js       # Axios + JWT
│   └── vite.config.js
│
└── flutter_app/
    ├── lib/
    │   ├── screens/              # HomeScreen, ScratchCardScreen, SpinWheelScreen
    │   ├── widgets/              # AdBannerCarousel, ScratchCard, SpinWheel
    │   ├── services/             # API, Socket.IO
    │   ├── providers/app_provider.dart  # State management
    │   └── models/models.dart    # Data classes
    └── pubspec.yaml
```

---

## 🧪 Testing Checklist

- [ ] Backend starts without errors
- [ ] MongoDB connection confirmed
- [ ] Admin can login with demo credentials
- [ ] Create a test ad campaign
- [ ] Upload ad images
- [ ] See ads update live in Flutter (when socket connected)
- [ ] Play scratch card game
- [ ] Play spin wheel game
- [ ] Admin can see analytics updating in real-time
- [ ] Observer account is read-only

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows
# Kill the process or use a different port
```

### MongoDB connection fails
```bash
# Ensure MongoDB is running
mongod  # macOS/Linux
# Or verify connection string in .env
```

### Flutter can't reach backend
```dart
// Edit lib/config.dart
static const String baseUrl = 'http://YOUR_MACHINE_IP:5000';
// Use machine IP instead of localhost
```

### Admin panel doesn't load
```bash
# Clear browser cache and local storage
# Ensure backend is running first
# Check browser console for CORS errors
```

---

## 📞 Support Files

- `flutter_app/README.md` - Flutter build & store submission
- `admin_panel/README.md` - Admin panel setup
- `backend/README.md` - Backend API documentation
- `BUG_FIXES_SUMMARY.md` - What was fixed

---

**All systems are GO! 🚀 Start the three terminals and begin testing.**

