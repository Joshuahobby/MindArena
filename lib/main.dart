import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mind_arena/app.dart';
import 'package:provider/provider.dart';

// Mock services for demonstration
class MockAnalyticsService {
  void logScreenView({required String screenName}) {
    debugPrint('Screen view: $screenName');
  }
  
  void logShareAction({required String contentType, required String shareMethod}) {
    debugPrint('Share action: $contentType via $shareMethod');
  }
  
  void logAdImpression({required String adType, required String placement}) {
    debugPrint('Ad impression: $adType at $placement');
  }
  
  void logAdClicked({required String adType, required String placement}) {
    debugPrint('Ad clicked: $adType at $placement');
  }
  
  void logCoinTransaction({required String transactionType, required int amount, required String reason}) {
    debugPrint('Coin transaction: $transactionType, $amount coins, reason: $reason');
  }
  
  void logRewardedAdCompleted({required String placement, required String rewardType, required int rewardAmount}) {
    debugPrint('Rewarded ad completed: $placement, reward: $rewardAmount $rewardType');
  }
}

class MockAuthService {
  dynamic currentUser;
  
  Future<dynamic> getUserData(String userId) async {
    return null;
  }
  
  Future<void> signOut() async {
    debugPrint('User signed out');
  }
}

class MockDatabaseService {
  Future<dynamic> getUserData(String userId) async {
    return null;
  }
  
  Future<List<dynamic>> getLeaderboard({String type = 'global', int limit = 100}) async {
    return [];
  }
}

class MockAdService {
  bool get isRewardedReady => false;
  bool get isInterstitialReady => false;
  bool get isBannerReady => false;
  Future<bool> showRewardedAd(Function(dynamic) onRewarded) async {
    return false;
  }
  Future<bool> showInterstitial() async {
    return false;
  }
}

void main() async {
  // Ensure Flutter is initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(
    MultiProvider(
      providers: [
        Provider<MockAnalyticsService>(
          create: (_) => MockAnalyticsService(),
        ),
        Provider<MockAuthService>(
          create: (_) => MockAuthService(),
        ),
        Provider<MockDatabaseService>(
          create: (_) => MockDatabaseService(),
        ),
        Provider<MockAdService>(
          create: (_) => MockAdService(),
        ),
      ],
      child: const MindArenaApp(),
    ),
  );
}
