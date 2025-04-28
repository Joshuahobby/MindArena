import 'package:cloud_firestore/cloud_firestore.dart';

class MatchPlayer {
  final String userId;
  final String username;
  final String avatarUrl;
  int score;
  int rank;
  bool isActive;
  Map<String, dynamic> answers;

  MatchPlayer({
    required this.userId,
    required this.username,
    required this.avatarUrl,
    this.score = 0,
    this.rank = 0,
    this.isActive = true,
    this.answers = const {},
  });

  factory MatchPlayer.fromMap(Map<String, dynamic> data) {
    return MatchPlayer(
      userId: data['userId'] ?? '',
      username: data['username'] ?? '',
      avatarUrl: data['avatarUrl'] ?? '',
      score: data['score'] ?? 0,
      rank: data['rank'] ?? 0,
      isActive: data['isActive'] ?? true,
      answers: Map<String, dynamic>.from(data['answers'] ?? {}),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'username': username,
      'avatarUrl': avatarUrl,
      'score': score,
      'rank': rank,
      'isActive': isActive,
      'answers': answers,
    };
  }
}

class MatchQuestion {
  final String questionId;
  final String question;
  final List<String> options;
  final int correctOptionIndex;
  final String category;
  
  MatchQuestion({
    required this.questionId,
    required this.question,
    required this.options,
    required this.correctOptionIndex,
    required this.category,
  });

  factory MatchQuestion.fromMap(Map<String, dynamic> data) {
    return MatchQuestion(
      questionId: data['questionId'] ?? '',
      question: data['question'] ?? '',
      options: List<String>.from(data['options'] ?? []),
      correctOptionIndex: data['correctOptionIndex'] ?? 0,
      category: data['category'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'questionId': questionId,
      'question': question,
      'options': options,
      'correctOptionIndex': correctOptionIndex,
      'category': category,
    };
  }
}

class MatchModel {
  final String id;
  final List<MatchPlayer> players;
  final List<MatchQuestion> questions;
  final DateTime createdAt;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final String status; // "waiting", "inProgress", "completed", "cancelled"
  final int currentQuestionIndex;
  final Map<String, dynamic>? metadata;

  MatchModel({
    required this.id,
    required this.players,
    required this.questions,
    required this.createdAt,
    this.startedAt,
    this.endedAt,
    required this.status,
    this.currentQuestionIndex = 0,
    this.metadata,
  });

  // Create a MatchModel from a Firebase document
  factory MatchModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    
    List<MatchPlayer> players = [];
    if (data['players'] != null) {
      for (var player in data['players']) {
        players.add(MatchPlayer.fromMap(player));
      }
    }

    List<MatchQuestion> questions = [];
    if (data['questions'] != null) {
      for (var question in data['questions']) {
        questions.add(MatchQuestion.fromMap(question));
      }
    }
    
    return MatchModel(
      id: doc.id,
      players: players,
      questions: questions,
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      startedAt: data['startedAt'] != null ? (data['startedAt'] as Timestamp).toDate() : null,
      endedAt: data['endedAt'] != null ? (data['endedAt'] as Timestamp).toDate() : null,
      status: data['status'] ?? 'waiting',
      currentQuestionIndex: data['currentQuestionIndex'] ?? 0,
      metadata: data['metadata'],
    );
  }

  // Convert MatchModel to a Map for Firestore
  Map<String, dynamic> toFirestore() {
    return {
      'players': players.map((player) => player.toMap()).toList(),
      'questions': questions.map((question) => question.toMap()).toList(),
      'createdAt': Timestamp.fromDate(createdAt),
      'startedAt': startedAt != null ? Timestamp.fromDate(startedAt!) : null,
      'endedAt': endedAt != null ? Timestamp.fromDate(endedAt!) : null,
      'status': status,
      'currentQuestionIndex': currentQuestionIndex,
      'metadata': metadata,
    };
  }

  // Create a copy of the MatchModel with updated fields
  MatchModel copyWith({
    String? id,
    List<MatchPlayer>? players,
    List<MatchQuestion>? questions,
    DateTime? createdAt,
    DateTime? startedAt,
    DateTime? endedAt,
    String? status,
    int? currentQuestionIndex,
    Map<String, dynamic>? metadata,
  }) {
    return MatchModel(
      id: id ?? this.id,
      players: players ?? this.players,
      questions: questions ?? this.questions,
      createdAt: createdAt ?? this.createdAt,
      startedAt: startedAt ?? this.startedAt,
      endedAt: endedAt ?? this.endedAt,
      status: status ?? this.status,
      currentQuestionIndex: currentQuestionIndex ?? this.currentQuestionIndex,
      metadata: metadata ?? this.metadata,
    );
  }

  // Get the current question based on index
  MatchQuestion? get currentQuestion {
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      return questions[currentQuestionIndex];
    }
    return null;
  }

  // Check if all players have answered the current question
  bool get allPlayersAnswered {
    if (currentQuestion == null) return false;
    
    for (var player in players) {
      if (player.isActive && !player.answers.containsKey('q${currentQuestionIndex}')) {
        return false;
      }
    }
    return true;
  }

  // Get the winner of the match
  MatchPlayer? get winner {
    if (status != 'completed' || players.isEmpty) return null;
    
    MatchPlayer highestScorer = players[0];
    for (var player in players) {
      if (player.score > highestScorer.score) {
        highestScorer = player;
      }
    }
    return highestScorer;
  }

  // Check if a player is the winner
  bool isPlayerWinner(String userId) {
    MatchPlayer? matchWinner = winner;
    return matchWinner != null && matchWinner.userId == userId;
  }

  // Get the active player count
  int get activePlayerCount {
    int count = 0;
    for (var player in players) {
      if (player.isActive) count++;
    }
    return count;
  }
}
