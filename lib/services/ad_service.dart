import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:mind_arena/config/constants.dart';

enum AdType { banner, interstitial, rewarded }

class AdService {
  // Singleton pattern
  static final AdService _instance = AdService._internal();
  factory AdService() => _instance;
  AdService._internal();

  // Properties
  BannerAd? _bannerAd;
  InterstitialAd? _interstitialAd;
  RewardedAd? _rewardedAd;
  
  bool _isInterstitialReady = false;
  bool _isRewardedReady = false;
  
  DateTime? _lastInterstitialShown;
  final int _minInterstitialInterval = 180; // 3 minutes in seconds

  // Getters
  bool get isBannerReady => _bannerAd != null;
  bool get isInterstitialReady => _isInterstitialReady;
  bool get isRewardedReady => _isRewardedReady;
  BannerAd? get bannerAd => _bannerAd;

  // Initialize ads
  Future<void> initialize() async {
    // Initialize MobileAds SDK
    await MobileAds.instance.initialize();
    
    // Load initial ads
    _loadBannerAd();
    _loadInterstitialAd();
    _loadRewardedAd();
  }

  // Banner ad methods
  void _loadBannerAd() {
    _bannerAd = BannerAd(
      adUnitId: AppConstants.bannerAdUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (_) {
          debugPrint('Banner ad loaded');
        },
        onAdFailedToLoad: (ad, error) {
          debugPrint('Banner ad failed to load: ${error.message}');
          ad.dispose();
          _bannerAd = null;
          
          // Retry after a delay
          Future.delayed(const Duration(minutes: 1), _loadBannerAd);
        },
        onAdOpened: (ad) {
          debugPrint('Banner ad opened');
        },
        onAdClosed: (ad) {
          debugPrint('Banner ad closed');
        },
      ),
    );

    _bannerAd!.load();
  }

  void disposeBannerAd() {
    _bannerAd?.dispose();
    _bannerAd = null;
  }

  // Interstitial ad methods
  void _loadInterstitialAd() {
    InterstitialAd.load(
      adUnitId: AppConstants.interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
          _isInterstitialReady = true;
          debugPrint('Interstitial ad loaded');
          
          // Set up ad callbacks
          _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
            onAdDismissedFullScreenContent: (ad) {
              debugPrint('Interstitial ad dismissed');
              ad.dispose();
              _isInterstitialReady = false;
              _loadInterstitialAd(); // Preload next ad
            },
            onAdFailedToShowFullScreenContent: (ad, error) {
              debugPrint('Interstitial ad failed to show: ${error.message}');
              ad.dispose();
              _isInterstitialReady = false;
              _loadInterstitialAd(); // Retry
            },
            onAdShowedFullScreenContent: (_) {
              debugPrint('Interstitial ad showed');
              _lastInterstitialShown = DateTime.now();
            },
          );
        },
        onAdFailedToLoad: (error) {
          debugPrint('Interstitial ad failed to load: ${error.message}');
          _isInterstitialReady = false;
          
          // Retry after a delay
          Future.delayed(const Duration(minutes: 1), _loadInterstitialAd);
        },
      ),
    );
  }

  // Show interstitial with frequency cap
  Future<bool> showInterstitial() async {
    if (!_isInterstitialReady || _interstitialAd == null) {
      debugPrint('Interstitial ad not ready');
      return false;
    }

    // Check frequency cap
    if (_lastInterstitialShown != null) {
      final secondsSinceLastAd = DateTime.now().difference(_lastInterstitialShown!).inSeconds;
      if (secondsSinceLastAd < _minInterstitialInterval) {
        debugPrint('Skipping interstitial - shown too recently');
        return false;
      }
    }

    // Show the ad
    _isInterstitialReady = false; // Prevent multiple shows
    try {
      await _interstitialAd!.show();
      return true;
    } catch (e) {
      debugPrint('Error showing interstitial: $e');
      _loadInterstitialAd(); // Reload on error
      return false;
    }
  }

  // Rewarded ad methods
  void _loadRewardedAd() {
    RewardedAd.load(
      adUnitId: AppConstants.rewardedAdUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewardedAd = ad;
          _isRewardedReady = true;
          debugPrint('Rewarded ad loaded');
          
          // Set up ad callbacks
          _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
            onAdDismissedFullScreenContent: (ad) {
              debugPrint('Rewarded ad dismissed');
              ad.dispose();
              _isRewardedReady = false;
              _loadRewardedAd(); // Preload next ad
            },
            onAdFailedToShowFullScreenContent: (ad, error) {
              debugPrint('Rewarded ad failed to show: ${error.message}');
              ad.dispose();
              _isRewardedReady = false;
              _loadRewardedAd(); // Retry
            },
            onAdShowedFullScreenContent: (_) {
              debugPrint('Rewarded ad showed');
            },
          );
        },
        onAdFailedToLoad: (error) {
          debugPrint('Rewarded ad failed to load: ${error.message}');
          _isRewardedReady = false;
          
          // Retry after a delay
          Future.delayed(const Duration(minutes: 1), _loadRewardedAd);
        },
      ),
    );
  }

  // Show rewarded ad with callback for reward
  Future<bool> showRewardedAd(Function(RewardItem) onRewarded) async {
    if (!_isRewardedReady || _rewardedAd == null) {
      debugPrint('Rewarded ad not ready');
      return false;
    }

    final Completer<bool> rewardCompleter = Completer<bool>();
    
    // Set up reward callback
    _rewardedAd!.setImmersiveMode(true);
    _isRewardedReady = false; // Prevent multiple shows
    
    await _rewardedAd!.show(
      onUserEarnedReward: (_, reward) {
        debugPrint('User earned reward: ${reward.amount} ${reward.type}');
        onRewarded(reward);
        rewardCompleter.complete(true);
      }
    );
    
    // Handle case where ad is closed without reward
    _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        if (!rewardCompleter.isCompleted) {
          rewardCompleter.complete(false);
        }
        ad.dispose();
        _loadRewardedAd();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        if (!rewardCompleter.isCompleted) {
          rewardCompleter.complete(false);
        }
        ad.dispose();
        _loadRewardedAd();
      },
    );
    
    return rewardCompleter.future;
  }

  // Dispose of all ads
  void disposeAds() {
    _bannerAd?.dispose();
    _interstitialAd?.dispose();
    _rewardedAd?.dispose();
    
    _bannerAd = null;
    _interstitialAd = null;
    _rewardedAd = null;
    
    _isInterstitialReady = false;
    _isRewardedReady = false;
  }
}
