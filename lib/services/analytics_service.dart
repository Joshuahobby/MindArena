import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';

class AnalyticsService {
  final FirebaseAnalytics _analytics;

  AnalyticsService(this._analytics);

  // Get analytics observer for Navigator
  FirebaseAnalyticsObserver getAnalyticsObserver() {
    return FirebaseAnalyticsObserver(analytics: _analytics);
  }

  // Log app open event
  Future<void> logAppOpen() async {
    await _analytics.logAppOpen();
  }

  // Log a custom event with parameters
  Future<void> logEvent({
    required String name,
    Map<String, dynamic>? parameters,
  }) async {
    await _analytics.logEvent(
      name: name,
      parameters: parameters,
    );
  }

  // Log screen view
  Future<void> logScreenView({
    required String screenName,
    String? screenClass,
  }) async {
    await _analytics.logScreenView(
      screenName: screenName,
      screenClass: screenClass,
    );
  }

  // Log user sign-in
  Future<void> logLogin({required String loginMethod}) async {
    await _analytics.logLogin(loginMethod: loginMethod);
  }

  // Log user sign-up
  Future<void> logSignUp({required String signUpMethod}) async {
    await _analytics.logSignUp(signUpMethod: signUpMethod);
  }

  // Set user ID
  Future<void> setUserId(String userId) async {
    await _analytics.setUserId(id: userId);
  }

  // Set user properties
  Future<void> setUserProperty({
    required String name,
    required String value,
  }) async {
    await _analytics.setUserProperty(name: name, value: value);
  }

  // Game-specific analytics
  Future<void> logMatchStart({
    required String matchId,
    required int playerCount,
  }) async {
    await _analytics.logEvent(
      name: 'match_start',
      parameters: {
        'match_id': matchId,
        'player_count': playerCount,
      },
    );
  }

  Future<void> logMatchEnd({
    required String matchId,
    required int playerCount,
    required int duration,
    required bool isWinner,
    required int score,
    required int rank,
  }) async {
    await _analytics.logEvent(
      name: 'match_end',
      parameters: {
        'match_id': matchId,
        'player_count': playerCount,
        'duration_seconds': duration,
        'is_winner': isWinner,
        'score': score,
        'rank': rank,
      },
    );
  }

  Future<void> logQuestionAnswered({
    required String matchId,
    required int questionIndex,
    required bool isCorrect,
    required int timeSpent,
    required int score,
  }) async {
    await _analytics.logEvent(
      name: 'question_answered',
      parameters: {
        'match_id': matchId,
        'question_index': questionIndex,
        'is_correct': isCorrect,
        'time_spent_seconds': timeSpent,
        'score': score,
      },
    );
  }

  Future<void> logReviveUsed({
    required String matchId,
    required String reviveMethod,
  }) async {
    await _analytics.logEvent(
      name: 'revive_used',
      parameters: {
        'match_id': matchId,
        'revive_method': reviveMethod, // 'ad' or 'coins'
      },
    );
  }

  // Ad analytics
  Future<void> logAdImpression({
    required String adType,
    String? placement,
  }) async {
    await _analytics.logEvent(
      name: 'ad_impression',
      parameters: {
        'ad_type': adType, // 'banner', 'interstitial', 'rewarded'
        'placement': placement ?? 'default',
      },
    );
  }

  Future<void> logAdClicked({
    required String adType,
    String? placement,
  }) async {
    await _analytics.logEvent(
      name: 'ad_clicked',
      parameters: {
        'ad_type': adType,
        'placement': placement ?? 'default',
      },
    );
  }

  Future<void> logRewardedAdCompleted({
    required String placement,
    required String rewardType,
    required int rewardAmount,
  }) async {
    await _analytics.logEvent(
      name: 'rewarded_ad_completed',
      parameters: {
        'placement': placement,
        'reward_type': rewardType,
        'reward_amount': rewardAmount,
      },
    );
  }

  // In-app events
  Future<void> logCoinTransaction({
    required String transactionType,
    required int amount,
    required String reason,
  }) async {
    await _analytics.logEvent(
      name: 'coin_transaction',
      parameters: {
        'transaction_type': transactionType, // 'earn' or 'spend'
        'amount': amount,
        'reason': reason, // 'win', 'daily_bonus', 'purchase', etc.
      },
    );
  }
  
  Future<void> logDailyRewardClaimed({
    required int day,
    required int amount,
  }) async {
    await _analytics.logEvent(
      name: 'daily_reward_claimed',
      parameters: {
        'day': day,
        'amount': amount,
      },
    );
  }

  Future<void> logFriendAction({
    required String actionType,
    String? friendId,
  }) async {
    await _analytics.logEvent(
      name: 'friend_action',
      parameters: {
        'action_type': actionType, // 'invite', 'accept', 'reject', etc.
        'friend_id': friendId,
      },
    );
  }
  
  Future<void> logShareAction({
    required String contentType,
    required String shareMethod,
  }) async {
    await _analytics.logShare(
      contentType: contentType,
      itemId: null,
      method: shareMethod,
    );
  }
}
