import 'dart:convert';
import 'dart:math';
import 'package:flutter/services.dart' show rootBundle;
import 'package:http/http.dart' as http;
import 'package:mind_arena/models/question_model.dart';

class QuizService {
  static final QuizService _instance = QuizService._internal();
  factory QuizService() => _instance;
  QuizService._internal();

  // Cache questions for better performance
  List<Question> _cachedQuestions = [];
  bool _isLoading = false;

  // Get random questions
  Future<List<Question>> getRandomQuestions(int count) async {
    // If we're already loading questions, wait for that to complete
    if (_isLoading) {
      await Future.delayed(const Duration(milliseconds: 500));
      return getRandomQuestions(count);
    }

    // If we don't have enough cached questions, load more
    if (_cachedQuestions.length < count) {
      await _loadQuestions();
    }

    // Get random questions from the cache
    final random = Random();
    final List<Question> result = [];
    final List<Question> availableQuestions = List.from(_cachedQuestions);

    while (result.length < count && availableQuestions.isNotEmpty) {
      final index = random.nextInt(availableQuestions.length);
      result.add(availableQuestions[index]);
      availableQuestions.removeAt(index);
    }

    return result;
  }

  // Load questions from sources
  Future<void> _loadQuestions() async {
    _isLoading = true;

    try {
      // Try to load from API first
      final apiQuestions = await _loadQuestionsFromApi();
      
      if (apiQuestions.isNotEmpty) {
        _cachedQuestions = apiQuestions;
      } else {
        // Fallback to local questions
        final localQuestions = await _loadQuestionsFromAssets();
        _cachedQuestions = localQuestions;
      }
    } catch (e) {
      // If API fails, try to load from assets
      try {
        final localQuestions = await _loadQuestionsFromAssets();
        _cachedQuestions = localQuestions;
      } catch (assetError) {
        // If everything fails, use hardcoded questions
        _cachedQuestions = _getHardcodedQuestions();
      }
    } finally {
      _isLoading = false;
    }
  }

  // Load questions from API
  Future<List<Question>> _loadQuestionsFromApi() async {
    try {
      final response = await http.get(
        Uri.parse('https://mindarena.app/api/questions'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((question) => Question.fromJson(question)).toList();
      } else {
        return [];
      }
    } catch (e) {
      return [];
    }
  }

  // Load questions from assets
  Future<List<Question>> _loadQuestionsFromAssets() async {
    try {
      final String data = await rootBundle.loadString('assets/data/questions.json');
      final List<dynamic> jsonData = json.decode(data);
      return jsonData.map((question) => Question.fromJson(question)).toList();
    } catch (e) {
      return [];
    }
  }

  // Hardcoded questions as a last resort
  List<Question> _getHardcodedQuestions() {
    return [
      Question(
        id: '1',
        question: 'What is the capital of France?',
        answers: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2,
        category: 'Geography',
        difficulty: 'Easy',
      ),
      Question(
        id: '2',
        question: 'Which planet is known as the Red Planet?',
        answers: ['Jupiter', 'Mars', 'Venus', 'Saturn'],
        correctAnswer: 1,
        category: 'Science',
        difficulty: 'Easy',
      ),
      Question(
        id: '3',
        question: 'Who painted the Mona Lisa?',
        answers: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
        correctAnswer: 2,
        category: 'Art',
        difficulty: 'Easy',
      ),
      Question(
        id: '4',
        question: 'What is the largest mammal in the world?',
        answers: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
        correctAnswer: 1,
        category: 'Biology',
        difficulty: 'Easy',
      ),
      Question(
        id: '5',
        question: 'Which element has the chemical symbol "O"?',
        answers: ['Gold', 'Oxygen', 'Osmium', 'Oganesson'],
        correctAnswer: 1,
        category: 'Chemistry',
        difficulty: 'Easy',
      ),
      Question(
        id: '6',
        question: 'Who wrote "Romeo and Juliet"?',
        answers: ['Charles Dickens', 'Jane Austen', 'William Shakespeare', 'Mark Twain'],
        correctAnswer: 2,
        category: 'Literature',
        difficulty: 'Easy',
      ),
      Question(
        id: '7',
        question: 'What is the largest ocean on Earth?',
        answers: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
        correctAnswer: 3,
        category: 'Geography',
        difficulty: 'Easy',
      ),
      Question(
        id: '8',
        question: 'Which country is known as the Land of the Rising Sun?',
        answers: ['China', 'Thailand', 'Japan', 'South Korea'],
        correctAnswer: 2,
        category: 'Geography',
        difficulty: 'Easy',
      ),
      Question(
        id: '9',
        question: 'What is the hardest natural substance on Earth?',
        answers: ['Gold', 'Iron', 'Diamond', 'Platinum'],
        correctAnswer: 2,
        category: 'Science',
        difficulty: 'Easy',
      ),
      Question(
        id: '10',
        question: 'Which famous scientist developed the theory of relativity?',
        answers: ['Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Nikola Tesla'],
        correctAnswer: 1,
        category: 'Science',
        difficulty: 'Medium',
      ),
    ];
  }

  // Add question categories
  List<String> getCategories() {
    final Set<String> categories = {};
    
    for (final question in _cachedQuestions) {
      if (question.category != null && question.category!.isNotEmpty) {
        categories.add(question.category!);
      }
    }
    
    return categories.toList()..sort();
  }

  // Get questions by category
  Future<List<Question>> getQuestionsByCategory(String category, int count) async {
    if (_cachedQuestions.isEmpty) {
      await _loadQuestions();
    }
    
    final List<Question> categoryQuestions = _cachedQuestions
        .where((q) => q.category == category)
        .toList();
    
    if (categoryQuestions.length <= count) {
      return categoryQuestions;
    }
    
    // Get random questions from this category
    final random = Random();
    final List<Question> result = [];
    final List<Question> available = List.from(categoryQuestions);
    
    while (result.length < count && available.isNotEmpty) {
      final index = random.nextInt(available.length);
      result.add(available[index]);
      available.removeAt(index);
    }
    
    return result;
  }

  // Get questions by difficulty
  Future<List<Question>> getQuestionsByDifficulty(String difficulty, int count) async {
    if (_cachedQuestions.isEmpty) {
      await _loadQuestions();
    }
    
    final List<Question> difficultyQuestions = _cachedQuestions
        .where((q) => q.difficulty == difficulty)
        .toList();
    
    if (difficultyQuestions.length <= count) {
      return difficultyQuestions;
    }
    
    // Get random questions from this difficulty
    final random = Random();
    final List<Question> result = [];
    final List<Question> available = List.from(difficultyQuestions);
    
    while (result.length < count && available.isNotEmpty) {
      final index = random.nextInt(available.length);
      result.add(available[index]);
      available.removeAt(index);
    }
    
    return result;
  }
}