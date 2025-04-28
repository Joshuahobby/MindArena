import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String id;
  final String username;
  final String email;
  final String avatarUrl;
  final int coins;
  final int totalMatches;
  final int matchesWon;
  final int totalPoints;
  final int consecutiveLoginDays;
  final DateTime lastLoginDate;
  final List<String> achievements;
  final List<String> friends;
  final DateTime createdAt;
  final DateTime updatedAt;

  UserModel({
    required this.id,
    required this.username,
    required this.email,
    required this.avatarUrl,
    this.coins = 0,
    this.totalMatches = 0,
    this.matchesWon = 0,
    this.totalPoints = 0,
    this.consecutiveLoginDays = 0,
    required this.lastLoginDate,
    this.achievements = const [],
    this.friends = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  // Create a UserModel from a Firebase document
  factory UserModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    
    return UserModel(
      id: doc.id,
      username: data['username'] ?? '',
      email: data['email'] ?? '',
      avatarUrl: data['avatarUrl'] ?? '',
      coins: data['coins'] ?? 0,
      totalMatches: data['totalMatches'] ?? 0,
      matchesWon: data['matchesWon'] ?? 0,
      totalPoints: data['totalPoints'] ?? 0,
      consecutiveLoginDays: data['consecutiveLoginDays'] ?? 0,
      lastLoginDate: (data['lastLoginDate'] as Timestamp).toDate(),
      achievements: List<String>.from(data['achievements'] ?? []),
      friends: List<String>.from(data['friends'] ?? []),
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      updatedAt: (data['updatedAt'] as Timestamp).toDate(),
    );
  }

  // Convert UserModel to a Map for Firestore
  Map<String, dynamic> toFirestore() {
    return {
      'username': username,
      'email': email,
      'avatarUrl': avatarUrl,
      'coins': coins,
      'totalMatches': totalMatches,
      'matchesWon': matchesWon,
      'totalPoints': totalPoints,
      'consecutiveLoginDays': consecutiveLoginDays,
      'lastLoginDate': Timestamp.fromDate(lastLoginDate),
      'achievements': achievements,
      'friends': friends,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  // Create a copy of the UserModel with updated fields
  UserModel copyWith({
    String? id,
    String? username,
    String? email,
    String? avatarUrl,
    int? coins,
    int? totalMatches,
    int? matchesWon,
    int? totalPoints,
    int? consecutiveLoginDays,
    DateTime? lastLoginDate,
    List<String>? achievements,
    List<String>? friends,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      coins: coins ?? this.coins,
      totalMatches: totalMatches ?? this.totalMatches,
      matchesWon: matchesWon ?? this.matchesWon,
      totalPoints: totalPoints ?? this.totalPoints,
      consecutiveLoginDays: consecutiveLoginDays ?? this.consecutiveLoginDays,
      lastLoginDate: lastLoginDate ?? this.lastLoginDate,
      achievements: achievements ?? this.achievements,
      friends: friends ?? this.friends,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Calculate win percentage
  double get winPercentage {
    if (totalMatches == 0) return 0.0;
    return (matchesWon / totalMatches) * 100;
  }

  // Get user's performance level based on points
  String get performanceLevel {
    if (totalPoints < 1000) return 'Novice';
    if (totalPoints < 5000) return 'Apprentice';
    if (totalPoints < 10000) return 'Skilled';
    if (totalPoints < 20000) return 'Expert';
    if (totalPoints < 50000) return 'Master';
    return 'Legend';
  }
}
