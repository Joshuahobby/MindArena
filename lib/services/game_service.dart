import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:mind_arena/models/question_model.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/services/websocket_service.dart';

enum GameStatus {
  idle,
  matchmaking,
  preparing,
  playing,
  ended,
}

class GameService with ChangeNotifier {
  final WebSocketService _webSocketService;
  
  // Game state
  GameStatus _status = GameStatus.idle;
  String _matchmakingMessage = '';
  String? _gameId;
  User? _opponent;
  List<Question> _questions = [];
  int _currentQuestionIndex = 0;
  int _playerScore = 0;
  int _opponentScore = 0;
  Map<String, dynamic>? _gameResults;
  bool _isSinglePlayer = false;
  
  // Current question state
  Question? _currentQuestion;
  int? _selectedAnswer;
  bool _hasSubmittedAnswer = false;
  double _timeRemaining = 0;
  Timer? _questionTimer;
  
  // Callback functions
  VoidCallback? onMatchFound;
  Function(String)? onMatchmakingStatusChanged;
  VoidCallback? onGameStarted;
  Function(Question)? onQuestionReceived;
  Function(int, bool)? onAnswerFeedback;
  Function(int, int)? onScoreUpdate;
  VoidCallback? onGameEnded;
  
  GameService(this._webSocketService) {
    // Listen for websocket messages
    _webSocketService.onMessage = _handleWebSocketMessage;
  }
  
  // Getters
  GameStatus get status => _status;
  String get matchmakingMessage => _matchmakingMessage;
  User? get opponent => _opponent;
  Question? get currentQuestion => _currentQuestion;
  int get currentQuestionIndex => _currentQuestionIndex;
  int get playerScore => _playerScore;
  int get opponentScore => _opponentScore;
  int? get selectedAnswer => _selectedAnswer;
  bool get hasSubmittedAnswer => _hasSubmittedAnswer;
  double get timeRemaining => _timeRemaining;
  Map<String, dynamic>? get gameResults => _gameResults;
  bool get isSinglePlayer => _isSinglePlayer;
  
  // Game control methods
  Future<int> getOnlineUsersCount() async {
    _webSocketService.send({
      'type': 'get_online_users',
    });
    
    // This is a dummy return until we get the real count from the websocket
    return 0;
  }
  
  void startMatchmaking() {
    _status = GameStatus.matchmaking;
    _matchmakingMessage = 'Looking for opponents...';
    
    _webSocketService.send({
      'type': 'find_match',
    });
    
    notifyListeners();
  }
  
  void cancelMatchmaking() {
    if (_status == GameStatus.matchmaking) {
      _webSocketService.send({
        'type': 'cancel_matchmaking',
      });
      
      _status = GameStatus.idle;
      notifyListeners();
    }
  }
  
  void startSinglePlayerGame() {
    _status = GameStatus.matchmaking;
    _matchmakingMessage = 'Creating game with virtual bot...';
    _isSinglePlayer = true;
    
    _webSocketService.send({
      'type': 'start_single_player',
    });
    
    notifyListeners();
  }
  
  void selectAnswer(int answerIndex) {
    if (_status != GameStatus.playing || _hasSubmittedAnswer) return;
    
    _selectedAnswer = answerIndex;
    notifyListeners();
  }
  
  void submitAnswer() {
    if (_status != GameStatus.playing || _hasSubmittedAnswer || _selectedAnswer == null) return;
    
    final responseTime = _currentQuestion!.timeLimit - _timeRemaining;
    
    _webSocketService.send({
      'type': 'submit_answer',
      'answer': _selectedAnswer,
      'responseTime': responseTime,
    });
    
    _hasSubmittedAnswer = true;
    notifyListeners();
  }
  
  // Handle websocket messages
  void _handleWebSocketMessage(Map<String, dynamic> message) {
    final messageType = message['type'];
    
    switch (messageType) {
      case 'online_users':
        final count = message['count'] as int;
        // We don't need to notify here as this doesn't affect UI directly
        break;
        
      case 'matchmaking_status':
        final status = message['status'] as String;
        if (status == 'searching') {
          _matchmakingMessage = message['message'] as String;
          if (onMatchmakingStatusChanged != null) {
            onMatchmakingStatusChanged!(_matchmakingMessage);
          }
        }
        break;
        
      case 'match_found':
        _status = GameStatus.preparing;
        _isSinglePlayer = message['isSinglePlayer'] ?? false;
        
        final opponentData = message['opponent'];
        _opponent = User(
          id: opponentData['userId'],
          username: opponentData['username'],
          isBot: opponentData['isBot'] ?? false,
        );
        
        if (onMatchFound != null) {
          onMatchFound!();
        }
        
        notifyListeners();
        break;
        
      case 'game_start':
        _status = GameStatus.playing;
        _isSinglePlayer = message['isSinglePlayer'] ?? false;
        
        if (onGameStarted != null) {
          onGameStarted!();
        }
        
        notifyListeners();
        break;
        
      case 'question':
        _currentQuestionIndex = (message['questionNumber'] as int) - 1;
        final totalQuestions = message['totalQuestions'] as int;
        final questionText = message['question'] as String;
        final answers = List<String>.from(message['answers']);
        final timeLimit = message['timeLimit'] as int;
        
        _currentQuestion = Question(
          text: questionText,
          answers: answers,
          correctAnswer: null, // This will be revealed later
          timeLimit: timeLimit.toDouble(),
        );
        
        _timeRemaining = timeLimit.toDouble();
        _selectedAnswer = null;
        _hasSubmittedAnswer = false;
        
        // Start timer for this question
        _questionTimer?.cancel();
        _questionTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
          if (_timeRemaining <= 0) {
            timer.cancel();
            if (!_hasSubmittedAnswer) {
              // Time's up, auto-submit
              submitAnswer();
            }
          } else {
            _timeRemaining -= 0.1;
            notifyListeners();
          }
        });
        
        if (onQuestionReceived != null) {
          onQuestionReceived!(_currentQuestion!);
        }
        
        notifyListeners();
        break;
        
      case 'answer_feedback':
        _questionTimer?.cancel();
        
        final correctAnswer = message['correctAnswer'] as int;
        final playerAnswer = message['playerAnswer'] as int?;
        final isCorrect = message['isCorrect'] as bool;
        
        // Update current question with correct answer
        if (_currentQuestion != null) {
          _currentQuestion = _currentQuestion!.copyWith(
            correctAnswer: correctAnswer,
          );
        }
        
        if (onAnswerFeedback != null) {
          onAnswerFeedback!(correctAnswer, isCorrect);
        }
        
        notifyListeners();
        break;
        
      case 'update_scores':
        final scores = message['scores'];
        _playerScore = scores['player'] as int;
        _opponentScore = scores['opponent'] as int;
        
        if (onScoreUpdate != null) {
          onScoreUpdate!(_playerScore, _opponentScore);
        }
        
        notifyListeners();
        break;
        
      case 'game_end':
      case 'game_over':
        _status = GameStatus.ended;
        _gameResults = message['results'];
        
        if (onGameEnded != null) {
          onGameEnded!();
        }
        
        notifyListeners();
        break;
        
      case 'game_error':
        // Handle game errors
        break;
    }
  }
  
  // Cleanup
  void resetGame() {
    _status = GameStatus.idle;
    _matchmakingMessage = '';
    _gameId = null;
    _opponent = null;
    _questions = [];
    _currentQuestionIndex = 0;
    _playerScore = 0;
    _opponentScore = 0;
    _currentQuestion = null;
    _selectedAnswer = null;
    _hasSubmittedAnswer = false;
    _timeRemaining = 0;
    _gameResults = null;
    _isSinglePlayer = false;
    
    _questionTimer?.cancel();
    _questionTimer = null;
    
    notifyListeners();
  }
  
  @override
  void dispose() {
    _questionTimer?.cancel();
    super.dispose();
  }
}