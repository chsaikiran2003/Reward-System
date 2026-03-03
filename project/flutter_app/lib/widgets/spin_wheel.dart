import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../models/models.dart';

class SpinWheelWidget extends StatefulWidget {
  final List<Reward> rewards;
  final GameResult? result; // null = not spun yet
  final bool isSpinning;
  final VoidCallback onSpin;

  const SpinWheelWidget({
    super.key,
    required this.rewards,
    required this.isSpinning,
    required this.onSpin,
    this.result,
  });

  @override
  State<SpinWheelWidget> createState() => _SpinWheelWidgetState();
}

class _SpinWheelWidgetState extends State<SpinWheelWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  double _currentAngle = 0;
  double _targetAngle = 0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    );
  }

  @override
  void didUpdateWidget(SpinWheelWidget old) {
    super.didUpdateWidget(old);

    // When result arrives, animate to winning segment
    if (widget.result != null && old.result == null && widget.rewards.isNotEmpty) {
      _spinToResult(widget.result!);
    }
  }

  void _spinToResult(GameResult result) {
    final winningIndex = widget.rewards.indexWhere((r) => r.id == result.rewardId);
    if (winningIndex == -1) {
      // Just spin randomly
      _spinRandom();
      return;
    }

    final segmentAngle = (2 * math.pi) / widget.rewards.length;
    // Point to winning segment (top of wheel = -pi/2)
    final segmentCenter = winningIndex * segmentAngle + segmentAngle / 2;
    final targetRotation = (2 * math.pi * 5) - segmentCenter + (math.pi / 2);

    _animate(targetRotation);
  }

  void _spinRandom() {
    final targetRotation = (2 * math.pi * 5) + math.Random().nextDouble() * 2 * math.pi;
    _animate(targetRotation);
  }

  void _animate(double target) {
    _targetAngle = _currentAngle + target;

    _animation = Tween<double>(begin: _currentAngle, end: _targetAngle).animate(
      CurvedAnimation(parent: _controller, curve: Curves.decelerate),
    );

    _controller.reset();
    _controller.forward().then((_) {
      _currentAngle = _targetAngle % (2 * math.pi);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.rewards.isEmpty) {
      return const SizedBox(
        width: 280,
        height: 280,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return Column(
      children: [
        SizedBox(
          width: 280,
          height: 280,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Wheel
              AnimatedBuilder(
                animation: _controller,
                builder: (ctx, child) {
                  final angle = _animation.isCompleted
                      ? _currentAngle
                      : (_animation.value);
                  return Transform.rotate(
                    angle: angle,
                    child: CustomPaint(
                      size: const Size(280, 280),
                      painter: _WheelPainter(rewards: widget.rewards),
                    ),
                  );
                },
              ),
              // Center button
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.2),
                      blurRadius: 8,
                      spreadRadius: 2,
                    )
                  ],
                ),
                child: const Icon(Icons.star, color: Color(0xFF7c3aed), size: 28),
              ),
              // Pointer / arrow at top
              const Positioned(
                top: 0,
                child: Icon(Icons.arrow_drop_down, size: 40, color: Color(0xFF7c3aed)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: widget.isSpinning ? null : widget.onSpin,
          icon: widget.isSpinning
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : const Icon(Icons.refresh),
          label: Text(widget.isSpinning ? 'Spinning…' : 'SPIN!'),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF7c3aed),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 14),
            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
          ),
        ),
      ],
    );
  }
}

class _WheelPainter extends CustomPainter {
  final List<Reward> rewards;

  _WheelPainter({required this.rewards});

  Color _parseColor(String hex) {
    try {
      final h = hex.replaceFirst('#', '');
      return Color(int.parse('FF$h', radix: 16));
    } catch (_) {
      return Colors.purple;
    }
  }

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;
    final segmentAngle = (2 * math.pi) / rewards.length;

    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    for (int i = 0; i < rewards.length; i++) {
      final startAngle = i * segmentAngle - math.pi / 2;
      final reward = rewards[i];

      // Segment fill
      final paint = Paint()
        ..color = _parseColor(reward.color)
        ..style = PaintingStyle.fill;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius - 4),
        startAngle,
        segmentAngle,
        true,
        paint,
      );

      // Border
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius - 4),
        startAngle,
        segmentAngle,
        true,
        borderPaint,
      );

      // Label text
      final textAngle = startAngle + segmentAngle / 2;
      final textRadius = radius * 0.62;
      final textPos = Offset(
        center.dx + textRadius * math.cos(textAngle),
        center.dy + textRadius * math.sin(textAngle),
      );

      canvas.save();
      canvas.translate(textPos.dx, textPos.dy);
      canvas.rotate(textAngle + math.pi / 2);

      // Icon
      final iconPainter = TextPainter(
        text: TextSpan(
          text: reward.icon,
          style: const TextStyle(fontSize: 16),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      iconPainter.paint(canvas, Offset(-iconPainter.width / 2, -iconPainter.height - 2));

      // Label
      final labelPainter = TextPainter(
        text: TextSpan(
          text: _truncate(reward.label, 8),
          style: const TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout(maxWidth: 60);
      labelPainter.paint(canvas, Offset(-labelPainter.width / 2, 2));

      canvas.restore();
    }

    // Outer ring
    final outerPaint = Paint()
      ..color = const Color(0xFF7c3aed)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6;
    canvas.drawCircle(center, radius - 1, outerPaint);
  }

  String _truncate(String s, int max) => s.length > max ? '${s.substring(0, max)}…' : s;

  @override
  bool shouldRepaint(_WheelPainter old) => old.rewards != rewards;
}
