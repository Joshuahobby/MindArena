import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:mind_arena/models/question_model.dart';
import 'package:mind_arena/models/game_session_model.dart';
import 'package:mind_arena/services/database_service.dart';
import 'package:mind_arena/services/mock_database_service.dart';
import 'package:mind_arena/services/database_service_factory.dart';
import 'dart:developer' as developer;

class QuizService {
  final dynamic _databaseService;
  static final QuizService _instance = QuizService._internal(DatabaseServiceFactory.getDatabaseService());
  
  factory QuizService() {
    return _instance;
  }
  
  QuizService._internal(this._databaseService);
  
  Future<void> initialize() async {
    if (kIsWeb) {
      // For web platform, we skip database initialization
      developer.log('Web platform detected, using mock data');
    } else {
      // For native platforms, initialize the database connection
      await _databaseService.initialize();
      developer.log('Database initialized for native platform');
    }
  }
  
  // Category-related methods
  Future<List<QuestionCategory>> getCategories() async {
    try {
      if (kIsWeb) {
        // Simplified mock categories for web platform
        // Return hardcoded categories to avoid database connection issues in web
        developer.log('Returning mock categories for web platform');
        return [
          QuestionCategory(
            id: 1,
            name: 'Science',
            description: 'Questions about various scientific fields',
          ),
          QuestionCategory(
            id: 2,
            name: 'History',
            description: 'Questions about historical events and figures',
          ),
          QuestionCategory(
            id: 3,
            name: 'Geography',
            description: 'Questions about places around the world',
          ),
          QuestionCategory(
            id: 4,
            name: 'Entertainment',
            description: 'Questions about movies, TV, music and celebrities',
          ),
          QuestionCategory(
            id: 5,
            name: 'Sports',
            description: 'Questions about various sports and athletes',
          ),
        ];
      } else {
        // Traditional PostgreSQL implementation for native platforms
        final connection = _databaseService.connection;
        if (connection == null) {
          throw Exception('Database connection not initialized');
        }
    
        final results = await connection.query('SELECT * FROM categories ORDER BY name');
        
        return results
          .map((row) => QuestionCategory.fromMap(row.toColumnMap()))
          .toList();
      }
    } catch (e) {
      developer.log('Error fetching categories: $e');
      return [];
    }
  }
  
  Future<QuestionCategory> createCategory(QuestionCategory category) async {
    try {
      final connection = _databaseService.connection;
      if (connection == null) {
        throw Exception('Database connection not initialized');
      }
      
      final results = await connection.query(
        'INSERT INTO categories (name, description, icon_url) VALUES (@name, @description, @iconUrl) RETURNING *',
        substitutionValues: {
          'name': category.name,
          'description': category.description,
          'iconUrl': category.iconUrl,
        },
      );
      
      return QuestionCategory.fromMap(results.first.toColumnMap());
    } catch (e) {
      print('Error creating category: $e');
      rethrow;
    }
  }
  
  // Question-related methods
  Future<Question> createQuestion(Question question) async {
    try {
      final connection = _databaseService.connection;
      if (connection == null) {
        throw Exception('Database connection not initialized');
      }
      
      final questionResults = await connection.query(
        'INSERT INTO questions (category_id, question_text, difficulty) VALUES (@categoryId, @questionText, @difficulty) RETURNING *',
        substitutionValues: {
          'categoryId': question.categoryId,
          'questionText': question.questionText,
          'difficulty': question.difficulty,
        },
      );
      
      final newQuestion = Question.fromMap(questionResults.first.toColumnMap());
      
      // Insert answers
      for (final answer in question.answers) {
        await connection.query(
          'INSERT INTO answers (question_id, answer_text, is_correct) VALUES (@questionId, @answerText, @isCorrect)',
          substitutionValues: {
            'questionId': newQuestion.id,
            'answerText': answer.answerText,
            'isCorrect': answer.isCorrect,
          },
        );
      }
      
      // Fetch the complete question with answers
      return await getQuestionById(newQuestion.id!);
    } catch (e) {
      print('Error creating question: $e');
      rethrow;
    }
  }
  
  Future<Question> getQuestionById(int questionId) async {
    try {
      final connection = _databaseService.connection;
      if (connection == null) {
        throw Exception('Database connection not initialized');
      }
      
      final questionResults = await connection.query(
        '''
        SELECT q.*, c.name as category_name 
        FROM questions q
        LEFT JOIN categories c ON q.category_id = c.id
        WHERE q.id = @questionId
        ''',
        substitutionValues: {'questionId': questionId},
      );
      
      if (questionResults.isEmpty) {
        throw Exception('Question not found');
      }
      
      final question = questionResults.first.toColumnMap();
      
      // Get answers for this question
      final answerResults = await connection.query(
        'SELECT * FROM answers WHERE question_id = @questionId',
        substitutionValues: {'questionId': questionId},
      );
      
      List<Map<String, dynamic>> answers = answerResults.map((row) => row.toColumnMap()).toList();
      question['answers'] = answers;
      
      return Question.fromMap(question);
    } catch (e) {
      print('Error fetching question: $e');
      rethrow;
    }
  }
  
  // Game Session methods
  Future<GameSession> createGameSession({bool isTournament = false, int entryFee = 0}) async {
    try {
      return GameSession.fromMap(await _databaseService.createGameSession(isTournament, entryFee));
    } catch (e) {
      print('Error creating game session: $e');
      rethrow;
    }
  }
  
  Future<GameSession> getGameSessionByCode(String sessionCode) async {
    try {
      final connection = _databaseService.connection;
      if (connection == null) {
        throw Exception('Database connection not initialized');
      }
      
      final results = await connection.query(
        'SELECT * FROM game_sessions WHERE session_code = @sessionCode',
        substitutionValues: {'sessionCode': sessionCode},
      );
      
      if (results.isEmpty) {
        throw Exception('Game session not found');
      }
      
      return GameSession.fromMap(results.first.toColumnMap());
    } catch (e) {
      print('Error fetching game session: $e');
      rethrow;
    }
  }
  
  Future<PlayerSession> joinGameSession(String sessionCode, int userId) async {
    try {
      final connection = _databaseService.connection;
      if (connection == null) {
        throw Exception('Database connection not initialized');
      }
      
      // Get game session id
      final gameSessionResults = await connection.query(
        'SELECT id FROM game_sessions WHERE session_code = @sessionCode',
        substitutionValues: {'sessionCode': sessionCode},
      );
      
      if (gameSessionResults.isEmpty) {
        throw Exception('Game session not found');
      }
      
      final gameSessionId = gameSessionResults.first[0] as int;
      
      // Check if user already joined
      final existingSessionResults = await connection.query(
        'SELECT * FROM player_sessions WHERE game_session_id = @gameSessionId AND user_id = @userId',
        substitutionValues: {
          'gameSessionId': gameSessionId,
          'userId': userId,
        },
      );
      
      if (existingSessionResults.isNotEmpty) {
        return PlayerSession.fromMap(existingSessionResults.first.toColumnMap());
      }
      
      // Create new player session
      final playerSessionResults = await connection.query(
        '''
        INSERT INTO player_sessions (game_session_id, user_id)
        VALUES (@gameSessionId, @userId)
        RETURNING *
        ''',
        substitutionValues: {
          'gameSessionId': gameSessionId,
          'userId': userId,
        },
      );
      
      return PlayerSession.fromMap(playerSessionResults.first.toColumnMap());
    } catch (e) {
      print('Error joining game session: $e');
      rethrow;
    }
  }
  
  Future<PlayerAnswer> submitAnswer(
    int playerSessionId,
    int questionId,
    int answerId,
    int responseTimeMs,
  ) async {
    try {
      final connection = _databaseService.connection;
      if (connection == null) {
        throw Exception('Database connection not initialized');
      }
      
      // Check if answer is correct
      final answerResults = await connection.query(
        'SELECT is_correct FROM answers WHERE id = @answerId AND question_id = @questionId',
        substitutionValues: {
          'answerId': answerId,
          'questionId': questionId,
        },
      );
      
      if (answerResults.isEmpty) {
        throw Exception('Invalid answer');
      }
      
      final isCorrect = answerResults.first[0] as bool;
      
      // Record player answer
      final playerAnswerResults = await connection.query(
        '''
        INSERT INTO player_answers (player_session_id, question_id, answer_id, is_correct, response_time_ms)
        VALUES (@playerSessionId, @questionId, @answerId, @isCorrect, @responseTimeMs)
        RETURNING *
        ''',
        substitutionValues: {
          'playerSessionId': playerSessionId,
          'questionId': questionId,
          'answerId': answerId,
          'isCorrect': isCorrect,
          'responseTimeMs': responseTimeMs,
        },
      );
      
      // If answer is correct, update player score
      if (isCorrect) {
        // Points calculation: faster response = more points (max 1000 points)
        final points = _calculatePoints(responseTimeMs);
        
        await connection.query(
          'UPDATE player_sessions SET score = score + @points WHERE id = @playerSessionId',
          substitutionValues: {
            'points': points,
            'playerSessionId': playerSessionId,
          },
        );
      }
      
      return PlayerAnswer.fromMap(playerAnswerResults.first.toColumnMap());
    } catch (e) {
      print('Error submitting answer: $e');
      rethrow;
    }
  }
  
  // Calculate points based on response time
  // Faster response = more points (max 1000 points for instant response)
  int _calculatePoints(int responseTimeMs) {
    const maxPoints = 1000;
    const maxResponseTime = 10000; // 10 seconds
    
    if (responseTimeMs >= maxResponseTime) {
      return 100; // Minimum points for correct answer
    }
    
    final timeRatio = 1 - (responseTimeMs / maxResponseTime);
    return (maxPoints * timeRatio).round();
  }
  
  Future<void> completePlayerSession(int playerSessionId) async {
    try {
      final connection = _databaseService.connection;
      if (connection == null) {
        throw Exception('Database connection not initialized');
      }
      
      await connection.query(
        'UPDATE player_sessions SET completed = TRUE WHERE id = @playerSessionId',
        substitutionValues: {'playerSessionId': playerSessionId},
      );
    } catch (e) {
      print('Error completing player session: $e');
      rethrow;
    }
  }
  
  Future<void> endGameSession(int gameSessionId) async {
    try {
      final connection = _databaseService.connection;
      if (connection == null) {
        throw Exception('Database connection not initialized');
      }
      
      await connection.query(
        'UPDATE game_sessions SET ended_at = CURRENT_TIMESTAMP WHERE id = @gameSessionId',
        substitutionValues: {'gameSessionId': gameSessionId},
      );
    } catch (e) {
      print('Error ending game session: $e');
      rethrow;
    }
  }
  
  Future<List<Map<String, dynamic>>> getLeaderboard({String type = 'global', int limit = 10}) async {
    try {
      if (kIsWeb) {
        // Return mock leaderboard data for web platform
        developer.log('Returning mock leaderboard data for web platform');
        return [
          {
            'id': 1,
            'username': 'quizmaster',
            'display_name': 'Quiz Master',
            'avatar_url': 'assets/images/avatars/avatar1.png',
            'total_score': 9850,
          },
          {
            'id': 2,
            'username': 'triviaQueen',
            'display_name': 'Trivia Queen',
            'avatar_url': 'assets/images/avatars/avatar2.png',
            'total_score': 9320,
          },
          {
            'id': 3,
            'username': 'brainiac',
            'display_name': 'The Brainiac',
            'avatar_url': 'assets/images/avatars/avatar3.png',
            'total_score': 8990,
          },
          {
            'id': 4,
            'username': 'knowledgeSeeker',
            'display_name': 'Knowledge Seeker',
            'avatar_url': 'assets/images/avatars/avatar4.png',
            'total_score': 8540,
          },
          {
            'id': 5,
            'username': 'quizWhiz',
            'display_name': 'Quiz Whiz',
            'avatar_url': 'assets/images/avatars/avatar5.png',
            'total_score': 7950,
          },
        ];
      }
      
      // For non-web platforms, use PostgreSQL
      final connection = _databaseService.connection;
      if (connection == null) {
        throw Exception('Database connection not initialized');
      }
      
      String query;
      Map<String, dynamic> substitutionValues = {'limit': limit};
      
      switch (type) {
        case 'daily':
          query = '''
            SELECT u.id, u.username, u.display_name, u.avatar_url, SUM(ps.score) as total_score
            FROM users u
            JOIN player_sessions ps ON u.id = ps.user_id
            JOIN game_sessions gs ON ps.game_session_id = gs.id
            WHERE gs.started_at >= CURRENT_DATE
            GROUP BY u.id, u.username, u.display_name, u.avatar_url
            ORDER BY total_score DESC
            LIMIT @limit
          ''';
          break;
        case 'weekly':
          query = '''
            SELECT u.id, u.username, u.display_name, u.avatar_url, SUM(ps.score) as total_score
            FROM users u
            JOIN player_sessions ps ON u.id = ps.user_id
            JOIN game_sessions gs ON ps.game_session_id = gs.id
            WHERE gs.started_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY u.id, u.username, u.display_name, u.avatar_url
            ORDER BY total_score DESC
            LIMIT @limit
          ''';
          break;
        case 'global':
        default:
          query = '''
            SELECT u.id, u.username, u.display_name, u.avatar_url, SUM(ps.score) as total_score
            FROM users u
            JOIN player_sessions ps ON u.id = ps.user_id
            GROUP BY u.id, u.username, u.display_name, u.avatar_url
            ORDER BY total_score DESC
            LIMIT @limit
          ''';
          break;
      }
      
      final results = await connection.query(query, substitutionValues: substitutionValues);
      
      return results.map((row) => row.toColumnMap()).toList();
    } catch (e) {
      print('Error fetching leaderboard: $e');
      return [];
    }
  }
}