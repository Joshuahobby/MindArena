import 'package:cloud_firestore/cloud_firestore.dart';

class LeaderboardEntry {
  final String userId;
  final String username;
  final String avatarUrl;
  final int score;
  final int rank;
  final int matchesPlayed;
  final int matchesWon;
  final DateTime lastUpdated;

  LeaderboardEntry({
    required this.userId,
    required this.username,
    required this.avatarUrl,
    required this.score,
    required this.rank,
    required this.matchesPlayed,
    required this.matchesWon,
    required this.lastUpdated,
  });

  factory LeaderboardEntry.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    
    return LeaderboardEntry(
      userId: doc.id,
      username: data['username'] ?? '',
      avatarUrl: data['avatarUrl'] ?? '',
      score: data['score'] ?? 0,
      rank: data['rank'] ?? 0,
      matchesPlayed: data['matchesPlayed'] ?? 0,
      matchesWon: data['matchesWon'] ?? 0,
      lastUpdated: (data['lastUpdated'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'username': username,
      'avatarUrl': avatarUrl,
      'score': score,
      'rank': rank,
      'matchesPlayed': matchesPlayed,
      'matchesWon': matchesWon,
      'lastUpdated': Timestamp.fromDate(lastUpdated),
    };
  }

  // Helper to calculate win percentage
  double get winPercentage {
    if (matchesPlayed == 0) return 0.0;
    return (matchesWon / matchesPlayed) * 100;
  }
}

class LeaderboardModel {
  final String id; // global, weekly, monthly, etc.
  final List<LeaderboardEntry> entries;
  final DateTime lastUpdated;
  final DateTime validUntil;
  final Map<String, dynamic>? metadata;

  LeaderboardModel({
    required this.id,
    required this.entries,
    required this.lastUpdated,
    required this.validUntil,
    this.metadata,
  });

  factory LeaderboardModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    
    List<LeaderboardEntry> entries = [];
    if (data['entries'] != null) {
      for (var entry in data['entries']) {
        entries.add(LeaderboardEntry(
          userId: entry['userId'] ?? '',
          username: entry['username'] ?? '',
          avatarUrl: entry['avatarUrl'] ?? '',
          score: entry['score'] ?? 0,
          rank: entry['rank'] ?? 0,
          matchesPlayed: entry['matchesPlayed'] ?? 0,
          matchesWon: entry['matchesWon'] ?? 0,
          lastUpdated: (entry['lastUpdated'] as Timestamp).toDate(),
        ));
      }
    }
    
    return LeaderboardModel(
      id: doc.id,
      entries: entries,
      lastUpdated: (data['lastUpdated'] as Timestamp).toDate(),
      validUntil: (data['validUntil'] as Timestamp).toDate(),
      metadata: data['metadata'],
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'entries': entries.map((entry) => {
        'userId': entry.userId,
        'username': entry.username,
        'avatarUrl': entry.avatarUrl,
        'score': entry.score,
        'rank': entry.rank,
        'matchesPlayed': entry.matchesPlayed,
        'matchesWon': entry.matchesWon,
        'lastUpdated': Timestamp.fromDate(entry.lastUpdated),
      }).toList(),
      'lastUpdated': Timestamp.fromDate(lastUpdated),
      'validUntil': Timestamp.fromDate(validUntil),
      'metadata': metadata,
    };
  }

  // Get a player's entry by userId
  LeaderboardEntry? getPlayerEntry(String userId) {
    for (var entry in entries) {
      if (entry.userId == userId) {
        return entry;
      }
    }
    return null;
  }

  // Check if leaderboard is still valid
  bool get isValid {
    return DateTime.now().isBefore(validUntil);
  }
}
