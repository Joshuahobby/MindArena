import 'package:mind_arena/models/question_model.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/models/game_session_model.dart';
import 'dart:math' as math;
import 'dart:developer' as developer;

/// Mock database service for Flutter Web since direct PostgreSQL connections 
/// are not supported in browser environments.
class MockDatabaseService {
  static final MockDatabaseService _instance = MockDatabaseService._internal();
  bool _isInitialized = false;
  
  // Mock data collections
  final List<Map<String, dynamic>> _users = [];
  final List<Map<String, dynamic>> _categories = [];
  final List<Map<String, dynamic>> _questions = [];
  final List<Map<String, dynamic>> _answers = [];
  final List<Map<String, dynamic>> _gameSessions = [];
  final List<Map<String, dynamic>> _playerSessions = [];
  final List<Map<String, dynamic>> _playerAnswers = [];
  
  factory MockDatabaseService() {
    return _instance;
  }
  
  MockDatabaseService._internal();
  
  bool get isInitialized => _isInitialized;
  
  Future<void> initialize() async {
    if (_isInitialized) {
      developer.log('Mock database already initialized');
      return;
    }
    
    developer.log('Initializing mock database for web platform');
    
    await Future.delayed(const Duration(milliseconds: 500)); // Simulate DB connection time
    
    // Initialize with some mock data
    _seedMockData();
    
    _isInitialized = true;
    developer.log('Mock database initialized successfully');
  }
  
  void _seedMockData() {
    // Add categories
    _addCategory(name: 'Science', description: 'Questions about various scientific fields');
    _addCategory(name: 'History', description: 'Questions about historical events and figures');
    _addCategory(name: 'Geography', description: 'Questions about places around the world');
    _addCategory(name: 'Entertainment', description: 'Questions about movies, TV, music and celebrities');
    _addCategory(name: 'Sports', description: 'Questions about various sports and athletes');
    
    // Add users
    _addUser(
      username: 'player1', 
      email: 'player1@example.com',
      displayName: 'Quiz Master',
      avatarUrl: 'assets/images/avatars/player1.png',
    );
    
    _addUser(
      username: 'player2', 
      email: 'player2@example.com',
      displayName: 'Trivia King',
      avatarUrl: 'assets/images/avatars/player2.png',
    );
    
    // Add questions
    final scienceId = _categories[0]['id'];
    final historyId = _categories[1]['id'];
    final geographyId = _categories[2]['id'];
    
    // Science questions
    final q1 = _addQuestion(
      categoryId: scienceId,
      questionText: 'What is the chemical symbol for gold?',
      difficulty: 1,
    );
    _addAnswer(questionId: q1, answerText: 'Au', isCorrect: true);
    _addAnswer(questionId: q1, answerText: 'Ag', isCorrect: false);
    _addAnswer(questionId: q1, answerText: 'Fe', isCorrect: false);
    _addAnswer(questionId: q1, answerText: 'Gd', isCorrect: false);
    
    final q2 = _addQuestion(
      categoryId: scienceId,
      questionText: 'Which planet is known as the Red Planet?',
      difficulty: 1,
    );
    _addAnswer(questionId: q2, answerText: 'Mars', isCorrect: true);
    _addAnswer(questionId: q2, answerText: 'Venus', isCorrect: false);
    _addAnswer(questionId: q2, answerText: 'Jupiter', isCorrect: false);
    _addAnswer(questionId: q2, answerText: 'Saturn', isCorrect: false);
    
    // History questions
    final q3 = _addQuestion(
      categoryId: historyId,
      questionText: 'In which year did World War II end?',
      difficulty: 1,
    );
    _addAnswer(questionId: q3, answerText: '1945', isCorrect: true);
    _addAnswer(questionId: q3, answerText: '1939', isCorrect: false);
    _addAnswer(questionId: q3, answerText: '1942', isCorrect: false);
    _addAnswer(questionId: q3, answerText: '1950', isCorrect: false);
    
    // Geography questions
    final q4 = _addQuestion(
      categoryId: geographyId,
      questionText: 'What is the capital of Japan?',
      difficulty: 1,
    );
    _addAnswer(questionId: q4, answerText: 'Tokyo', isCorrect: true);
    _addAnswer(questionId: q4, answerText: 'Kyoto', isCorrect: false);
    _addAnswer(questionId: q4, answerText: 'Osaka', isCorrect: false);
    _addAnswer(questionId: q4, answerText: 'Hiroshima', isCorrect: false);
    
    developer.log('Mock database seeded with initial data');
  }
  
  // Helper methods to add mock data
  int _addCategory({required String name, String? description, String? iconUrl}) {
    final id = _categories.length + 1;
    _categories.add({
      'id': id,
      'name': name,
      'description': description,
      'icon_url': iconUrl,
    });
    return id;
  }
  
  int _addUser({
    required String username, 
    required String email,
    String? displayName,
    String? avatarUrl,
    int coins = 0,
    int experiencePoints = 0,
    int level = 1,
  }) {
    final id = _users.length + 1;
    _users.add({
      'id': id,
      'username': username,
      'email': email,
      'display_name': displayName,
      'avatar_url': avatarUrl,
      'coins': coins,
      'experience_points': experiencePoints,
      'level': level,
      'created_at': DateTime.now().toIso8601String(),
    });
    return id;
  }
  
  int _addQuestion({
    required int categoryId,
    required String questionText,
    required int difficulty,
  }) {
    final id = _questions.length + 1;
    _questions.add({
      'id': id,
      'category_id': categoryId,
      'question_text': questionText,
      'difficulty': difficulty,
      'created_at': DateTime.now().toIso8601String(),
      'category_name': _categories.firstWhere((c) => c['id'] == categoryId)['name'],
    });
    return id;
  }
  
  int _addAnswer({
    required int questionId,
    required String answerText,
    required bool isCorrect,
  }) {
    final id = _answers.length + 1;
    _answers.add({
      'id': id,
      'question_id': questionId,
      'answer_text': answerText,
      'is_correct': isCorrect,
    });
    return id;
  }
  
  // Mock API methods
  
  Future<List<Map<String, dynamic>>> getCategories() async {
    await _checkInitialized();
    return _categories;
  }
  
  Future<Map<String, dynamic>> getCategoryById(int id) async {
    await _checkInitialized();
    final category = _categories.firstWhere(
      (c) => c['id'] == id,
      orElse: () => throw Exception('Category not found'),
    );
    return category;
  }
  
  Future<Map<String, dynamic>> createCategory(Map<String, dynamic> categoryData) async {
    await _checkInitialized();
    final id = _addCategory(
      name: categoryData['name'],
      description: categoryData['description'],
      iconUrl: categoryData['icon_url'],
    );
    return await getCategoryById(id);
  }
  
  Future<Map<String, dynamic>> getQuestionById(int id) async {
    await _checkInitialized();
    final question = _questions.firstWhere(
      (q) => q['id'] == id,
      orElse: () => throw Exception('Question not found'),
    );
    
    // Add answers to question
    final questionAnswers = _answers.where((a) => a['question_id'] == id).toList();
    final resultQuestion = {...question};
    resultQuestion['answers'] = questionAnswers;
    
    return resultQuestion;
  }
  
  Future<Map<String, dynamic>> createQuestion(Map<String, dynamic> questionData) async {
    await _checkInitialized();
    
    // Create question
    final id = _addQuestion(
      categoryId: questionData['category_id'],
      questionText: questionData['question_text'],
      difficulty: questionData['difficulty'],
    );
    
    // Create answers
    if (questionData['answers'] != null && questionData['answers'] is List) {
      for (final answerData in questionData['answers']) {
        _addAnswer(
          questionId: id,
          answerText: answerData['answer_text'],
          isCorrect: answerData['is_correct'],
        );
      }
    }
    
    return await getQuestionById(id);
  }
  
  Future<List<Map<String, dynamic>>> getQuestionsByCategoryId(int categoryId) async {
    await _checkInitialized();
    final categoryQuestions = _questions.where((q) => q['category_id'] == categoryId).toList();
    
    // Add answers to each question
    for (final question in categoryQuestions) {
      final questionId = question['id'];
      final questionAnswers = _answers.where((a) => a['question_id'] == questionId).toList();
      question['answers'] = questionAnswers;
    }
    
    return categoryQuestions;
  }
  
  Future<Map<String, dynamic>> createGameSession(bool isTournament, int entryFee) async {
    await _checkInitialized();
    final id = _gameSessions.length + 1;
    final sessionCode = _generateSessionCode();
    
    final gameSession = {
      'id': id,
      'session_code': sessionCode,
      'is_tournament': isTournament,
      'entry_fee': entryFee,
      'started_at': DateTime.now().toIso8601String(),
      'ended_at': null,
    };
    
    _gameSessions.add(gameSession);
    return gameSession;
  }
  
  Future<Map<String, dynamic>> getGameSessionByCode(String sessionCode) async {
    await _checkInitialized();
    final gameSession = _gameSessions.firstWhere(
      (gs) => gs['session_code'] == sessionCode,
      orElse: () => throw Exception('Game session not found'),
    );
    return gameSession;
  }
  
  Future<Map<String, dynamic>> joinGameSession(String sessionCode, int userId) async {
    await _checkInitialized();
    
    // Find game session
    final gameSession = await getGameSessionByCode(sessionCode);
    final gameSessionId = gameSession['id'];
    
    // Check if player already joined
    final existingPlayerSession = _playerSessions.firstWhere(
      (ps) => ps['game_session_id'] == gameSessionId && ps['user_id'] == userId,
      orElse: () => <String, dynamic>{},
    );
    
    if (existingPlayerSession.isNotEmpty) {
      return existingPlayerSession;
    }
    
    // Create new player session
    final id = _playerSessions.length + 1;
    final playerSession = {
      'id': id,
      'game_session_id': gameSessionId,
      'user_id': userId,
      'score': 0,
      'completed': false,
      'joined_at': DateTime.now().toIso8601String(),
    };
    
    _playerSessions.add(playerSession);
    return playerSession;
  }
  
  Future<Map<String, dynamic>> submitAnswer(
    int playerSessionId,
    int questionId, 
    int answerId,
    int responseTimeMs,
  ) async {
    await _checkInitialized();
    
    // Find answer and check if correct
    final answer = _answers.firstWhere(
      (a) => a['id'] == answerId && a['question_id'] == questionId,
      orElse: () => throw Exception('Invalid answer'),
    );
    
    final isCorrect = answer['is_correct'] as bool;
    
    // Create player answer record
    final id = _playerAnswers.length + 1;
    final playerAnswer = {
      'id': id,
      'player_session_id': playerSessionId,
      'question_id': questionId,
      'answer_id': answerId,
      'is_correct': isCorrect,
      'response_time_ms': responseTimeMs,
      'answered_at': DateTime.now().toIso8601String(),
    };
    
    _playerAnswers.add(playerAnswer);
    
    // Update player score if answer is correct
    if (isCorrect) {
      final points = _calculatePoints(responseTimeMs);
      
      final playerSession = _playerSessions.firstWhere(
        (ps) => ps['id'] == playerSessionId,
        orElse: () => throw Exception('Player session not found'),
      );
      
      playerSession['score'] = (playerSession['score'] as int) + points;
    }
    
    return playerAnswer;
  }
  
  Future<void> completePlayerSession(int playerSessionId) async {
    await _checkInitialized();
    
    final playerSession = _playerSessions.firstWhere(
      (ps) => ps['id'] == playerSessionId,
      orElse: () => throw Exception('Player session not found'),
    );
    
    playerSession['completed'] = true;
  }
  
  Future<void> endGameSession(int gameSessionId) async {
    await _checkInitialized();
    
    final gameSession = _gameSessions.firstWhere(
      (gs) => gs['id'] == gameSessionId,
      orElse: () => throw Exception('Game session not found'),
    );
    
    gameSession['ended_at'] = DateTime.now().toIso8601String();
  }
  
  Future<List<Map<String, dynamic>>> getLeaderboard({String type = 'global', int limit = 10}) async {
    await _checkInitialized();
    
    // Calculate scores for each user
    final scores = <int, int>{}; // userId -> score
    
    for (final playerSession in _playerSessions) {
      final userId = playerSession['user_id'] as int;
      final score = playerSession['score'] as int;
      
      scores[userId] = (scores[userId] ?? 0) + score;
    }
    
    // Create leaderboard entries
    final leaderboard = <Map<String, dynamic>>[];
    
    for (final userId in scores.keys) {
      final user = _users.firstWhere((u) => u['id'] == userId);
      
      leaderboard.add({
        'id': user['id'],
        'username': user['username'],
        'display_name': user['display_name'],
        'avatar_url': user['avatar_url'],
        'total_score': scores[userId],
      });
    }
    
    // Sort by score (descending) and take top N
    leaderboard.sort((a, b) => (b['total_score'] as int).compareTo(a['total_score'] as int));
    return leaderboard.take(limit).toList();
  }
  
  Future<void> _checkInitialized() async {
    if (!_isInitialized) {
      throw Exception('Mock database not initialized');
    }
  }
  
  // Calculate points based on response time
  int _calculatePoints(int responseTimeMs) {
    const maxPoints = 1000;
    const maxResponseTime = 10000; // 10 seconds
    
    if (responseTimeMs >= maxResponseTime) {
      return 100; // Minimum points for correct answer
    }
    
    final timeRatio = 1 - (responseTimeMs / maxResponseTime);
    return (maxPoints * timeRatio).round();
  }
  
  // Helper method for generating a random session code
  String _generateSessionCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters I, O, 0, 1
    final random = math.Random();
    return List.generate(6, (index) => chars[random.nextInt(chars.length)]).join();
  }
}