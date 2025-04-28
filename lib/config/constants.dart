import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  // App info
  static const String appName = "MindArena";
  static const String appTagline = "Where Fast Minds Become Champions";
  static const String appVersion = "1.0.0";
  
  // Firebase Collections
  static const String usersCollection = "users";
  static const String questionsCollection = "questions";
  static const String matchesCollection = "matches";
  static const String leaderboardCollection = "leaderboard";
  static const String dailyRewardsCollection = "dailyRewards";
  static const String missionsCollection = "missions";
  
  // Game Settings
  static const int maxPlayersPerMatch = 5;
  static const int minPlayersPerMatch = 2;
  static const int questionsPerMatch = 5;
  static const int questionTimeLimit = 10; // seconds
  static const int matchmakingTimeout = 30; // seconds
  static const int coinsPerWin = 10;
  static const int pointsPerCorrectAnswer = 100;
  static const int bonusPointsForSpeed = 50; // maximum bonus for fastest answer
  static const int reviveCost = 5; // coins
  
  // Ad Settings
  static String get bannerAdUnitId => dotenv.get('BANNER_AD_UNIT_ID', fallback: 'ca-app-pub-3940256099942544/6300978111'); // Test ID fallback
  static String get interstitialAdUnitId => dotenv.get('INTERSTITIAL_AD_UNIT_ID', fallback: 'ca-app-pub-3940256099942544/1033173712'); // Test ID fallback
  static String get rewardedAdUnitId => dotenv.get('REWARDED_AD_UNIT_ID', fallback: 'ca-app-pub-3940256099942544/5224354917'); // Test ID fallback
  
  // Quiz Categories
  static const List<Map<String, dynamic>> quizCategories = [
    {"id": "movies", "name": "Movies", "icon": Icons.movie},
    {"id": "science", "name": "Science", "icon": Icons.science},
    {"id": "sports", "name": "Sports", "icon": Icons.sports_soccer},
    {"id": "history", "name": "History", "icon": Icons.history_edu},
    {"id": "geography", "name": "Geography", "icon": Icons.public},
    {"id": "music", "name": "Music", "icon": Icons.music_note},
    {"id": "technology", "name": "Technology", "icon": Icons.computer},
    {"id": "art", "name": "Art", "icon": Icons.palette},
    {"id": "food", "name": "Food", "icon": Icons.fastfood},
    {"id": "literature", "name": "Literature", "icon": Icons.book},
  ];
  
  // Daily Rewards
  static const List<int> dailyRewards = [10, 20, 30, 40, 50, 60, 100]; // Coins for day 1-7
  
  // Referral Rewards
  static const int referralBonus = 50; // Coins
  
  // Local Storage Keys
  static const String authTokenKey = "auth_token";
  static const String userDataKey = "user_data";
  static const String lastLoginDateKey = "last_login_date";
  static const String consecutiveLoginDaysKey = "consecutive_login_days";
  static const String dailyRewardClaimedKey = "daily_reward_claimed";
  static const String soundEnabledKey = "sound_enabled";
  static const String vibrationEnabledKey = "vibration_enabled";
  
  // Default avatar URLs
  static const List<String> defaultAvatars = [
    "https://firebasestorage.googleapis.com/v0/b/mindarena-app.appspot.com/o/avatars%2Favatar1.png?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/mindarena-app.appspot.com/o/avatars%2Favatar2.png?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/mindarena-app.appspot.com/o/avatars%2Favatar3.png?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/mindarena-app.appspot.com/o/avatars%2Favatar4.png?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/mindarena-app.appspot.com/o/avatars%2Favatar5.png?alt=media",
  ];
}
