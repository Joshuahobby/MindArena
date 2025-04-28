import 'package:cloud_firestore/cloud_firestore.dart';

class Tournament {
  final String? id;
  final String name;
  final DateTime startDate;
  final DateTime endDate;
  final int entryFee;
  final int maxPlayers;
  final int currentPlayers;
  final String status; // 'upcoming', 'active', 'completed'
  final DateTime? createdAt;
  final List<TournamentPrize>? prizes;
  
  Tournament({
    this.id,
    required this.name,
    required this.startDate,
    required this.endDate,
    required this.entryFee,
    required this.maxPlayers,
    this.currentPlayers = 0,
    this.status = 'upcoming',
    this.createdAt,
    this.prizes,
  });
  
  factory Tournament.fromMap(Map<String, dynamic> map) {
    List<TournamentPrize> prizesList = [];
    
    if (map['prizes'] != null) {
      prizesList = (map['prizes'] as List).map((item) {
        return TournamentPrize.fromMap(item);
      }).toList();
    }
    
    return Tournament(
      id: map['id'],
      name: map['name'],
      startDate: map['start_date'] is Timestamp
        ? (map['start_date'] as Timestamp).toDate()
        : DateTime.parse(map['start_date']),
      endDate: map['end_date'] is Timestamp
        ? (map['end_date'] as Timestamp).toDate()
        : DateTime.parse(map['end_date']),
      entryFee: map['entry_fee'] ?? 0,
      maxPlayers: map['max_players'] ?? 100,
      currentPlayers: map['current_players'] ?? 0,
      status: map['status'] ?? 'upcoming',
      createdAt: map['created_at'] is Timestamp
        ? (map['created_at'] as Timestamp).toDate()
        : map['created_at'] != null
          ? DateTime.parse(map['created_at'])
          : null,
      prizes: prizesList,
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'start_date': startDate,
      'end_date': endDate,
      'entry_fee': entryFee,
      'max_players': maxPlayers,
      'current_players': currentPlayers,
      'status': status,
      'created_at': createdAt,
      'prizes': prizes?.map((prize) => prize.toMap()).toList(),
    };
  }
  
  bool get isActive => status == 'active';
  bool get isUpcoming => status == 'upcoming';
  bool get isCompleted => status == 'completed';
  
  bool get isFull => currentPlayers >= maxPlayers;
  
  int get spotsLeft => maxPlayers - currentPlayers;
  
  bool get shouldStart {
    final now = DateTime.now();
    return status == 'upcoming' && now.isAfter(startDate);
  }
  
  bool get shouldEnd {
    final now = DateTime.now();
    return status == 'active' && now.isAfter(endDate);
  }
  
  String get timeStatus {
    final now = DateTime.now();
    if (isCompleted) {
      return 'Completed';
    } else if (isActive) {
      final Duration remainingTime = endDate.difference(now);
      if (remainingTime.inHours > 24) {
        return 'Ends in ${remainingTime.inDays} days';
      } else if (remainingTime.inHours > 0) {
        return 'Ends in ${remainingTime.inHours} hours';
      } else {
        return 'Ends in ${remainingTime.inMinutes} minutes';
      }
    } else {
      final Duration remainingTime = startDate.difference(now);
      if (remainingTime.inHours > 24) {
        return 'Starts in ${remainingTime.inDays} days';
      } else if (remainingTime.inHours > 0) {
        return 'Starts in ${remainingTime.inHours} hours';
      } else {
        return 'Starts in ${remainingTime.inMinutes} minutes';
      }
    }
  }
  
  int getTotalPrizePool() {
    if (prizes == null || prizes!.isEmpty) {
      return entryFee * maxPlayers * 0.9.round(); // 90% of fees goes to prize pool
    }
    
    return prizes!.fold(0, (sum, prize) {
      if (prize.type == 'coins') {
        return sum + (prize.amount ?? 0);
      }
      return sum;
    });
  }
}

class TournamentPrize {
  final int rank;
  final String type; // 'coins', 'avatar', 'experience', etc.
  final String name;
  final String? imageUrl;
  final int? amount; // For coins or experience
  final String? avatarId; // For avatar prizes
  
  TournamentPrize({
    required this.rank,
    required this.type,
    required this.name,
    this.imageUrl,
    this.amount,
    this.avatarId,
  });
  
  factory TournamentPrize.fromMap(Map<String, dynamic> map) {
    return TournamentPrize(
      rank: map['rank'],
      type: map['type'],
      name: map['name'],
      imageUrl: map['image_url'],
      amount: map['amount'],
      avatarId: map['avatar_id'],
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'rank': rank,
      'type': type,
      'name': name,
      'image_url': imageUrl,
      'amount': amount,
      'avatar_id': avatarId,
    };
  }
}

class TournamentEntry {
  final String? id;
  final String tournamentId;
  final String userId;
  final DateTime? joinedAt;
  final int score;
  final int? rank;
  
  TournamentEntry({
    this.id,
    required this.tournamentId,
    required this.userId,
    this.joinedAt,
    this.score = 0,
    this.rank,
  });
  
  factory TournamentEntry.fromMap(Map<String, dynamic> map) {
    return TournamentEntry(
      id: map['id'],
      tournamentId: map['tournament_id'],
      userId: map['user_id'],
      joinedAt: map['joined_at'] is Timestamp
        ? (map['joined_at'] as Timestamp).toDate()
        : map['joined_at'] != null
          ? DateTime.parse(map['joined_at'])
          : null,
      score: map['score'] ?? 0,
      rank: map['rank'],
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'tournament_id': tournamentId,
      'user_id': userId,
      'joined_at': joinedAt,
      'score': score,
      'rank': rank,
    };
  }
}