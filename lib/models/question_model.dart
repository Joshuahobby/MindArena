class Question {
  final String id;
  final String question;
  final List<String> answers;
  final int correctAnswer;
  final String? category;
  final String? difficulty;
  final String? explanation;

  Question({
    required this.id,
    required this.question,
    required this.answers,
    required this.correctAnswer,
    this.category,
    this.difficulty,
    this.explanation,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'] ?? '',
      question: json['question'] ?? '',
      answers: List<String>.from(json['answers'] ?? []),
      correctAnswer: json['correctAnswer'] ?? 0,
      category: json['category'],
      difficulty: json['difficulty'],
      explanation: json['explanation'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'question': question,
      'answers': answers,
      'correctAnswer': correctAnswer,
      'category': category,
      'difficulty': difficulty,
      'explanation': explanation,
    };
  }
}