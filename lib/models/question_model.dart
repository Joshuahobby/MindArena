class Question {
  final String id;
  final String text;
  final List<String> answers;
  final int correctAnswerIndex;
  final int timeLimit;
  
  Question({
    required this.id,
    required this.text,
    required this.answers,
    required this.correctAnswerIndex,
    required this.timeLimit,
  });
  
  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'],
      text: json['text'],
      answers: List<String>.from(json['answers']),
      correctAnswerIndex: json['correctAnswerIndex'],
      timeLimit: json['timeLimit'] ?? 15,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'answers': answers,
      'correctAnswerIndex': correctAnswerIndex,
      'timeLimit': timeLimit,
    };
  }
}