class Tournament {
  final String id;
  final String name;
  final DateTime startDate;
  final DateTime endDate;
  final int entryFee;
  final int maxPlayers;
  final int currentPlayers;
  final String status; // 'upcoming', 'active', 'completed'
  final List<TournamentPrize>? prizes;
  final List<TournamentMatch>? matches;
  final List<TournamentParticipant>? participants;
  final String? category;
  final String? description;
  final Map<String, dynamic>? rules;
  final String? avatarUrl;

  Tournament({
    required this.id,
    required this.name,
    required this.startDate,
    required this.endDate,
    required this.entryFee,
    required this.maxPlayers,
    required this.currentPlayers,
    required this.status,
    this.prizes,
    this.matches,
    this.participants,
    this.category,
    this.description,
    this.rules,
    this.avatarUrl,
  });

  factory Tournament.fromJson(Map<String, dynamic> json) {
    return Tournament(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      startDate: json['start_date'] != null
          ? DateTime.parse(json['start_date'])
          : DateTime.now(),
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'])
          : DateTime.now().add(const Duration(days: 1)),
      entryFee: json['entry_fee'] ?? 0,
      maxPlayers: json['max_players'] ?? 100,
      currentPlayers: json['current_players'] ?? 0,
      status: json['status'] ?? 'upcoming',
      prizes: json['prizes'] != null
          ? List<TournamentPrize>.from(
              json['prizes'].map((x) => TournamentPrize.fromJson(x)))
          : null,
      matches: json['matches'] != null
          ? List<TournamentMatch>.from(
              json['matches'].map((x) => TournamentMatch.fromJson(x)))
          : null,
      participants: json['participants'] != null
          ? List<TournamentParticipant>.from(
              json['participants'].map((x) => TournamentParticipant.fromJson(x)))
          : null,
      category: json['category'],
      description: json['description'],
      rules: json['rules'],
      avatarUrl: json['avatar_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'start_date': startDate.toIso8601String(),
      'end_date': endDate.toIso8601String(),
      'entry_fee': entryFee,
      'max_players': maxPlayers,
      'current_players': currentPlayers,
      'status': status,
      'prizes': prizes?.map((x) => x.toJson()).toList(),
      'matches': matches?.map((x) => x.toJson()).toList(),
      'participants': participants?.map((x) => x.toJson()).toList(),
      'category': category,
      'description': description,
      'rules': rules,
      'avatar_url': avatarUrl,
    };
  }

  // Getter to check if tournament is active
  bool get isActive => status == 'active';

  // Getter to check if tournament is upcoming
  bool get isUpcoming => status == 'upcoming';

  // Getter to check if tournament is completed
  bool get isCompleted => status == 'completed';

  // Getter to check if tournament is full
  bool get isFull => currentPlayers >= maxPlayers;

  // Getter for time status
  String get timeStatus {
    final now = DateTime.now();
    if (now.isBefore(startDate)) {
      final daysLeft = startDate.difference(now).inDays;
      if (daysLeft == 0) {
        final hoursLeft = startDate.difference(now).inHours;
        return 'Starting in $hoursLeft hours';
      }
      return 'Starting in $daysLeft days';
    } else if (now.isAfter(endDate)) {
      return 'Ended ${now.difference(endDate).inDays} days ago';
    } else {
      final hoursLeft = endDate.difference(now).inHours;
      if (hoursLeft < 24) {
        return '$hoursLeft hours remaining';
      }
      final daysLeft = endDate.difference(now).inDays;
      return '$daysLeft days remaining';
    }
  }

  // Calculate total prize pool
  int getTotalPrizePool() {
    if (prizes == null || prizes!.isEmpty) return 0;
    
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
  final String type; // 'coins', 'avatar', etc.
  final String name;
  final int? amount; // For coins
  final String? avatarId; // For avatars

  TournamentPrize({
    required this.rank,
    required this.type,
    required this.name,
    this.amount,
    this.avatarId,
  });

  factory TournamentPrize.fromJson(Map<String, dynamic> json) {
    return TournamentPrize(
      rank: json['rank'] ?? 0,
      type: json['type'] ?? '',
      name: json['name'] ?? '',
      amount: json['amount'],
      avatarId: json['avatar_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'rank': rank,
      'type': type,
      'name': name,
      'amount': amount,
      'avatar_id': avatarId,
    };
  }

  Map<String, dynamic> toMap() {
    return {
      'rank': rank,
      'type': type,
      'name': name,
      'amount': amount,
      'avatar_id': avatarId,
    };
  }
}

class TournamentMatch {
  final String id;
  final String tournamentId;
  final String player1Id;
  final String player2Id;
  final int roundNumber;
  final String status; // 'pending', 'in_progress', 'completed'
  final int? player1Score;
  final int? player2Score;
  final String? winnerId;
  final DateTime? scheduledAt;
  final DateTime? completedAt;

  TournamentMatch({
    required this.id,
    required this.tournamentId,
    required this.player1Id,
    required this.player2Id,
    required this.roundNumber,
    required this.status,
    this.player1Score,
    this.player2Score,
    this.winnerId,
    this.scheduledAt,
    this.completedAt,
  });

  factory TournamentMatch.fromJson(Map<String, dynamic> json) {
    return TournamentMatch(
      id: json['id'] ?? '',
      tournamentId: json['tournament_id'] ?? '',
      player1Id: json['player1_id'] ?? '',
      player2Id: json['player2_id'] ?? '',
      roundNumber: json['round_number'] ?? 0,
      status: json['status'] ?? 'pending',
      player1Score: json['player1_score'],
      player2Score: json['player2_score'],
      winnerId: json['winner_id'],
      scheduledAt: json['scheduled_at'] != null
          ? DateTime.parse(json['scheduled_at'])
          : null,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tournament_id': tournamentId,
      'player1_id': player1Id,
      'player2_id': player2Id,
      'round_number': roundNumber,
      'status': status,
      'player1_score': player1Score,
      'player2_score': player2Score,
      'winner_id': winnerId,
      'scheduled_at': scheduledAt?.toIso8601String(),
      'completed_at': completedAt?.toIso8601String(),
    };
  }
}

class TournamentParticipant {
  final String userId;
  final String tournamentId;
  final DateTime joinedAt;
  final int score;
  final int rank;
  final bool eliminated;
  final int matchesPlayed;
  final int matchesWon;

  TournamentParticipant({
    required this.userId,
    required this.tournamentId,
    required this.joinedAt,
    required this.score,
    required this.rank,
    required this.eliminated,
    required this.matchesPlayed,
    required this.matchesWon,
  });

  factory TournamentParticipant.fromJson(Map<String, dynamic> json) {
    return TournamentParticipant(
      userId: json['user_id'] ?? '',
      tournamentId: json['tournament_id'] ?? '',
      joinedAt: json['joined_at'] != null
          ? DateTime.parse(json['joined_at'])
          : DateTime.now(),
      score: json['score'] ?? 0,
      rank: json['rank'] ?? 0,
      eliminated: json['eliminated'] ?? false,
      matchesPlayed: json['matches_played'] ?? 0,
      matchesWon: json['matches_won'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'tournament_id': tournamentId,
      'joined_at': joinedAt.toIso8601String(),
      'score': score,
      'rank': rank,
      'eliminated': eliminated,
      'matches_played': matchesPlayed,
      'matches_won': matchesWon,
    };
  }
}