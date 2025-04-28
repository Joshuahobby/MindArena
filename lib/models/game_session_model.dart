class GameSession {
  final int? id;
  final String sessionCode;
  final bool isTournament;
  final int entryFee;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final List<PlayerSession> playerSessions;

  GameSession({
    this.id,
    required this.sessionCode,
    this.isTournament = false,
    this.entryFee = 0,
    this.startedAt,
    this.endedAt,
    this.playerSessions = const [],
  });

  factory GameSession.fromMap(Map<String, dynamic> map) {
    List<PlayerSession> playerSessions = [];
    if (map['player_sessions'] != null && map['player_sessions'] is List) {
      playerSessions = (map['player_sessions'] as List)
          .map((item) => PlayerSession.fromMap(item))
          .toList();
    }

    return GameSession(
      id: map['id'],
      sessionCode: map['session_code'],
      isTournament: map['is_tournament'] ?? false,
      entryFee: map['entry_fee'] ?? 0,
      startedAt: map['started_at'] != null 
        ? map['started_at'] is DateTime 
          ? map['started_at'] 
          : DateTime.parse(map['started_at'])
        : null,
      endedAt: map['ended_at'] != null 
        ? map['ended_at'] is DateTime 
          ? map['ended_at'] 
          : DateTime.parse(map['ended_at'])
        : null,
      playerSessions: playerSessions,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'session_code': sessionCode,
      'is_tournament': isTournament,
      'entry_fee': entryFee,
      'started_at': startedAt?.toIso8601String(),
      'ended_at': endedAt?.toIso8601String(),
      'player_sessions': playerSessions.map((session) => session.toMap()).toList(),
    };
  }
}

class PlayerSession {
  final int? id;
  final int? gameSessionId;
  final int? userId;
  final int score;
  final bool completed;
  final DateTime? joinedAt;
  final List<PlayerAnswer> playerAnswers;

  PlayerSession({
    this.id,
    this.gameSessionId,
    this.userId,
    this.score = 0,
    this.completed = false,
    this.joinedAt,
    this.playerAnswers = const [],
  });

  factory PlayerSession.fromMap(Map<String, dynamic> map) {
    List<PlayerAnswer> playerAnswers = [];
    if (map['player_answers'] != null && map['player_answers'] is List) {
      playerAnswers = (map['player_answers'] as List)
          .map((item) => PlayerAnswer.fromMap(item))
          .toList();
    }

    return PlayerSession(
      id: map['id'],
      gameSessionId: map['game_session_id'],
      userId: map['user_id'],
      score: map['score'] ?? 0,
      completed: map['completed'] ?? false,
      joinedAt: map['joined_at'] != null 
        ? map['joined_at'] is DateTime 
          ? map['joined_at'] 
          : DateTime.parse(map['joined_at'])
        : null,
      playerAnswers: playerAnswers,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'game_session_id': gameSessionId,
      'user_id': userId,
      'score': score,
      'completed': completed,
      'joined_at': joinedAt?.toIso8601String(),
      'player_answers': playerAnswers.map((answer) => answer.toMap()).toList(),
    };
  }
}

class PlayerAnswer {
  final int? id;
  final int? playerSessionId;
  final int? questionId;
  final int? answerId;
  final bool isCorrect;
  final int? responseTimeMs;
  final DateTime? answeredAt;

  PlayerAnswer({
    this.id,
    this.playerSessionId,
    this.questionId,
    this.answerId,
    required this.isCorrect,
    this.responseTimeMs,
    this.answeredAt,
  });

  factory PlayerAnswer.fromMap(Map<String, dynamic> map) {
    return PlayerAnswer(
      id: map['id'],
      playerSessionId: map['player_session_id'],
      questionId: map['question_id'],
      answerId: map['answer_id'],
      isCorrect: map['is_correct'] ?? false,
      responseTimeMs: map['response_time_ms'],
      answeredAt: map['answered_at'] != null 
        ? map['answered_at'] is DateTime 
          ? map['answered_at'] 
          : DateTime.parse(map['answered_at'])
        : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'player_session_id': playerSessionId,
      'question_id': questionId,
      'answer_id': answerId,
      'is_correct': isCorrect,
      'response_time_ms': responseTimeMs,
      'answered_at': answeredAt?.toIso8601String(),
    };
  }
}