import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:mind_arena/models/question_model.dart';
import 'package:mind_arena/services/websocket_service.dart';

class GameState {
  String gameId;
  String opponentName;
  List<Question>? questions;
  Question? currentQuestion;
  int currentQuestionIndex = 0;
  int myScore = 0;
  int opponentScore = 0;
  int? selectedAnswerIndex;
  bool? isCorrect;
  int? correctAnswerIndex;
  bool isGameOver = false;
  Map<String, dynamic>? gameResults;
  bool isSinglePlayer = false;
  bool isWinner = false;
  int tokensEarned = 0;
  int xpEarned = 0;
  
  GameState({
    required this.gameId,
    required this.opponentName,
    this.isSinglePlayer = false,
  });
  
  bool get canProceedToNextQuestion => 
      selectedAnswerIndex != null && 
      correctAnswerIndex != null &&
      currentQuestionIndex < (questions?.length ?? 0) - 1;
      
  bool get isLastQuestion => 
      questions != null && 
      currentQuestionIndex == questions!.length - 1;
      
  Duration get timeRemaining {
    if (currentQuestion == null) {
      return Duration.zero;
    }
    return Duration(seconds: currentQuestion!.timeLimit);
  }
}

class GameService extends ChangeNotifier {
  final WebSocketService _webSocketService;
  GameState? _gameState;
  Timer? _botTimer;
  
  GameService(this._webSocketService) {
    _webSocketService.addListener(_handleWebSocketUpdate);
  }
  
  GameState? get gameState => _gameState;
  
  void _handleWebSocketUpdate() {
    if (_webSocketService.currentGameState != null && _gameState == null) {
      // Initialize game state from websocket
      _handleGameStart(_webSocketService.currentGameState!);
    }
    
    if (_webSocketService.latestQuestion != null && _gameState != null) {
      _handleNewQuestion(_webSocketService.latestQuestion!);
    }
    
    if (_webSocketService.answerFeedback != null && _gameState != null) {
      _handleAnswerFeedback(_webSocketService.answerFeedback!);
    }
    
    if (_webSocketService.scoreUpdate != null && _gameState != null) {
      _handleScoreUpdate(_webSocketService.scoreUpdate!);
    }
    
    if (_webSocketService.gameResults != null && _gameState != null) {
      _handleGameEnd(_webSocketService.gameResults!);
    }
  }
  
  void _handleGameStart(Map<String, dynamic> gameData) {
    _gameState = GameState(
      gameId: gameData['gameId'],
      opponentName: gameData['opponentName'],
    );
    notifyListeners();
  }
  
  void _handleNewQuestion(Map<String, dynamic> questionData) {
    if (_gameState == null) return;
    
    final question = Question.fromJson(questionData['question']);
    
    if (_gameState!.questions == null) {
      _gameState!.questions = [];
    }
    
    _gameState!.questions!.add(question);
    _gameState!.currentQuestion = question;
    _gameState!.currentQuestionIndex = _gameState!.questions!.length - 1;
    _gameState!.selectedAnswerIndex = null;
    _gameState!.isCorrect = null;
    _gameState!.correctAnswerIndex = null;
    
    notifyListeners();
  }
  
  void _handleAnswerFeedback(Map<String, dynamic> feedbackData) {
    if (_gameState == null) return;
    
    _gameState!.isCorrect = feedbackData['isCorrect'];
    _gameState!.correctAnswerIndex = feedbackData['correctIndex'];
    
    notifyListeners();
  }
  
  void _handleScoreUpdate(Map<String, dynamic> scoreData) {
    if (_gameState == null) return;
    
    _gameState!.myScore = scoreData['yourScore'];
    _gameState!.opponentScore = scoreData['opponentScore'];
    
    notifyListeners();
  }
  
  void _handleGameEnd(Map<String, dynamic> resultsData) {
    if (_gameState == null) return;
    
    _gameState!.isGameOver = true;
    _gameState!.gameResults = resultsData;
    _gameState!.isWinner = resultsData['winner'] == 'you';
    _gameState!.tokensEarned = resultsData['tokensEarned'] ?? 0;
    _gameState!.xpEarned = resultsData['xpEarned'] ?? 0;
    
    notifyListeners();
  }
  
  void selectAnswer(int answerIndex) {
    if (_gameState == null || _gameState!.selectedAnswerIndex != null) return;
    
    _gameState!.selectedAnswerIndex = answerIndex;
    notifyListeners();
    
    // In multiplayer, send the answer to the server
    if (!_gameState!.isSinglePlayer) {
      _webSocketService.submitAnswer(answerIndex);
    } else {
      // In single player, we determine the correctness locally
      _processSinglePlayerAnswer(answerIndex);
    }
  }
  
  void nextQuestion() {
    if (_gameState == null || !_gameState!.canProceedToNextQuestion) return;
    
    _gameState!.currentQuestionIndex++;
    _gameState!.currentQuestion = _gameState!.questions![_gameState!.currentQuestionIndex];
    _gameState!.selectedAnswerIndex = null;
    _gameState!.isCorrect = null;
    _gameState!.correctAnswerIndex = null;
    
    notifyListeners();
    
    // For single player, we need to simulate the bot's answer after a delay
    if (_gameState!.isSinglePlayer) {
      _simulateBotAnswer();
    }
  }
  
  void resetGame() {
    _gameState = null;
    _webSocketService.clearGameState();
    if (_botTimer != null) {
      _botTimer!.cancel();
      _botTimer = null;
    }
    notifyListeners();
  }
  
  // Single Player Game Implementation
  
  void startSinglePlayerGame() {
    _gameState = GameState(
      gameId: 'single_player_${DateTime.now().millisecondsSinceEpoch}',
      opponentName: 'MindBot',
      isSinglePlayer: true,
    );
    
    // Initialize with sample questions for single player
    _gameState!.questions = _getSampleQuestions();
    _gameState!.currentQuestion = _gameState!.questions![0];
    
    notifyListeners();
    
    // Simulate bot answering after a random delay
    _simulateBotAnswer();
  }
  
  void _processSinglePlayerAnswer(int answerIndex) {
    if (_gameState == null || !_gameState!.isSinglePlayer) return;
    
    final question = _gameState!.currentQuestion!;
    final isCorrect = question.correctAnswerIndex == answerIndex;
    
    // Update the game state
    _gameState!.isCorrect = isCorrect;
    _gameState!.correctAnswerIndex = question.correctAnswerIndex;
    
    if (isCorrect) {
      _gameState!.myScore += 10;
    }
    
    notifyListeners();
    
    // If this was the last question, end the game
    if (_gameState!.isLastQuestion) {
      _endSinglePlayerGame();
    }
  }
  
  void _simulateBotAnswer() {
    if (_gameState == null || !_gameState!.isSinglePlayer) return;
    
    // Cancel any existing timer
    if (_botTimer != null) {
      _botTimer!.cancel();
    }
    
    // Simulate bot answering after a random delay (1-5 seconds)
    final random = Random();
    final delay = Duration(seconds: random.nextInt(5) + 1);
    
    _botTimer = Timer(delay, () {
      if (_gameState == null) return;
      
      final question = _gameState!.currentQuestion!;
      
      // Bot has 70% chance to get the right answer
      final botAnswerCorrect = random.nextDouble() < 0.7;
      final botAnswerIndex = botAnswerCorrect 
          ? question.correctAnswerIndex 
          : _getRandomWrongAnswerIndex(question);
      
      // Update bot score
      if (botAnswerCorrect) {
        _gameState!.opponentScore += 10;
      }
      
      notifyListeners();
      
      // If this was the last question and the player has already answered, end the game
      if (_gameState!.isLastQuestion && _gameState!.selectedAnswerIndex != null) {
        _endSinglePlayerGame();
      }
    });
  }
  
  int _getRandomWrongAnswerIndex(Question question) {
    final random = Random();
    int wrongIndex;
    do {
      wrongIndex = random.nextInt(question.answers.length);
    } while (wrongIndex == question.correctAnswerIndex);
    return wrongIndex;
  }
  
  void _endSinglePlayerGame() {
    if (_gameState == null || !_gameState!.isSinglePlayer) return;
    
    final isWinner = _gameState!.myScore > _gameState!.opponentScore;
    final tokensEarned = isWinner ? 10 : 5;
    final xpEarned = isWinner ? 20 : 10;
    
    _gameState!.isGameOver = true;
    _gameState!.isWinner = isWinner;
    _gameState!.tokensEarned = tokensEarned;
    _gameState!.xpEarned = xpEarned;
    
    _gameState!.gameResults = {
      'winner': isWinner ? 'you' : 'opponent',
      'yourScore': _gameState!.myScore,
      'opponentScore': _gameState!.opponentScore,
      'tokensEarned': tokensEarned,
      'xpEarned': xpEarned,
    };
    
    notifyListeners();
  }
  
  List<Question> _getSampleQuestions() {
    return [
      Question(
        id: '1',
        text: 'What is the capital of France?',
        answers: ['Berlin', 'London', 'Paris', 'Madrid'],
        correctAnswerIndex: 2,
        timeLimit: 15,
      ),
      Question(
        id: '2',
        text: 'Which planet is known as the Red Planet?',
        answers: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswerIndex: 1,
        timeLimit: 15,
      ),
      Question(
        id: '3',
        text: 'What is the chemical symbol for gold?',
        answers: ['Au', 'Ag', 'Fe', 'Cu'],
        correctAnswerIndex: 0,
        timeLimit: 15,
      ),
      Question(
        id: '4',
        text: 'Who painted the Mona Lisa?',
        answers: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
        correctAnswerIndex: 2,
        timeLimit: 15,
      ),
      Question(
        id: '5',
        text: 'Which of these is not a programming language?',
        answers: ['Python', 'Java', 'HTML', 'Dolphin'],
        correctAnswerIndex: 3,
        timeLimit: 15,
      ),
    ];
  }
  
  @override
  void dispose() {
    _webSocketService.removeListener(_handleWebSocketUpdate);
    if (_botTimer != null) {
      _botTimer!.cancel();
    }
    super.dispose();
  }
}