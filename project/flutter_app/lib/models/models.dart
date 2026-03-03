// ─── Ad Campaign ─────────────────────────────────────────────────────────────
class AdImage {
  final String id;
  final String url;

  AdImage({required this.id, required this.url});

  factory AdImage.fromJson(Map<String, dynamic> j) =>
      AdImage(id: j['_id'] ?? '', url: j['url'] ?? '');
}

class AdSchedule {
  final DateTime startDate;
  final DateTime endDate;

  AdSchedule({required this.startDate, required this.endDate});

  factory AdSchedule.fromJson(Map<String, dynamic> j) => AdSchedule(
        startDate: DateTime.parse(j['startDate']),
        endDate: DateTime.parse(j['endDate']),
      );

  bool get isActive {
    final now = DateTime.now();
    return now.isAfter(startDate) && now.isBefore(endDate);
  }
}

class AdCampaign {
  final String id;
  final String name;
  final List<AdImage> images;
  final AdSchedule schedule;
  final int frequencyCap;
  final String status;

  AdCampaign({
    required this.id,
    required this.name,
    required this.images,
    required this.schedule,
    required this.frequencyCap,
    required this.status,
  });

  factory AdCampaign.fromJson(Map<String, dynamic> j) => AdCampaign(
        id: j['_id'] ?? '',
        name: j['name'] ?? '',
        images: (j['images'] as List? ?? [])
            .map((i) => AdImage.fromJson(i))
            .toList(),
        schedule: AdSchedule.fromJson(j['schedule'] ?? {'startDate': DateTime.now().toIso8601String(), 'endDate': DateTime.now().toIso8601String()}),
        frequencyCap: j['frequencyCap'] ?? 5,
        status: j['status'] ?? 'inactive',
      );
}

// ─── Reward ───────────────────────────────────────────────────────────────────
class Reward {
  final String id;
  final String gameType;
  final String label;
  final String icon;
  final int probabilityWeight;
  final String color;
  final bool enabled;
  final double value;
  final String? imageUrl;

  Reward({
    required this.id,
    required this.gameType,
    required this.label,
    required this.icon,
    required this.probabilityWeight,
    required this.color,
    required this.enabled,
    required this.value,
    this.imageUrl,
  });

  factory Reward.fromJson(Map<String, dynamic> j) => Reward(
        id: j['_id'] ?? '',
        gameType: j['gameType'] ?? '',
        label: j['label'] ?? '',
        icon: j['icon'] ?? '🎁',
        probabilityWeight: j['probabilityWeight'] ?? 0,
        color: j['color'] ?? '#7c3aed',
        enabled: j['enabled'] ?? true,
        value: (j['value'] ?? 0).toDouble(),
        imageUrl: j['imageUrl'],
      );
}

// ─── Game Settings ────────────────────────────────────────────────────────────
class GameSettings {
  final String gameType;
  final int maxPlaysPerDay;
  final int cooldownMinutes;
  final bool enabled;

  GameSettings({
    required this.gameType,
    required this.maxPlaysPerDay,
    required this.cooldownMinutes,
    required this.enabled,
  });

  factory GameSettings.fromJson(Map<String, dynamic> j) => GameSettings(
        gameType: j['gameType'] ?? '',
        maxPlaysPerDay: j['maxPlaysPerDay'] ?? 3,
        cooldownMinutes: j['cooldownMinutes'] ?? 60,
        enabled: j['enabled'] ?? true,
      );
}

// ─── Game Result ──────────────────────────────────────────────────────────────
class GameResult {
  final String rewardId;
  final String rewardLabel;
  final double rewardValue;
  final String icon;
  final String color;

  GameResult({
    required this.rewardId,
    required this.rewardLabel,
    required this.rewardValue,
    required this.icon,
    required this.color,
  });

  factory GameResult.fromJson(Map<String, dynamic> j) => GameResult(
        rewardId: j['rewardId'] ?? '',
        rewardLabel: j['rewardLabel'] ?? '',
        rewardValue: (j['rewardValue'] ?? 0).toDouble(),
        icon: j['icon'] ?? '🎁',
        color: j['color'] ?? '#7c3aed',
      );
}
