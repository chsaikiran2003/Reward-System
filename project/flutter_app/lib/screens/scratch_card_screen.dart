import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../widgets/scratch_card.dart';
import '../models/models.dart';

class ScratchCardScreen extends StatefulWidget {
  const ScratchCardScreen({super.key});

  @override
  State<ScratchCardScreen> createState() => _ScratchCardScreenState();
}

class _ScratchCardScreenState extends State<ScratchCardScreen>
    with SingleTickerProviderStateMixin {
  GameResult? _result;
  bool _loading = false;
  bool _revealed = false;
  String? _error;
  late AnimationController _celebrationController;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _celebrationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleAnim = CurvedAnimation(
      parent: _celebrationController,
      curve: Curves.elasticOut,
    );
    _fetchResult();
  }

  @override
  void dispose() {
    _celebrationController.dispose();
    super.dispose();
  }

  Future<void> _fetchResult() async {
    setState(() { _loading = true; _error = null; });
    try {
      final provider = context.read<AppProvider>();
      final result = await provider.playGame('scratch_card');
      setState(() { _result = result; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  void _onReveal() {
    setState(() => _revealed = true);
    _celebrationController.forward();
  }

  void _reset() {
    _celebrationController.reset();
    setState(() {
      _result = null;
      _revealed = false;
      _error = null;
    });
    _fetchResult();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1a1a2e),
      appBar: AppBar(
        title: const Text('🃏 Scratch Card'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Scratch to Reveal Your Reward!',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Consumer<AppProvider>(
                builder: (ctx, prov, _) => Text(
                  'Daily Plays: ${prov.gameSettings("scratch_card")?.maxPlaysPerDay ?? 3}',
                  style: const TextStyle(color: Colors.white60, fontSize: 14),
                ),
              ),
              const SizedBox(height: 40),

              if (_loading)
                const CircularProgressIndicator(color: Color(0xFFa78bfa))
              else if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 40),
                      const SizedBox(height: 8),
                      Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 14), textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _fetchResult,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                        child: const Text('Try Again'),
                      ),
                    ],
                  ),
                )
              ] else ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: ScratchCardWidget(
                    result: _result,
                    revealThreshold: 0.60,
                    onReveal: _onReveal,
                  ),
                ),

                const SizedBox(height: 32),

                if (_revealed && _result != null) ...[
                  ScaleTransition(
                    scale: _scaleAnim,
                    child: Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFa78bfa), width: 2),
                      ),
                      child: Column(
                        children: [
                          const Text('🎉', style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 8),
                          Text(
                            _result!.rewardValue > 0
                                ? 'Congratulations! You Won!'
                                : 'Better Luck Next Time!',
                            style: TextStyle(
                              color: _result!.rewardValue > 0 ? const Color(0xFFa78bfa) : Colors.white60,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${_result!.icon} ${_result!.rewardLabel}',
                            style: const TextStyle(color: Colors.white, fontSize: 24),
                          ),
                          if (_result!.rewardValue > 0) ...[
                            const SizedBox(height: 4),
                            Text(
                              '₹${_result!.rewardValue.toStringAsFixed(0)} Cashback',
                              style: const TextStyle(color: Colors.green, fontSize: 16),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: _reset,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Play Again'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF7c3aed),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}
