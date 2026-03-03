import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config.dart';

class SocketService {
  static SocketService? _instance;
  late IO.Socket socket;

  SocketService._internal() {
    socket = IO.io(
      AppConfig.socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    socket.onConnect((_) => print('🔌 Socket connected'));
    socket.onDisconnect((_) => print('🔌 Socket disconnected'));
    socket.onConnectError((e) => print('Socket error: $e'));
  }

  factory SocketService() {
    _instance ??= SocketService._internal();
    return _instance!;
  }

  void connect() {
    if (!socket.connected) socket.connect();
  }

  void disconnect() {
    socket.disconnect();
  }

  void emitAdView({
    required String adId,
    required String userId,
    Map<String, dynamic>? location,
  }) {
    socket.emit('ad_view', {
      'adId': adId,
      'userId': userId,
      'timestamp': DateTime.now().toIso8601String(),
      'location': location,
    });
  }

  void emitAdClick({
    required String adId,
    required String userId,
    Map<String, dynamic>? location,
  }) {
    socket.emit('ad_click', {
      'adId': adId,
      'userId': userId,
      'timestamp': DateTime.now().toIso8601String(),
      'location': location,
    });
  }

  void onAdsUpdated(Function(dynamic) callback) {
    socket.on('ads_updated', callback);
  }

  void onGameConfigUpdated(Function(dynamic) callback) {
    socket.on('game_config_updated', callback);
  }

  void offAdsUpdated() => socket.off('ads_updated');
  void offGameConfig() => socket.off('game_config_updated');
}
