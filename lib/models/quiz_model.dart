class Question {
  final String id;
  final String text;
  final List<String> answers;
  final int correctAnswerIndex;
  final String? category;
  final String? difficulty;
  final String? explanation;

  Question({
    required this.id,
    required this.text,
    required this.answers,
    required this.correctAnswerIndex,
    this.category,
    this.difficulty,
    this.explanation,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      answers: List<String>.from(json['answers'] ?? []),
      correctAnswerIndex: json['correct_answer_index'] ?? 0,
      category: json['category'],
      difficulty: json['difficulty'],
      explanation: json['explanation'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'answers': answers,
      'correct_answer_index': correctAnswerIndex,
      'category': category,
      'difficulty': difficulty,
      'explanation': explanation,
    };
  }
}

class QuizCategory {
  final String id;
  final String name;
  final String? description;
  final String? iconName;

  QuizCategory({
    required this.id,
    required this.name,
    this.description,
    this.iconName,
  });

  factory QuizCategory.fromJson(Map<String, dynamic> json) {
    return QuizCategory(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      iconName: json['icon_name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'icon_name': iconName,
    };
  }
}

class QuizResult {
  final String id;
  final String userId;
  final int score;
  final int correctAnswers;
  final int totalQuestions;
  final double accuracy;
  final double averageTime;
  final String mode;
  final String? category;
  final DateTime timestamp;

  QuizResult({
    required this.id,
    required this.userId,
    required this.score,
    required this.correctAnswers,
    required this.totalQuestions,
    required this.accuracy,
    required this.averageTime,
    required this.mode,
    this.category,
    required this.timestamp,
  });

  factory QuizResult.fromJson(Map<String, dynamic> json) {
    return QuizResult(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      score: json['score'] ?? 0,
      correctAnswers: json['correct_answers'] ?? 0,
      totalQuestions: json['total_questions'] ?? 0,
      accuracy: json['accuracy'] ?? 0.0,
      averageTime: json['average_time'] ?? 0.0,
      mode: json['mode'] ?? '',
      category: json['category'],
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'score': score,
      'correct_answers': correctAnswers,
      'total_questions': totalQuestions,
      'accuracy': accuracy,
      'average_time': averageTime,
      'mode': mode,
      'category': category,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class QuizMatch {
  final String id;
  final String user1Id;
  final String? user2Id;
  final String status; // 'waiting', 'in_progress', 'completed'
  final DateTime createdAt;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final List<String> questionIds;
  final Map<String, dynamic>? user1Results;
  final Map<String, dynamic>? user2Results;

  QuizMatch({
    required this.id,
    required this.user1Id,
    this.user2Id,
    required this.status,
    required this.createdAt,
    this.startedAt,
    this.endedAt,
    required this.questionIds,
    this.user1Results,
    this.user2Results,
  });

  factory QuizMatch.fromJson(Map<String, dynamic> json) {
    return QuizMatch(
      id: json['id'] ?? '',
      user1Id: json['user1_id'] ?? '',
      user2Id: json['user2_id'],
      status: json['status'] ?? 'waiting',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      startedAt: json['started_at'] != null
          ? DateTime.parse(json['started_at'])
          : null,
      endedAt: json['ended_at'] != null
          ? DateTime.parse(json['ended_at'])
          : null,
      questionIds: List<String>.from(json['question_ids'] ?? []),
      user1Results: json['user1_results'],
      user2Results: json['user2_results'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user1_id': user1Id,
      'user2_id': user2Id,
      'status': status,
      'created_at': createdAt.toIso8601String(),
      'started_at': startedAt?.toIso8601String(),
      'ended_at': endedAt?.toIso8601String(),
      'question_ids': questionIds,
      'user1_results': user1Results,
      'user2_results': user2Results,
    };
  }
}