class AppConfig {
  // ✅ PRODUCTION — Live Render backend (currently active)
  static const String baseUrl = 'https://reward-system-l0zi.onrender.com';

  // 🔧 LOCAL DEVELOPMENT options (uncomment as needed):
  // static const String baseUrl = 'http://10.0.2.2:5000'; // Android emulator
  // static const String baseUrl = 'http://localhost:5000'; // iOS Simulator
  // static const String baseUrl = 'http://YOUR_LOCAL_IP:5000'; // Physical device

  static const String apiUrl = '$baseUrl/api';
  static const String socketUrl = baseUrl;

  // Local storage keys
  static const String deviceIdKey = 'device_id';
  static const String userIdKey = 'user_id';
  static const String impressionPrefix = 'impressions_';
}

