class Question {
  final String text;
  final List<String> answers;
  final int? correctAnswer; // Index of the correct answer
  final double timeLimit; // Time limit in seconds
  
  Question({
    required this.text,
    required this.answers,
    this.correctAnswer,
    required this.timeLimit,
  });
  
  Question copyWith({
    String? text,
    List<String>? answers,
    int? correctAnswer,
    double? timeLimit,
  }) {
    return Question(
      text: text ?? this.text,
      answers: answers ?? this.answers,
      correctAnswer: correctAnswer ?? this.correctAnswer,
      timeLimit: timeLimit ?? this.timeLimit,
    );
  }
}