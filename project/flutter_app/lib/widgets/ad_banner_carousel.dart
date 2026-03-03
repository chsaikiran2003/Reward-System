import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:async';
import '../../models/models.dart';

class AdBannerCarousel extends StatefulWidget {
  final List<AdCampaign> campaigns;
  final String userId;
  final Map<String, dynamic>? location;
  final Function(String adId) onView;
  final Function(String adId) onClick;

  const AdBannerCarousel({
    super.key,
    required this.campaigns,
    required this.userId,
    required this.location,
    required this.onView,
    required this.onClick,
  });

  @override
  State<AdBannerCarousel> createState() => _AdBannerCarouselState();
}

class _AdBannerCarouselState extends State<AdBannerCarousel> {
  late PageController _pageController;
  int _currentPage = 0;
  Timer? _autoScrollTimer;

  // Flatten all images across all campaigns for the carousel
  List<_SlideItem> get _slides {
    final items = <_SlideItem>[];
    for (final c in widget.campaigns) {
      for (final img in c.images) {
        items.add(_SlideItem(campaign: c, image: img));
      }
    }
    return items;
  }

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startAutoScroll();
    WidgetsBinding.instance.addPostFrameCallback((_) => _onPageVisible(0));
  }

  @override
  void didUpdateWidget(AdBannerCarousel old) {
    super.didUpdateWidget(old);
    if (old.campaigns != widget.campaigns) {
      _currentPage = 0;
      _pageController.jumpToPage(0);
    }
  }

  void _startAutoScroll() {
    _autoScrollTimer?.cancel();
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || _slides.isEmpty) return;
      final next = (_currentPage + 1) % _slides.length;
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    });
  }

  void _onPageVisible(int index) {
    if (_slides.isEmpty || index >= _slides.length) return;
    final slide = _slides[index];
    widget.onView(slide.campaign.id);
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_slides.isEmpty) {
      return Container(
        height: 200,
        color: Colors.grey.shade200,
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.image_not_supported_outlined, size: 40, color: Colors.grey),
              SizedBox(height: 8),
              Text('No ads available', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        SizedBox(
          height: 200,
          child: PageView.builder(
            controller: _pageController,
            itemCount: _slides.length,
            onPageChanged: (i) {
              setState(() => _currentPage = i);
              _onPageVisible(i);
            },
            itemBuilder: (ctx, i) {
              final slide = _slides[i];
              return GestureDetector(
                onTap: () => widget.onClick(slide.campaign.id),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: CachedNetworkImage(
                      imageUrl: slide.image.url,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      placeholder: (ctx, url) => Container(
                        color: Colors.grey.shade200,
                        child: const Center(child: CircularProgressIndicator()),
                      ),
                      errorWidget: (ctx, url, err) => Container(
                        color: Colors.grey.shade300,
                        child: const Center(
                          child: Icon(Icons.broken_image, size: 48, color: Colors.grey),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 10),
        // Dot indicators
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(_slides.length, (i) {
            return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: i == _currentPage ? 20 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: i == _currentPage
                    ? Theme.of(context).primaryColor
                    : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(4),
              ),
            );
          }),
        ),
      ],
    );
  }
}

class _SlideItem {
  final AdCampaign campaign;
  final AdImage image;
  _SlideItem({required this.campaign, required this.image});
}
