import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:math';
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../config.dart';

class AppProvider extends ChangeNotifier {
  // ─── User / Device ──────────────────────────────────────────────────────────
  String _userId = '';
  String _deviceId = '';
  Map<String, dynamic>? _location;

  String get userId => _userId;
  String get deviceId => _deviceId;
  Map<String, dynamic>? get location => _location;

  // ─── Campaigns ─────────────────────────────────────────────────────────────
  List<AdCampaign> _campaigns = [];
  bool _campaignsLoading = false;
  final Map<String, int> _localImpressions = {}; // adId → count

  List<AdCampaign> get campaigns => _campaigns;
  bool get campaignsLoading => _campaignsLoading;

  // ─── Rewards ────────────────────────────────────────────────────────────────
  List<Reward> _scratchRewards = [];
  List<Reward> _spinRewards = [];
  Map<String, GameSettings> _gameSettings = {};

  List<Reward> get scratchRewards => _scratchRewards;
  List<Reward> get spinRewards => _spinRewards;
  GameSettings? gameSettings(String type) => _gameSettings[type];

  final SocketService _socket = SocketService();

  // ─── Init ───────────────────────────────────────────────────────────────────
  Future<void> init() async {
    await _initDevice();
    await _fetchLocation();
    await _registerDevice();
    _connectSocket();
    await Future.wait([
      fetchCampaigns(),
      fetchRewards(),
      fetchGameSettings(),
    ]);
  }

  Future<void> _initDevice() async {
    final prefs = await SharedPreferences.getInstance();
    _deviceId = prefs.getString(AppConfig.deviceIdKey) ?? _generateId();
    await prefs.setString(AppConfig.deviceIdKey, _deviceId);
    _userId = prefs.getString(AppConfig.userIdKey) ?? _deviceId;
    await prefs.setString(AppConfig.userIdKey, _userId);

    // Load local impressions
    final keys = prefs.getKeys().where((k) => k.startsWith(AppConfig.impressionPrefix));
    for (final key in keys) {
      final adId = key.replaceFirst(AppConfig.impressionPrefix, '');
      _localImpressions[adId] = prefs.getInt(key) ?? 0;
    }
  }

  Future<void> _fetchLocation() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) return;

      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 10),
      );
      _location = {
        'lat': pos.latitude,
        'lng': pos.longitude,
      };
    } catch (e) {
      debugPrint('Location error: $e');
    }
  }

  Future<void> _registerDevice() async {
    final result = await ApiService.registerDevice(
      deviceId: _deviceId,
      location: _location,
    );
    if (result != null && result['userId'] != null) {
      final prefs = await SharedPreferences.getInstance();
      _userId = result['userId'];
      await prefs.setString(AppConfig.userIdKey, _userId);
    }
    notifyListeners();
  }

  void _connectSocket() {
    _socket.connect();

    _socket.onAdsUpdated((_) {
      fetchCampaigns();
    });

    _socket.onGameConfigUpdated((_) {
      fetchRewards();
      fetchGameSettings();
    });
  }

  // ─── Fetch campaigns ────────────────────────────────────────────────────────
  Future<void> fetchCampaigns() async {
    _campaignsLoading = true;
    notifyListeners();

    _campaigns = await ApiService.fetchCampaigns(
      lat: _location?['lat'],
      lng: _location?['lng'],
    );

    // Filter by schedule
    final now = DateTime.now();
    _campaigns = _campaigns.where((c) {
      return c.schedule.startDate.isBefore(now) && c.schedule.endDate.isAfter(now);
    }).toList();

    // Filter by frequency cap (check local impressions first)
    _campaigns = _campaigns.where((c) {
      final count = _localImpressions[c.id] ?? 0;
      return count < c.frequencyCap;
    }).toList();

    _campaignsLoading = false;
    notifyListeners();
  }

  // ─── Track impression ────────────────────────────────────────────────────────
  Future<void> recordAdView(String adId) async {
    // Update local count
    _localImpressions[adId] = (_localImpressions[adId] ?? 0) + 1;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('${AppConfig.impressionPrefix}$adId', _localImpressions[adId]!);

    // Emit via socket
    _socket.emitAdView(
      adId: adId,
      userId: _userId,
      location: _location,
    );
    notifyListeners();
  }

  void recordAdClick(String adId) {
    _socket.emitAdClick(
      adId: adId,
      userId: _userId,
      location: _location,
    );
  }

  // ─── Fetch rewards ──────────────────────────────────────────────────────────
  Future<void> fetchRewards() async {
    final scratch = await ApiService.fetchRewards('scratch_card');
    final spin = await ApiService.fetchRewards('spin_wheel');
    _scratchRewards = scratch;
    _spinRewards = spin;
    notifyListeners();
  }

  // ─── Fetch game settings ────────────────────────────────────────────────────
  Future<void> fetchGameSettings() async {
    final settings = await ApiService.fetchGameSettings();
    for (final s in settings) {
      _gameSettings[s.gameType] = s;
    }
    notifyListeners();
  }

  // ─── Play game ──────────────────────────────────────────────────────────────
  Future<GameResult> playGame(String gameType) async {
    final result = await ApiService.playGame(userId: _userId, gameType: gameType);
    if (result == null) throw Exception('Failed to get game result');
    return result;
  }

  String _generateId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final rand = Random.secure();
    return List.generate(16, (_) => chars[rand.nextInt(chars.length)]).join();
  }

  @override
  void dispose() {
    _socket.offAdsUpdated();
    _socket.offGameConfig();
    _socket.disconnect();
    super.dispose();
  }
}
