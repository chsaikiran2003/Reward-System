import 'package:flutter/material.dart';
import '../models/models.dart';

class ScratchCardWidget extends StatefulWidget {
  final GameResult? result; // null = loading
  final VoidCallback? onReveal;
  final double revealThreshold; // 0.0–1.0

  const ScratchCardWidget({
    super.key,
    this.result,
    this.onReveal,
    this.revealThreshold = 0.60,
  });

  @override
  State<ScratchCardWidget> createState() => _ScratchCardWidgetState();
}

class _ScratchCardWidgetState extends State<ScratchCardWidget> {
  final List<Offset> _points = [];
  double _revealedPercent = 0.0;
  bool _revealed = false;
  bool _revealing = false;

  static const double _scratchRadius = 28.0;
  static const _cardWidth = 280.0;
  static const _cardHeight = 180.0;
  // Grid resolution for coverage calculation
  static const _gridDivisions = 40;

  final Set<String> _scannedCells = {};

  void _onPanUpdate(DragUpdateDetails d) {
    if (_revealed) return;
    final RenderBox rb = context.findRenderObject() as RenderBox;
    final local = rb.globalToLocal(d.globalPosition);
    setState(() {
      _points.add(local);
    });
    _checkCoverage(local);
  }

  void _checkCoverage(Offset pos) {
    // Mark grid cells as scratched
    final col = (pos.dx / _cardWidth * _gridDivisions).floor().clamp(0, _gridDivisions - 1);
    final row = (pos.dy / _cardHeight * _gridDivisions).floor().clamp(0, _gridDivisions - 1);
    _scannedCells.add('$col,$row');

    final percent = _scannedCells.length / (_gridDivisions * _gridDivisions);
    setState(() => _revealedPercent = percent);

    if (percent >= widget.revealThreshold && !_revealed && !_revealing) {
      _revealing = true;
      Future.delayed(const Duration(milliseconds: 200), () {
        setState(() => _revealed = true);
        widget.onReveal?.call();
      });
    }
  }

  void reset() {
    setState(() {
      _points.clear();
      _scannedCells.clear();
      _revealedPercent = 0;
      _revealed = false;
      _revealing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _cardWidth,
      height: _cardHeight,
      child: Stack(
        children: [
          // ── Reward content (underneath) ──────────────────────────────────
          _buildRewardContent(),

          // ── Scratch overlay ───────────────────────────────────────────────
          if (!_revealed)
            GestureDetector(
              onPanUpdate: _onPanUpdate,
              child: CustomPaint(
                size: const Size(_cardWidth, _cardHeight),
                painter: _ScratchPainter(
                  points: List.unmodifiable(_points),
                  radius: _scratchRadius,
                ),
              ),
            ),

          // ── Scratch hint ──────────────────────────────────────────────────
          if (!_revealed && _revealedPercent < 0.05)
            const Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Center(
                child: Text(
                  '✋ Scratch to reveal!',
                  style: TextStyle(
                    color: Colors.white70,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ),

          // ── Progress bar ──────────────────────────────────────────────────
          if (!_revealed && _revealedPercent > 0)
            Positioned(
              top: 8,
              left: 16,
              right: 16,
              child: LinearProgressIndicator(
                value: _revealedPercent,
                backgroundColor: Colors.white24,
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildRewardContent() {
    return Container(
      width: _cardWidth,
      height: _cardHeight,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF667eea), Color(0xFF764ba2)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.purple.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (widget.result == null)
            const CircularProgressIndicator(color: Colors.white)
          else ...[
            Text(
              widget.result!.icon,
              style: const TextStyle(fontSize: 48),
            ),
            const SizedBox(height: 8),
            Text(
              widget.result!.rewardLabel,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (widget.result!.rewardValue > 0)
              Text(
                '₹${widget.result!.rewardValue.toStringAsFixed(0)}',
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              ),
          ],
        ],
      ),
    );
  }
}

class _ScratchPainter extends CustomPainter {
  final List<Offset> points;
  final double radius;

  _ScratchPainter({required this.points, required this.radius});

  @override
  void paint(Canvas canvas, Size size) {
    // Draw scratch-off silver layer
    final bgPaint = Paint()
      ..color = const Color(0xFF9E9E9E)
      ..style = PaintingStyle.fill;
    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      const Radius.circular(16),
    );
    canvas.drawRRect(rrect, bgPaint);

    // Add sheen effect
    final sheenPaint = Paint()
      ..shader = LinearGradient(
        colors: [Colors.white.withValues(alpha: 0.3), Colors.transparent, Colors.white.withValues(alpha: 0.15)],
        stops: const [0.0, 0.5, 1.0],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas.drawRRect(rrect, sheenPaint);

    // Add pattern
    final patternPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.1)
      ..style = PaintingStyle.fill;
    for (double x = 10; x < size.width; x += 20) {
      for (double y = 10; y < size.height; y += 20) {
        canvas.drawCircle(Offset(x, y), 2, patternPaint);
      }
    }

    // Erase scratched areas using BlendMode.clear
    final erasePaint = Paint()
      ..blendMode = BlendMode.clear
      ..style = PaintingStyle.fill;

    canvas.saveLayer(Rect.fromLTWH(0, 0, size.width, size.height), Paint());

    // Redraw bg in the layer
    canvas.drawRRect(rrect, bgPaint);

    for (final point in points) {
      canvas.drawCircle(point, radius, erasePaint);
    }

    // Draw connecting lines between consecutive points for smoother scratch
    if (points.length > 1) {
      final linePaint = Paint()
        ..blendMode = BlendMode.clear
        ..style = PaintingStyle.stroke
        ..strokeWidth = radius * 2
        ..strokeCap = StrokeCap.round;

      final path = Path();
      path.moveTo(points.first.dx, points.first.dy);
      for (int i = 1; i < points.length; i++) {
        path.lineTo(points[i].dx, points[i].dy);
      }
      canvas.drawPath(path, linePaint);
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(_ScratchPainter old) => old.points != points;
}
