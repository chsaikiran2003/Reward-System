import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';
import '../models/models.dart';

class ApiService {
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<Map<String, String>> _headers() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ─── Register device ────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>?> registerDevice({
    required String deviceId,
    Map<String, dynamic>? location,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('${AppConfig.apiUrl}/auth/device'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'deviceId': deviceId, 'location': location}),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('server_user_id', data['userId']);
        if (data['token'] != null) {
          await prefs.setString('auth_token', data['token']);
        }
        return data;
      }
    } catch (e) {
      print('registerDevice error: $e');
    }
    return null;
  }

  // ─── Fetch campaigns ────────────────────────────────────────────────────────
  static Future<List<AdCampaign>> fetchCampaigns({
    double? lat,
    double? lng,
  }) async {
    try {
      var url = '${AppConfig.apiUrl}/campaigns?active=true';
      if (lat != null && lng != null) url += '&lat=$lat&lng=$lng';

      final res = await http.get(
        Uri.parse(url),
        headers: await _headers(),
      );

      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List;
        return list.map((j) => AdCampaign.fromJson(j)).toList();
      }
    } catch (e) {
      print('fetchCampaigns error: $e');
    }
    return [];
  }

  // ─── Fetch rewards ──────────────────────────────────────────────────────────
  static Future<List<Reward>> fetchRewards(String gameType) async {
    try {
      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/rewards?gameType=$gameType'),
        headers: await _headers(),
      );
      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List;
        return list.map((j) => Reward.fromJson(j)).toList();
      }
    } catch (e) {
      print('fetchRewards error: $e');
    }
    return [];
  }

  // ─── Fetch game settings ────────────────────────────────────────────────────
  static Future<List<GameSettings>> fetchGameSettings() async {
    try {
      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/game/settings'),
        headers: await _headers(),
      );
      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List;
        return list.map((j) => GameSettings.fromJson(j)).toList();
      }
    } catch (e) {
      print('fetchGameSettings error: $e');
    }
    return [];
  }

  // ─── Play game ──────────────────────────────────────────────────────────────
  static Future<GameResult?> playGame({
    required String userId,
    required String gameType,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('${AppConfig.apiUrl}/game/play'),
        headers: await _headers(),
        body: jsonEncode({'userId': userId, 'gameType': gameType}),
      );

      if (res.statusCode == 200) {
        return GameResult.fromJson(jsonDecode(res.body));
      } else {
        final err = jsonDecode(res.body);
        throw Exception(err['message'] ?? 'Game play failed');
      }
    } catch (e) {
      rethrow;
    }
  }

  // ─── Check can play ─────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> canPlay({
    required String userId,
    required String gameType,
  }) async {
    try {
      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/game/can-play?userId=$userId&gameType=$gameType'),
        headers: await _headers(),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (e) {
      print('canPlay error: $e');
    }
    return {'canPlay': true};
  }

  // ─── Record impression count ─────────────────────────────────────────────────
  static Future<int> getImpressionCount(String adId, String userId) async {
    try {
      final res = await http.get(
        Uri.parse('${AppConfig.apiUrl}/events/impression-count?adId=$adId&userId=$userId'),
        headers: await _headers(),
      );
      if (res.statusCode == 200) return jsonDecode(res.body)['count'] ?? 0;
    } catch (_) {}
    return 0;
  }
}
