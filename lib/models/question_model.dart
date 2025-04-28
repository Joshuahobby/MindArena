import 'package:cloud_firestore/cloud_firestore.dart';

class QuestionModel {
  final String id;
  final String category;
  final String question;
  final List<String> options;
  final int correctOptionIndex;
  final int difficulty; // 1-3 (easy, medium, hard)
  final String? explanation;
  final bool isActive;

  QuestionModel({
    required this.id,
    required this.category,
    required this.question,
    required this.options,
    required this.correctOptionIndex,
    required this.difficulty,
    this.explanation,
    this.isActive = true,
  });

  // Create a QuestionModel from a Firebase document
  factory QuestionModel.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    
    return QuestionModel(
      id: doc.id,
      category: data['category'] ?? '',
      question: data['question'] ?? '',
      options: List<String>.from(data['options'] ?? []),
      correctOptionIndex: data['correctOptionIndex'] ?? 0,
      difficulty: data['difficulty'] ?? 1,
      explanation: data['explanation'],
      isActive: data['isActive'] ?? true,
    );
  }

  // Convert QuestionModel to a Map for Firestore
  Map<String, dynamic> toFirestore() {
    return {
      'category': category,
      'question': question,
      'options': options,
      'correctOptionIndex': correctOptionIndex,
      'difficulty': difficulty,
      'explanation': explanation,
      'isActive': isActive,
    };
  }

  // Create a copy of the QuestionModel with updated fields
  QuestionModel copyWith({
    String? id,
    String? category,
    String? question,
    List<String>? options,
    int? correctOptionIndex,
    int? difficulty,
    String? explanation,
    bool? isActive,
  }) {
    return QuestionModel(
      id: id ?? this.id,
      category: category ?? this.category,
      question: question ?? this.question,
      options: options ?? this.options,
      correctOptionIndex: correctOptionIndex ?? this.correctOptionIndex,
      difficulty: difficulty ?? this.difficulty,
      explanation: explanation ?? this.explanation,
      isActive: isActive ?? this.isActive,
    );
  }

  // Get the correct answer
  String get correctAnswer {
    if (correctOptionIndex >= 0 && correctOptionIndex < options.length) {
      return options[correctOptionIndex];
    }
    return '';
  }

  // Get points based on difficulty
  int get basePoints {
    switch (difficulty) {
      case 1: return 100;  // Easy
      case 2: return 150;  // Medium
      case 3: return 200;  // Hard
      default: return 100;
    }
  }
}
