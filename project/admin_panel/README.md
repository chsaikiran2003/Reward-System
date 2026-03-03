# Admin Panel — React + Vite

## 🚀 Live Deployment

| Service | URL |
|---------|-----|
| **Admin Panel (Vercel)** | https://reward-system-complete1.vercel.app *(update with your actual Vercel URL)* |
| **Backend API** | https://reward-system-l0zi.onrender.com |

### Demo Credentials
| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | `admin@demo.com` | `admin123` | Full access |
| Observer | `observer@demo.com` | `observer123` | Analytics only |

---


A full-featured admin panel for managing ad campaigns and reward mini-games with real-time analytics via Socket.IO.

## Stack
- **React 18** + **Vite**
- **React Router v6** — routing
- **Socket.IO Client** — live updates
- **Chart.js** + **react-chartjs-2** — analytics charts
- **Axios** — HTTP requests
- **react-hot-toast** — notifications

---

## Setup & Run

### Prerequisites
- Node.js ≥ 18
- Backend server running (see `/backend/README.md`)

### Installation
```bash
cd admin_panel
npm install
```

### Environment Variables
Create a `.env` file (optional — defaults to `http://localhost:5000`):
```env
VITE_API_URL=http://localhost:5000
```

### Run (Development)
```bash
npm run dev
```
Opens at **http://localhost:3000**

### Build (Production)
```bash
npm run build
```
Output in `dist/` folder — deploy to any static hosting (Vercel, Netlify, Nginx).

---

## Login
Run the seed endpoint first (see backend README), then:
- **Admin**: `admin@demo.com` / `admin123` — full access
- **Observer**: `observer@demo.com` / `observer123` — analytics only

---

## Features

### Role-Based Access
| Feature | Admin | Observer |
|---|---|---|
| View analytics dashboards | ✅ | ✅ |
| Create / edit / delete campaigns | ✅ | ❌ |
| Upload images | ✅ | ❌ |
| Configure rewards | ✅ | ❌ |
| Edit game settings | ✅ | ❌ |
| Manage users | ✅ | ❌ |

### Ad Campaign Manager
- Create, edit, delete campaigns
- Upload multiple images per campaign (preview before save)
- Set schedule (start/end date), frequency cap, location targets, status
- Changes instantly pushed to all connected Flutter clients via Socket.IO

### Real-Time Ad Analytics (per campaign)
- Total Views, Unique Viewers, Total Clicks, CTR (%)
- Frequency distribution chart (how many users saw ad 1×, 2×, 3×…)
- Live event feed updating as events arrive from Flutter app

### Reward Configuration
- Add/edit/delete rewards for Scratch Card and Spin Wheel separately
- Set label, icon (emoji), probability weight, color, monetary value
- Real-time validation: total enabled weights must equal 100%
- Enable/disable toggle per reward
- Changes pushed to Flutter app via Socket.IO

### Game Settings
- Max plays per user per day
- Cooldown period between plays
- Enable/disable each game

### Game Analytics (per game type)
- Total plays, unique players, revenue exposure
- Reward distribution chart
- Live updates as games are played

### User Management (Admin only)
- Create new admin/observer accounts
- Toggle user roles

---

## Project Structure
```
src/
├── App.jsx              # Router + providers
├── contexts/
│   ├── AuthContext.jsx  # JWT auth state
│   └── SocketContext.jsx # Socket.IO connection
├── services/
│   └── api.js           # Axios instance with JWT interceptor
├── components/
│   └── Layout.jsx       # Sidebar + header
└── pages/
    ├── Login.jsx
    ├── Dashboard.jsx
    ├── Campaigns.jsx
    ├── AdAnalytics.jsx
    ├── Rewards.jsx
    ├── GameAnalytics.jsx
    ├── GameSettingsPage.jsx
    └── Users.jsx
```
