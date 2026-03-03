# Flutter App — Reward System

A Flutter mobile application featuring a real-time ad banner carousel and two reward mini-games (Scratch Card & Spin Wheel), communicating with a Node.js backend via REST API and Socket.IO.

## Stack
- **Flutter 3.x** (Dart 3.0+)
- **Provider** — state management
- **Socket.IO Client** — real-time updates
- **Geolocator** — GPS location
- **Cached Network Image** — optimized image loading
- **Shared Preferences** — local storage

---

## Setup & Run

### Prerequisites
- Flutter SDK ≥ 3.0.0 (`flutter --version`)
- Android Studio / Xcode (for emulators)
- Backend server running

### Installation
```bash
cd flutter_app
flutter pub get
```

### Configure Backend URL
Edit `lib/config.dart`:
```dart
// Android emulator (default)
static const String baseUrl = 'http://10.0.2.2:5000';

// iOS Simulator
// static const String baseUrl = 'http://localhost:5000';

// Physical device (use your machine's local IP)
// static const String baseUrl = 'http://192.168.1.100:5000';
```

### Run on Emulator/Device
```bash
# List available devices
flutter devices

# Run on specific device
flutter run -d <device_id>

# Run in debug mode
flutter run

# Run in release mode
flutter run --release
```

---

## Features

### Task 1 — Ad Banner Carousel
- **Full-width auto-scrolling carousel** with smooth page transitions
- **Location-based filtering**: sends GPS coordinates to backend, receives only regionally targeted ads
- **Schedule enforcement**: only shows ads within their active window
- **Frequency capping**: tracks impressions locally (+ syncs to backend); hides ads once cap is reached
- **Real-time updates**: listens for `ads_updated` Socket.IO event — carousel refreshes instantly when admin uploads new images
- **Analytics events**: emits `ad_view` (on visibility) and `ad_click` (on tap) with user_id, timestamp, location

### Task 2A — Scratch Card
- Custom `CustomPainter`-based scratch surface with `BlendMode.clear` erasure
- Smooth stroke-connected scratch effect (no gaps between finger movements)
- Configurable reveal threshold (default 60%)
- Progress indicator showing scratch completion
- Server-side reward determination (backend picks winner, Flutter only animates)
- Celebration animation on reveal
- "Congratulations" / "Better Luck Next Time" message based on reward value

### Task 2B — Spin Wheel
- Animated wheel rendered with `CustomPainter` (colored segments, icons, labels)
- Server determines winning segment first → wheel decelerates precisely to that segment
- `Curves.decelerate` for natural physics feel
- Reward result card with slide-in animation
- Displays all possible rewards and their probabilities

### State Management (Provider)
- `AppProvider` manages all app state: device ID, location, campaigns, rewards, game settings
- Socket events trigger state updates → UI rebuilds automatically
- No prop-drilling: any widget can access state via `context.read<AppProvider>()`

---

## Project Structure
```
lib/
├── main.dart                    # App entry, Provider setup
├── config.dart                  # Backend URL config
├── models/
│   └── models.dart              # AdCampaign, Reward, GameResult, etc.
├── providers/
│   └── app_provider.dart        # Central state (ChangeNotifier)
├── services/
│   ├── api_service.dart         # REST API calls
│   └── socket_service.dart      # Socket.IO wrapper
├── screens/
│   ├── home_screen.dart         # Main screen with carousel + game cards
│   ├── scratch_card_screen.dart # Scratch Card game screen
│   └── spin_wheel_screen.dart   # Spin Wheel game screen
└── widgets/
    ├── ad_banner_carousel.dart  # Auto-scrolling carousel widget
    ├── scratch_card.dart        # Scratch card with CustomPainter
    └── spin_wheel.dart          # Spin wheel with CustomPainter + Animation
```

---

## Build APK (Android)

### Debug APK
```bash
flutter build apk --debug
# Output: build/app/outputs/flutter-apk/app-debug.apk
```

### Release APK
```bash
# 1. Generate keystore (one time)
keytool -genkey -v -keystore ~/upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload

# 2. Create android/key.properties
cat > android/key.properties << EOF
storePassword=<your-keystore-password>
keyPassword=<your-key-password>
keyAlias=upload
storeFile=<path-to-keystore.jks>
EOF

# 3. Update android/app/build.gradle to reference key.properties
# (see Flutter docs: https://docs.flutter.dev/deployment/android)

# 4. Build release APK
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk

# Or build App Bundle (for Play Store)
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

---

## Play Store Deployment Steps

### What I would do in production:

**1. App Setup**
- Create app in [Google Play Console](https://play.google.com/console)
- Set app name, description, screenshots, icon (512×512 PNG), feature graphic (1024×500 PNG)
- Set content rating, target audience, data safety form

**2. Release Signing**
- Generate upload keystore with `keytool` (above)
- Configure `build.gradle` to sign release builds
- Keep keystore secure (never commit to git)

**3. Backend for Production**
- Deploy backend to cloud (e.g., Railway, Render, AWS EC2)
- Update `lib/config.dart` with production URL
- Replace `localhost` image URLs with production domain in uploads
- Use HTTPS (required by Android 9+ and Play Store)

**4. Where I Got Stuck (Honest Assessment)**
- **Geolocator on emulators**: GPS permission flow works fine on physical devices but can be flaky on Android emulators without mock location configured
- **Socket.IO on Android**: `10.0.2.2` works for emulators but physical devices need the actual LAN IP of the development machine
- **Image caching on first load**: `CachedNetworkImage` needs the image URLs to be publicly accessible — images served from `localhost` won't work on physical devices unless port-forwarded
- **iOS deployment**: Requires a paid Apple Developer account ($99/year), Xcode on macOS, and provisioning profiles. The Dart/Flutter code is identical; only the build environment differs
- **Play Store review**: Takes 1–3 days for first submission; updates are faster. The app must comply with Google Play policies (no misleading gambling mechanics without proper disclosures)

**5. iOS / App Store Deployment**
```bash
# Build iOS (requires macOS + Xcode)
flutter build ios --release

# Then in Xcode:
# - Set Bundle ID, Team, provisioning profile
# - Product → Archive
# - Distribute to App Store Connect
# - Submit for TestFlight beta → then production review
```

---

## Android Permissions Required
Declared in `AndroidManifest.xml`:
- `INTERNET` — backend API + Socket.IO
- `ACCESS_FINE_LOCATION` — GPS coordinates for ad targeting
- `ACCESS_COARSE_LOCATION` — fallback location

---

## Testing
```bash
# Run unit tests
flutter test

# Run with coverage
flutter test --coverage
```
