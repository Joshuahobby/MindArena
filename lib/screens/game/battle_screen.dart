import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:mind_arena/config/constants.dart';
import 'package:mind_arena/config/theme.dart';
import 'package:mind_arena/models/match_model.dart';
import 'package:mind_arena/screens/game/result_screen.dart';
import 'package:mind_arena/services/analytics_service.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/services/quiz_service.dart';
import 'package:mind_arena/widgets/countdown_timer.dart';
import 'package:mind_arena/widgets/player_avatar.dart';
import 'package:mind_arena/widgets/question_card.dart';
import 'package:provider/provider.dart';
import 'package:audioplayers/audioplayers.dart';

class BattleScreen extends StatefulWidget {
  static const String routeName = '/battle';
  
  final String matchId;
  final int players;
  
  const BattleScreen({
    Key? key,
    required this.matchId,
    required this.players,
  }) : super(key: key);

  @override
  State<BattleScreen> createState() => _BattleScreenState();
}

class _BattleScreenState extends State<BattleScreen> {
  StreamSubscription<DocumentSnapshot>? _matchSubscription;
  MatchModel? _match;
  String? _userId;
  int _currentQuestionIndex = 0;
  bool _hasAnswered = false;
  int _selectedAnswerIndex = -1;
  bool _isCorrect = false;
  int _timeSpent = 0;
  bool _showAnswerFeedback = false;
  Timer? _answerFeedbackTimer;
  
  // Sound effects
  final AudioPlayer _audioPlayer = AudioPlayer();
  
  @override
  void initState() {
    super.initState();
    _fetchUserIdAndSubscribeToMatch();
    
    // Log screen view
    Provider.of<AnalyticsService>(context, listen: false)
        .logScreenView(screenName: 'battle_screen');
  }

  @override
  void dispose() {
    _matchSubscription?.cancel();
    _answerFeedbackTimer?.cancel();
    _audioPlayer.dispose();
    super.dispose();
  }

  void _fetchUserIdAndSubscribeToMatch() async {
    // Get current user ID
    final authService = Provider.of<AuthService>(context, listen: false);
    final userId = authService.currentUser?.uid;
    
    if (userId == null) {
      _showError('User not authenticated');
      return;
    }
    
    setState(() {
      _userId = userId;
    });
    
    // Subscribe to match updates
    final quizService = Provider.of<QuizService>(context, listen: false);
    
    try {
      final matchStream = await quizService.getMatchStream(widget.matchId);
      
      _matchSubscription = matchStream.listen(
        (snapshot) {
          if (snapshot.exists) {
            final match = MatchModel.fromFirestore(snapshot);
            
            if (mounted) {
              setState(() {
                _match = match;
                _currentQuestionIndex = match.currentQuestionIndex;
                
                // Check if player already answered current question
                if (_userId != null) {
                  final player = match.players.firstWhere(
                    (p) => p.userId == _userId,
                    orElse: () => MatchPlayer(
                      userId: '',
                      username: '',
                      avatarUrl: '',
                    ),
                  );
                  
                  String questionKey = 'q$_currentQuestionIndex';
                  _hasAnswered = player.answers.containsKey(questionKey);
                  
                  // If all players answered, show feedback temporarily
                  if (match.allPlayersAnswered && !_showAnswerFeedback) {
                    setState(() {
                      _showAnswerFeedback = true;
                    });
                    
                    // Hide feedback after 2 seconds
                    _answerFeedbackTimer?.cancel();
                    _answerFeedbackTimer = Timer(
                      const Duration(seconds: 2),
                      () {
                        if (mounted) {
                          setState(() {
                            _showAnswerFeedback = false;
                          });
                        }
                      },
                    );
                  }
                }
              });
              
              // Navigate to results when match is completed
              if (match.status == 'completed') {
                _navigateToResults(match);
              }
            }
          } else {
            _showError('Match not found');
          }
        },
        onError: (error) {
          _showError('Error loading match: $error');
        },
      );
    } catch (e) {
      _showError('Failed to subscribe to match: $e');
    }
  }

  void _submitAnswer(int answerIndex) async {
    if (_hasAnswered || _userId == null || _match == null) return;
    
    final quizService = Provider.of<QuizService>(context, listen: false);
    final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
    
    setState(() {
      _hasAnswered = true;
      _selectedAnswerIndex = answerIndex;
      
      // Check if answer is correct
      MatchQuestion? currentQuestion = _match!.currentQuestion;
      if (currentQuestion != null) {
        _isCorrect = answerIndex == currentQuestion.correctOptionIndex;
      }
    });
    
    // Play sound effect
    if (_isCorrect) {
      _audioPlayer.play(AssetSource('sounds/correct_answer.mp3'));
    } else {
      _audioPlayer.play(AssetSource('sounds/wrong_answer.mp3'));
    }
    
    try {
      // Submit answer to backend
      await quizService.submitAnswer(
        widget.matchId,
        _userId!,
        _currentQuestionIndex,
        answerIndex,
        _timeSpent,
      );
      
      // Log analytics event
      MatchQuestion? currentQuestion = _match!.currentQuestion;
      if (currentQuestion != null) {
        analyticsService.logQuestionAnswered(
          matchId: widget.matchId,
          questionIndex: _currentQuestionIndex,
          isCorrect: _isCorrect,
          timeSpent: _timeSpent,
          score: _isCorrect ? AppConstants.pointsPerCorrectAnswer : 0,
        );
      }
    } catch (e) {
      _showError('Failed to submit answer: $e');
    }
  }

  void _onTimerUpdate(int secondsElapsed) {
    _timeSpent = secondsElapsed;
  }

  void _onTimerComplete() {
    if (!_hasAnswered && _match?.currentQuestion != null) {
      // Auto-submit timeout answer (invalid index)
      _submitAnswer(-1);
    }
  }

  void _navigateToResults(MatchModel match) {
    // Find the player in the match
    MatchPlayer? player;
    bool isWinner = false;
    int score = 0;
    int rank = 0;
    int coinEarned = 0;
    
    if (_userId != null) {
      for (var p in match.players) {
        if (p.userId == _userId) {
          player = p;
          isWinner = p.rank == 1;
          score = p.score;
          rank = p.rank;
          coinEarned = isWinner ? AppConstants.coinsPerWin : 0;
          break;
        }
      }
    }
    
    // Log match end
    final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
    if (match.startedAt != null && match.endedAt != null) {
      int durationSeconds = match.endedAt!.difference(match.startedAt!).inSeconds;
      
      analyticsService.logMatchEnd(
        matchId: widget.matchId,
        playerCount: match.players.length,
        duration: durationSeconds,
        isWinner: isWinner,
        score: score,
        rank: rank,
      );
    }
    
    // Navigate to results screen
    Navigator.of(context).pushReplacementNamed(
      ResultScreen.routeName,
      arguments: {
        'matchId': widget.matchId,
        'isWinner': isWinner,
        'score': score,
        'rank': rank,
        'coinEarned': coinEarned,
      },
    );
  }

  void _showError(String message) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppTheme.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async => false, // Prevent back button
      child: Scaffold(
        body: SafeArea(
          child: _match == null
              ? _buildLoadingView()
              : _buildGameView(),
        ),
      ),
    );
  }

  Widget _buildLoadingView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Loading match...'),
        ],
      ),
    );
  }

  Widget _buildGameView() {
    if (_match == null) return const SizedBox.shrink();
    
    final MatchQuestion? currentQuestion = _match!.currentQuestion;
    final int totalQuestions = _match!.questions.length;
    
    return Column(
      children: [
        // App bar with question counter and timer
        _buildGameAppBar(currentQuestion, totalQuestions),
        
        // Player avatars
        _buildPlayerAvatars(),
        
        // Question card
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: currentQuestion == null
                ? const Center(child: Text('No question available'))
                : QuestionCard(
                    question: currentQuestion.question,
                    options: currentQuestion.options,
                    onAnswerSelected: _submitAnswer,
                    isAnswered: _hasAnswered,
                    selectedAnswerIndex: _selectedAnswerIndex,
                    correctAnswerIndex: _showAnswerFeedback
                        ? currentQuestion.correctOptionIndex
                        : null,
                    isEnabled: !_hasAnswered,
                  ),
          ),
        ),
        
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildGameAppBar(MatchQuestion? currentQuestion, int totalQuestions) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Question counter
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.quiz,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Question ${_currentQuestionIndex + 1}/$totalQuestions',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              // Category chip
              if (currentQuestion != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    currentQuestion.category,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ),
            ],
          ),
          
          const SizedBox(height: 8),
          
          // Timer
          CountdownTimer(
            durationInSeconds: AppConstants.questionTimeLimit,
            onTimerUpdate: _onTimerUpdate,
            onTimerComplete: _onTimerComplete,
            isDisabled: _hasAnswered,
          ),
        ],
      ),
    );
  }

  Widget _buildPlayerAvatars() {
    if (_match == null) return const SizedBox.shrink();
    
    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _match!.players.length,
        itemBuilder: (context, index) {
          final player = _match!.players[index];
          final bool isCurrentUser = player.userId == _userId;
          
          // Check if player has answered current question
          bool hasAnswered = player.answers.containsKey('q$_currentQuestionIndex');
          
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: PlayerAvatar(
              username: player.username,
              avatarUrl: player.avatarUrl,
              score: player.score,
              isCurrentUser: isCurrentUser,
              hasAnswered: hasAnswered,
              isActive: player.isActive,
            ),
          );
        },
      ),
    );
  }
}
