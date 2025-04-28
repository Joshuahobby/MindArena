import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:mind_arena/models/quiz_model.dart';
import 'dart:developer' as developer;

class QuizService {
  static final QuizService _instance = QuizService._internal();
  factory QuizService() => _instance;
  QuizService._internal();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Mock questions for development and testing
  final List<Question> _mockQuestions = [
    Question(
      id: '1',
      text: 'What is the capital of France?',
      answers: ['Paris', 'London', 'Berlin', 'Madrid'],
      correctAnswerIndex: 0,
      category: 'geography',
      difficulty: 'easy',
    ),
    Question(
      id: '2',
      text: 'Which planet is known as the Red Planet?',
      answers: ['Earth', 'Mars', 'Jupiter', 'Venus'],
      correctAnswerIndex: 1,
      category: 'science',
      difficulty: 'easy',
    ),
    Question(
      id: '3',
      text: 'Who painted the Mona Lisa?',
      answers: ['Michelangelo', 'Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso'],
      correctAnswerIndex: 2,
      category: 'history',
      difficulty: 'easy',
    ),
    Question(
      id: '4',
      text: 'What is the chemical symbol for gold?',
      answers: ['Go', 'Gd', 'Au', 'Ag'],
      correctAnswerIndex: 2,
      category: 'science',
      difficulty: 'medium',
    ),
    Question(
      id: '5',
      text: 'In which year did World War II end?',
      answers: ['1943', '1945', '1947', '1950'],
      correctAnswerIndex: 1,
      category: 'history',
      difficulty: 'medium',
    ),
    Question(
      id: '6',
      text: 'What is the largest ocean on Earth?',
      answers: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
      correctAnswerIndex: 3,
      category: 'geography',
      difficulty: 'medium',
    ),
    Question(
      id: '7',
      text: 'Who wrote "Romeo and Juliet"?',
      answers: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'F. Scott Fitzgerald'],
      correctAnswerIndex: 1,
      category: 'entertainment',
      difficulty: 'easy',
    ),
    Question(
      id: '8',
      text: 'What is the tallest mountain in the world?',
      answers: ['K2', 'Mount Kilimanjaro', 'Mount Everest', 'Makalu'],
      correctAnswerIndex: 2,
      category: 'geography',
      difficulty: 'easy',
    ),
    Question(
      id: '9',
      text: 'What is the chemical formula for water?',
      answers: ['H2O', 'CO2', 'NaCl', 'O2'],
      correctAnswerIndex: 0,
      category: 'science',
      difficulty: 'easy',
    ),
    Question(
      id: '10',
      text: 'Which sport uses a shuttlecock?',
      answers: ['Tennis', 'Basketball', 'Badminton', 'Golf'],
      correctAnswerIndex: 2,
      category: 'sports',
      difficulty: 'medium',
    ),
  ];

  // Mock categories for development and testing
  final List<QuizCategory> _mockCategories = [
    QuizCategory(
      id: 'general',
      name: 'General Knowledge',
      description: 'Questions about a wide range of topics.',
      iconName: 'lightbulb',
    ),
    QuizCategory(
      id: 'science',
      name: 'Science',
      description: 'Questions about physics, chemistry, biology, and more.',
      iconName: 'science',
    ),
    QuizCategory(
      id: 'history',
      name: 'History',
      description: 'Questions about historical events, figures, and periods.',
      iconName: 'history_edu',
    ),
    QuizCategory(
      id: 'geography',
      name: 'Geography',
      description: 'Questions about countries, capitals, landmarks, and more.',
      iconName: 'public',
    ),
    QuizCategory(
      id: 'entertainment',
      name: 'Entertainment',
      description: 'Questions about movies, music, books, and more.',
      iconName: 'movie',
    ),
    QuizCategory(
      id: 'sports',
      name: 'Sports',
      description: 'Questions about various sports and athletes.',
      iconName: 'sports_soccer',
    ),
  ];

  // Initialize service
  Future<void> initialize() async {
    // In a real application, you might want to fetch some initial data here
    developer.log('QuizService initialized');
  }

  // Get quiz categories
  Future<List<QuizCategory>> getCategories() async {
    try {
      if (kIsWeb) {
        // For web, return mock categories
        return _mockCategories;
      } else {
        // For mobile, fetch from Firestore
        final QuerySnapshot snapshot = await _firestore.collection('categories').get();
        return snapshot.docs.map((doc) {
          final data = doc.data() as Map<String, dynamic>;
          data['id'] = doc.id;
          return QuizCategory.fromJson(data);
        }).toList();
      }
    } catch (e) {
      developer.log('Error getting categories: $e');
      // Fallback to mock categories if there's an error
      return _mockCategories;
    }
  }

  // Get questions
  Future<List<Question>> getQuestions({
    int count = 10,
    String? category,
    String? difficulty,
  }) async {
    try {
      if (kIsWeb) {
        // For web, filter the mock questions
        List<Question> filteredQuestions = List.from(_mockQuestions);
        
        if (category != null) {
          filteredQuestions = filteredQuestions.where((q) => q.category == category).toList();
        }
        
        if (difficulty != null) {
          filteredQuestions = filteredQuestions.where((q) => q.difficulty == difficulty).toList();
        }
        
        // Shuffle and limit to requested count
        filteredQuestions.shuffle();
        return filteredQuestions.take(count).toList();
      } else {
        // For mobile, fetch from Firestore with query
        Query query = _firestore.collection('questions');
        
        if (category != null) {
          query = query.where('category', isEqualTo: category);
        }
        
        if (difficulty != null) {
          query = query.where('difficulty', isEqualTo: difficulty);
        }
        
        final QuerySnapshot snapshot = await query.limit(count).get();
        
        // If not enough questions with the filters, get more questions without filters
        if (snapshot.docs.length < count) {
          final int remaining = count - snapshot.docs.length;
          final QuerySnapshot additionalSnapshot = await _firestore
              .collection('questions')
              .limit(remaining)
              .get();
          
          final List<Question> questions = [
            ...snapshot.docs.map((doc) {
              final data = doc.data() as Map<String, dynamic>;
              data['id'] = doc.id;
              return Question.fromJson(data);
            }),
            ...additionalSnapshot.docs.map((doc) {
              final data = doc.data() as Map<String, dynamic>;
              data['id'] = doc.id;
              return Question.fromJson(data);
            }),
          ];
          
          return questions;
        } else {
          return snapshot.docs.map((doc) {
            final data = doc.data() as Map<String, dynamic>;
            data['id'] = doc.id;
            return Question.fromJson(data);
          }).toList();
        }
      }
    } catch (e) {
      developer.log('Error getting questions: $e');
      // Fallback to mock questions if there's an error
      List<Question> filteredQuestions = List.from(_mockQuestions);
      filteredQuestions.shuffle();
      return filteredQuestions.take(count).toList();
    }
  }

  // Save quiz result
  Future<QuizResult> saveQuizResult(QuizResult result) async {
    try {
      if (!kIsWeb) {
        // For mobile, save to Firestore
        final DocumentReference docRef = await _firestore.collection('quiz_results').add(result.toJson());
        return result;
      } else {
        // For web, just return the result (no saving)
        return result;
      }
    } catch (e) {
      developer.log('Error saving quiz result: $e');
      return result;
    }
  }

  // Get user quiz history
  Future<List<QuizResult>> getUserQuizHistory(String userId) async {
    try {
      if (!kIsWeb) {
        // For mobile, fetch from Firestore
        final QuerySnapshot snapshot = await _firestore
            .collection('quiz_results')
            .where('user_id', isEqualTo: userId)
            .orderBy('timestamp', descending: true)
            .get();
        
        return snapshot.docs.map((doc) {
          final data = doc.data() as Map<String, dynamic>;
          data['id'] = doc.id;
          return QuizResult.fromJson(data);
        }).toList();
      } else {
        // For web, return empty list (no history)
        return [];
      }
    } catch (e) {
      developer.log('Error getting user quiz history: $e');
      return [];
    }
  }

  // Get leaderboard
  Future<List<Map<String, dynamic>>> getLeaderboard({
    String? category,
    String? timeframe = 'all', // 'daily', 'weekly', 'monthly', 'all'
  }) async {
    try {
      if (!kIsWeb) {
        // For mobile, fetch from Firestore
        Query query = _firestore.collection('users');
        
        // Apply filters
        // In a real app, you'd need more complex logic for timeframes

        final QuerySnapshot snapshot = await query
            .orderBy('total_score', descending: true)
            .limit(100)
            .get();
        
        return snapshot.docs.map((doc) {
          final data = doc.data() as Map<String, dynamic>;
          data['id'] = doc.id;
          return {
            'user_id': doc.id,
            'username': data['username'] ?? 'Unknown',
            'display_name': data['display_name'],
            'avatar_url': data['avatar_url'],
            'score': data['total_score'] ?? 0,
            'level': data['level'] ?? 1,
          };
        }).toList();
      } else {
        // For web, return mock leaderboard
        return [
          {
            'user_id': '1',
            'username': 'QuizMaster',
            'display_name': 'Quiz Master',
            'avatar_url': null,
            'score': 9500,
            'level': 25,
          },
          {
            'user_id': '2',
            'username': 'BrainWhiz',
            'display_name': 'Brain Whiz',
            'avatar_url': null,
            'score': 8750,
            'level': 22,
          },
          {
            'user_id': '3',
            'username': 'TriviaKing',
            'display_name': 'Trivia King',
            'avatar_url': null,
            'score': 8200,
            'level': 20,
          },
          {
            'user_id': '4',
            'username': 'KnowledgeGuru',
            'display_name': 'Knowledge Guru',
            'avatar_url': null,
            'score': 7900,
            'level': 19,
          },
          {
            'user_id': '5',
            'username': 'WisdomSeeker',
            'display_name': 'Wisdom Seeker',
            'avatar_url': null,
            'score': 7600,
            'level': 18,
          },
        ];
      }
    } catch (e) {
      developer.log('Error getting leaderboard: $e');
      return [];
    }
  }

  // Create a match between two users
  Future<QuizMatch> createMatch(String user1Id, {String? user2Id}) async {
    try {
      if (!kIsWeb) {
        // Generate questions for the match
        final List<Question> questions = await getQuestions(count: 5);
        final List<String> questionIds = questions.map((q) => q.id).toList();
        
        // Create match document
        final QuizMatch match = QuizMatch(
          id: '',
          user1Id: user1Id,
          user2Id: user2Id,
          status: user2Id != null ? 'waiting' : 'in_progress',
          createdAt: DateTime.now(),
          startedAt: user2Id != null ? null : DateTime.now(),
          endedAt: null,
          questionIds: questionIds,
          user1Results: null,
          user2Results: null,
        );
        
        // Save to Firestore
        final DocumentReference docRef = await _firestore.collection('matches').add(match.toJson());
        return match.copyWith(id: docRef.id);
      } else {
        // For web, just simulate creating a match
        final List<Question> questions = await getQuestions(count: 5);
        final List<String> questionIds = questions.map((q) => q.id).toList();
        
        final QuizMatch match = QuizMatch(
          id: 'mock-match-${DateTime.now().millisecondsSinceEpoch}',
          user1Id: user1Id,
          user2Id: user2Id,
          status: user2Id != null ? 'waiting' : 'in_progress',
          createdAt: DateTime.now(),
          startedAt: user2Id != null ? null : DateTime.now(),
          endedAt: null,
          questionIds: questionIds,
          user1Results: null,
          user2Results: null,
        );
        
        return match;
      }
    } catch (e) {
      developer.log('Error creating match: $e');
      throw Exception('Failed to create match: $e');
    }
  }

  // Helper method to add questions to Firestore (for initial setup)
  Future<void> addQuestionToFirestore(Question question) async {
    try {
      await _firestore.collection('questions').add(question.toJson());
    } catch (e) {
      developer.log('Error adding question to Firestore: $e');
      rethrow;
    }
  }

  // Helper method to add categories to Firestore (for initial setup)
  Future<void> addCategoryToFirestore(QuizCategory category) async {
    try {
      await _firestore.collection('categories').doc(category.id).set(category.toJson());
    } catch (e) {
      developer.log('Error adding category to Firestore: $e');
      rethrow;
    }
  }
}

// Extension method for QuizMatch
extension QuizMatchExtension on QuizMatch {
  QuizMatch copyWith({
    String? id,
    String? user1Id,
    String? user2Id,
    String? status,
    DateTime? createdAt,
    DateTime? startedAt,
    DateTime? endedAt,
    List<String>? questionIds,
    Map<String, dynamic>? user1Results,
    Map<String, dynamic>? user2Results,
  }) {
    return QuizMatch(
      id: id ?? this.id,
      user1Id: user1Id ?? this.user1Id,
      user2Id: user2Id ?? this.user2Id,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      startedAt: startedAt ?? this.startedAt,
      endedAt: endedAt ?? this.endedAt,
      questionIds: questionIds ?? this.questionIds,
      user1Results: user1Results ?? this.user1Results,
      user2Results: user2Results ?? this.user2Results,
    );
  }
}