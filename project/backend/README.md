# Backend — Node.js + Express + Socket.IO + MongoDB

## Stack
- **Node.js** + **Express.js** — REST API
- **Socket.IO** — Real-time WebSocket communication
- **MongoDB** + **Mongoose** — Database
- **JWT** — Authentication
- **Multer** — Image uploads

---

## Setup & Run

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongod`) or a MongoDB Atlas URI

### Installation
```bash
cd backend
npm install
```

### Environment Variables
Copy `.env.example` to `.env` and fill in the values:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/reward_system` |
| `JWT_SECRET` | Secret for signing JWTs | *(required — set a long random string)* |

### Run (Development)
```bash
npm run dev
```

### Run (Production)
```bash
npm start
```

### Seed Default Users
After starting the server, call once to create demo accounts:
```bash
curl -X POST http://localhost:5000/api/auth/seed
```
This creates:
- **Admin**: `admin@demo.com` / `admin123`
- **Observer**: `observer@demo.com` / `observer123`

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register admin panel user |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/device` | Register Flutter device |
| POST | `/api/auth/seed` | Create demo users (dev only) |

### Campaigns
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/campaigns` | List campaigns (supports `?lat=&lng=&active=true`) |
| POST | `/api/campaigns` | Create campaign *(admin only)* |
| PUT | `/api/campaigns/:id` | Update campaign *(admin only)* |
| DELETE | `/api/campaigns/:id` | Delete campaign *(admin only)* |
| POST | `/api/campaigns/:id/images` | Upload images *(multipart/form-data)* |
| DELETE | `/api/campaigns/:id/images/:imageId` | Delete an image |

### Events
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/events` | Record ad_view / ad_click |
| GET | `/api/events/impression-count` | Check how many times user saw an ad |

### Rewards
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/rewards?gameType=spin_wheel` | List rewards for game |
| POST | `/api/rewards` | Create reward *(admin only)* |
| PUT | `/api/rewards/:id` | Update reward |
| DELETE | `/api/rewards/:id` | Delete reward |

### Game
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/game/play` | Play game → server-side reward roll |
| GET | `/api/game/settings` | Get game settings |
| PUT | `/api/game/settings/:gameType` | Update game settings *(admin only)* |
| GET | `/api/game/can-play` | Check if user can play now |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/analytics/ads/:campaignId` | Per-campaign ad analytics |
| GET | `/api/analytics/games/:gameType` | Per-game analytics |
| GET | `/api/analytics/overview` | Dashboard summary |

---

## Socket.IO Events

### Server → All Clients
| Event | Trigger | Payload |
|---|---|---|
| `ads_updated` | Admin creates/updates/deletes campaign | `{ action, campaign }` |
| `game_config_updated` | Admin changes rewards or settings | `{ gameType }` |
| `analytics_update` | New ad_view or ad_click | `{ type, adId, userId, location, timestamp }` |
| `game_analytics_update` | Game session completed | `{ gameType, userId, rewardLabel, rewardValue, playedAt }` |

### Flutter → Server
| Event | Trigger |
|---|---|
| `ad_view` | Banner becomes visible |
| `ad_click` | User taps banner |
| `game_played` | Game session completed |

---

## MongoDB Collections
| Collection | Purpose |
|---|---|
| `users` | Device IDs, admin users, location |
| `adcampaigns` | Campaign config, schedule, location targets |
| `adimages` | Image URLs per campaign |
| `adevents` | ad_view / ad_click events |
| `rewards` | Reward config per game type |
| `gamesessions` | Play history per user |
| `gamesettings` | Per-game config (daily cap, cooldown) |

---

## File Uploads
Uploaded images are stored in `./uploads/` directory and served statically at `/uploads/filename`.
For production, replace with cloud storage (S3, Cloudinary).
