import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:mind_arena/config/constants.dart';
import 'package:mind_arena/services/ad_service.dart';
import 'package:mind_arena/services/analytics_service.dart';
import 'package:provider/provider.dart';

class AdBannerWidget extends StatefulWidget {
  final String adPosition;

  const AdBannerWidget({
    Key? key,
    required this.adPosition,
  }) : super(key: key);

  @override
  State<AdBannerWidget> createState() => _AdBannerWidgetState();
}

class _AdBannerWidgetState extends State<AdBannerWidget> {
  BannerAd? _bannerAd;
  bool _isLoaded = false;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadBannerAd();
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  void _loadBannerAd() {
    final adService = Provider.of<AdService>(context, listen: false);
    
    if (adService.isBannerReady) {
      setState(() {
        _bannerAd = adService.bannerAd;
        _isLoaded = true;
        _isLoading = false;
      });
    } else {
      _createBannerAd();
    }
  }

  void _createBannerAd() {
    final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
    
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    _bannerAd = BannerAd(
      adUnitId: AppConstants.bannerAdUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (_) {
          if (mounted) {
            setState(() {
              _isLoaded = true;
              _isLoading = false;
            });
            
            // Log impression
            analyticsService.logAdImpression(
              adType: 'banner',
              placement: widget.adPosition,
            );
          }
        },
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          if (mounted) {
            setState(() {
              _isLoaded = false;
              _isLoading = false;
              _errorMessage = 'Failed to load ad: ${error.message}';
            });
          }
        },
        onAdOpened: (_) {
          // Log ad click
          analyticsService.logAdClicked(
            adType: 'banner',
            placement: widget.adPosition,
          );
        },
      ),
    );
    
    _bannerAd!.load();
  }

  @override
  Widget build(BuildContext context) {
    // While loading, show a placeholder
    if (_isLoading) {
      return Container(
        height: 50,
        color: Colors.grey[300],
        child: const Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
            ),
          ),
        ),
      );
    }

    // If there's an error or no ad loaded, show a small placeholder
    if (!_isLoaded || _bannerAd == null) {
      return SizedBox(height: 0);
    }

    // Show the ad
    return Container(
      alignment: Alignment.center,
      width: _bannerAd!.size.width.toDouble(),
      height: _bannerAd!.size.height.toDouble(),
      child: AdWidget(ad: _bannerAd!),
    );
  }
}
