class QuestionCategory {
  final int? id;
  final String name;
  final String? description;
  final String? iconUrl;

  QuestionCategory({
    this.id,
    required this.name,
    this.description,
    this.iconUrl,
  });

  factory QuestionCategory.fromMap(Map<String, dynamic> map) {
    return QuestionCategory(
      id: map['id'],
      name: map['name'],
      description: map['description'],
      iconUrl: map['icon_url'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'icon_url': iconUrl,
    };
  }
}

class QuestionAnswer {
  final int? id;
  final int? questionId;
  final String answerText;
  final bool isCorrect;

  QuestionAnswer({
    this.id,
    this.questionId,
    required this.answerText,
    required this.isCorrect,
  });

  factory QuestionAnswer.fromMap(Map<String, dynamic> map) {
    return QuestionAnswer(
      id: map['id'],
      questionId: map['question_id'],
      answerText: map['answer_text'],
      isCorrect: map['is_correct'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'question_id': questionId,
      'answer_text': answerText,
      'is_correct': isCorrect,
    };
  }
}

class Question {
  final int? id;
  final int? categoryId;
  final String questionText;
  final int difficulty; // 1=Easy, 2=Medium, 3=Hard
  final DateTime? createdAt;
  final String? categoryName;
  final List<QuestionAnswer> answers;

  Question({
    this.id,
    this.categoryId,
    required this.questionText,
    required this.difficulty,
    this.createdAt,
    this.categoryName,
    this.answers = const [],
  });

  factory Question.fromMap(Map<String, dynamic> map) {
    List<QuestionAnswer> answers = [];
    if (map['answers'] != null && map['answers'] is List) {
      answers = (map['answers'] as List)
          .map((item) => QuestionAnswer.fromMap(item))
          .toList();
    }

    return Question(
      id: map['id'],
      categoryId: map['category_id'],
      questionText: map['question_text'],
      difficulty: map['difficulty'],
      categoryName: map['category_name'],
      createdAt: map['created_at'] != null 
        ? map['created_at'] is DateTime 
          ? map['created_at'] 
          : DateTime.parse(map['created_at'])
        : null,
      answers: answers,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'category_id': categoryId,
      'question_text': questionText,
      'difficulty': difficulty,
      'created_at': createdAt?.toIso8601String(),
      'category_name': categoryName,
      'answers': answers.map((answer) => answer.toMap()).toList(),
    };
  }
}