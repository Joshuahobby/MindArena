import 'package:flutter/material.dart';
import 'dart:async';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/models/question_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/widgets/loading_overlay.dart';

class QuickMatchScreen extends StatefulWidget {
  final User? user;
  final QuestionCategory? category;
  final String difficulty;

  const QuickMatchScreen({
    Key? key,
    this.user,
    this.category,
    required this.difficulty,
  }) : super(key: key);

  @override
  _QuickMatchScreenState createState() => _QuickMatchScreenState();
}

class _QuickMatchScreenState extends State<QuickMatchScreen> with TickerProviderStateMixin {
  bool _isLoading = true;
  bool _isMatchmaking = true;
  bool _matchStarted = false;
  bool _matchEnded = false;
  int _matchmakingSeconds = 0;
  int _playerCount = 1; // Start with yourself
  Timer? _matchmakingTimer;
  Timer? _gameTimer;
  int _currentQuestionIndex = 0;
  List<Question> _questions = [];
  
  // Simulated players for demo
  final List<String> _playerNames = [
    'QuizMaster',
    'BrainWhiz',
    'TriviaKing',
    'KnowledgeGuru',
  ];
  
  // Players in match
  List<Map<String, dynamic>> _players = [];
  
  // Match stats
  int _correctAnswers = 0;
  int _totalScore = 0;
  int _secondsRemaining = 10; // 10 seconds per question
  Map<String, int> _playerScores = {};
  
  // Animation controllers
  late AnimationController _questionAnimationController;
  late Animation<double> _questionAnimation;

  @override
  void initState() {
    super.initState();
    
    // Initialize animations
    _questionAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _questionAnimation = CurvedAnimation(
      parent: _questionAnimationController,
      curve: Curves.easeInOut,
    );
    
    // Start matchmaking
    _startMatchmaking();
  }

  @override
  void dispose() {
    _matchmakingTimer?.cancel();
    _gameTimer?.cancel();
    _questionAnimationController.dispose();
    super.dispose();
  }

  void _startMatchmaking() {
    // Simulate matchmaking
    _matchmakingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _matchmakingSeconds++;
        
        // Add a random player every 2-3 seconds, up to 4 players total
        if (_matchmakingSeconds % 2 == 0 && _playerCount < 4 && _matchmakingSeconds <= 6) {
          _playerCount++;
        }
        
        // Start the match after 5 seconds
        if (_matchmakingSeconds >= 5) {
          _isMatchmaking = false;
          timer.cancel();
          _setupMatch();
        }
      });
    });
  }

  void _setupMatch() {
    // Create simulated players for the match
    _players = [
      {
        'id': 'player_0',
        'name': widget.user?.displayName ?? widget.user?.username ?? 'You',
        'isCurrentUser': true,
        'avatar': widget.user?.avatarUrl ?? 'https://ui-avatars.com/api/?name=You',
        'score': 0,
      }
    ];
    
    // Add random players
    for (int i = 1; i < _playerCount; i++) {
      _players.add({
        'id': 'player_$i',
        'name': _playerNames[i - 1],
        'isCurrentUser': false,
        'avatar': 'https://ui-avatars.com/api/?name=${_playerNames[i - 1]}',
        'score': 0,
      });
    }
    
    // Initialize player scores
    for (var player in _players) {
      _playerScores[player['id']] = 0;
    }
    
    // Create mock questions
    _createMockQuestions();
    
    setState(() {
      _isLoading = false;
    });
    
    // Start the match after a short delay
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        _matchStarted = true;
      });
      _startQuestion();
    });
  }
  
  void _createMockQuestions() {
    // Sample questions for demo purposes
    final List<Map<String, dynamic>> mockQuestions = [
      {
        'id': 1,
        'category_id': 1,
        'question_text': 'What is the capital of France?',
        'difficulty': 1,
        'category_name': 'Geography',
        'answers': [
          {'id': 1, 'answer_text': 'Paris', 'is_correct': true},
          {'id': 2, 'answer_text': 'London', 'is_correct': false},
          {'id': 3, 'answer_text': 'Berlin', 'is_correct': false},
          {'id': 4, 'answer_text': 'Rome', 'is_correct': false},
        ],
      },
      {
        'id': 2,
        'category_id': 2,
        'question_text': 'Which planet is known as the Red Planet?',
        'difficulty': 1,
        'category_name': 'Science',
        'answers': [
          {'id': 5, 'answer_text': 'Venus', 'is_correct': false},
          {'id': 6, 'answer_text': 'Mars', 'is_correct': true},
          {'id': 7, 'answer_text': 'Jupiter', 'is_correct': false},
          {'id': 8, 'answer_text': 'Saturn', 'is_correct': false},
        ],
      },
      {
        'id': 3,
        'category_id': 3,
        'question_text': 'Who painted the Mona Lisa?',
        'difficulty': 2,
        'category_name': 'Art',
        'answers': [
          {'id': 9, 'answer_text': 'Vincent van Gogh', 'is_correct': false},
          {'id': 10, 'answer_text': 'Pablo Picasso', 'is_correct': false},
          {'id': 11, 'answer_text': 'Leonardo da Vinci', 'is_correct': true},
          {'id': 12, 'answer_text': 'Michelangelo', 'is_correct': false},
        ],
      },
      {
        'id': 4,
        'category_id': 4,
        'question_text': 'Which country won the FIFA World Cup in 2018?',
        'difficulty': 2,
        'category_name': 'Sports',
        'answers': [
          {'id': 13, 'answer_text': 'Brazil', 'is_correct': false},
          {'id': 14, 'answer_text': 'Germany', 'is_correct': false},
          {'id': 15, 'answer_text': 'Argentina', 'is_correct': false},
          {'id': 16, 'answer_text': 'France', 'is_correct': true},
        ],
      },
      {
        'id': 5,
        'category_id': 5,
        'question_text': 'What is the largest mammal in the world?',
        'difficulty': 1,
        'category_name': 'Science',
        'answers': [
          {'id': 17, 'answer_text': 'Elephant', 'is_correct': false},
          {'id': 18, 'answer_text': 'Blue Whale', 'is_correct': true},
          {'id': 19, 'answer_text': 'Giraffe', 'is_correct': false},
          {'id': 20, 'answer_text': 'Hippopotamus', 'is_correct': false},
        ],
      },
    ];
    
    // Convert to Question objects
    _questions = mockQuestions.map((q) => Question.fromMap(q)).toList();
  }

  void _startQuestion() {
    _secondsRemaining = 10;
    _questionAnimationController.reset();
    _questionAnimationController.forward();
    
    // Start timer for the question
    _gameTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        setState(() {
          _secondsRemaining--;
        });
        
        // Simulate other players answering
        _simulatePlayerAnswers();
      } else {
        timer.cancel();
        _moveToNextQuestion();
      }
    });
  }
  
  void _simulatePlayerAnswers() {
    // Each player has a random chance to answer each second
    for (var player in _players) {
      if (!player['isCurrentUser'] && !player['answered'] && _secondsRemaining > 0) {
        // 30% chance to answer each second
        if (DateTime.now().millisecondsSinceEpoch % 3 == 0) {
          // 70% chance to get it right (for demo purposes)
          final bool correct = DateTime.now().millisecondsSinceEpoch % 10 < 7;
          final int points = correct ? _calculatePoints(_secondsRemaining) : 0;
          
          setState(() {
            player['answered'] = true;
            player['correct'] = correct;
            player['score'] += points;
            _playerScores[player['id']] = (_playerScores[player['id']] ?? 0) + points;
          });
        }
      }
    }
  }
  
  int _calculatePoints(int secondsLeft) {
    // Points calculation: more time left = more points
    return 800 + (secondsLeft * 20);
  }

  void _answerQuestion(int answerIndex) {
    if (_gameTimer != null) {
      _gameTimer!.cancel();
    }
    
    final question = _questions[_currentQuestionIndex];
    final answer = question.answers[answerIndex];
    final isCorrect = answer.isCorrect;
    final points = isCorrect ? _calculatePoints(_secondsRemaining) : 0;
    
    // Update player stats
    setState(() {
      final currentPlayer = _players.firstWhere((p) => p['isCurrentUser']);
      currentPlayer['answered'] = true;
      currentPlayer['correct'] = isCorrect;
      currentPlayer['score'] += points;
      _playerScores[currentPlayer['id']] = (_playerScores[currentPlayer['id']] ?? 0) + points;
      
      if (isCorrect) {
        _correctAnswers++;
        _totalScore += points;
      }
    });
    
    // Short delay before moving to next question
    Future.delayed(const Duration(milliseconds: 1500), () {
      _moveToNextQuestion();
    });
  }

  void _moveToNextQuestion() {
    // Reset player answered status
    for (var player in _players) {
      player['answered'] = false;
      player['correct'] = null;
    }
    
    if (_currentQuestionIndex < _questions.length - 1) {
      setState(() {
        _currentQuestionIndex++;
      });
      _startQuestion();
    } else {
      // End of game
      setState(() {
        _matchEnded = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        // Show confirmation dialog before leaving
        if (_matchStarted && !_matchEnded) {
          return await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Leave Match?'),
                  content: const Text('Are you sure you want to leave the match? You will lose any progress.'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      child: const Text('STAY'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(true),
                      child: const Text('LEAVE'),
                    ),
                  ],
                ),
              ) ??
              false;
        }
        return true;
      },
      child: Scaffold(
        appBar: _matchStarted && !_matchEnded
            ? null // Hide app bar during game
            : AppBar(
                title: Text(_isMatchmaking ? 'Finding Players...' : 'Match Results'),
                backgroundColor: AppTheme.backgroundColor,
                elevation: 0,
              ),
        body: LoadingOverlay(
          isLoading: _isLoading,
          child: Container(
            decoration: BoxDecoration(
              gradient: AppTheme.backgroundGradient,
            ),
            child: _buildContent(),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isMatchmaking) {
      return _buildMatchmakingScreen();
    } else if (_matchStarted && !_matchEnded) {
      return _buildGameScreen();
    } else if (_matchEnded) {
      return _buildResultsScreen();
    } else {
      return _buildLobbyScreen();
    }
  }

  Widget _buildMatchmakingScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 24),
          Text(
            'Finding Opponents...',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Players found: $_playerCount',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 24),
          Text(
            widget.category != null
                ? 'Category: ${widget.category!.name}'
                : 'Categories: All',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          Text(
            'Difficulty: ${widget.difficulty}',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildLobbyScreen() {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Game info
                Card(
                  color: AppTheme.cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Match Details',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 16),
                        _buildGameInfoRow('Category', widget.category?.name ?? 'All Categories'),
                        const SizedBox(height: 8),
                        _buildGameInfoRow('Difficulty', widget.difficulty),
                        const SizedBox(height: 8),
                        _buildGameInfoRow('Questions', '${_questions.length}'),
                        const SizedBox(height: 8),
                        _buildGameInfoRow('Players', '$_playerCount'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                
                // Players
                Card(
                  color: AppTheme.cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Players',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 16),
                        ...List.generate(_players.length, (index) {
                          final player = _players[index];
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundColor: player['isCurrentUser']
                                  ? AppTheme.primaryColor
                                  : Colors.grey.shade700,
                              child: Text(
                                player['name'][0],
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                            title: Text(
                              player['name'],
                              style: TextStyle(
                                color: player['isCurrentUser']
                                    ? AppTheme.primaryColor
                                    : Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            trailing: player['isCurrentUser']
                                ? const Chip(
                                    label: Text('YOU'),
                                    backgroundColor: AppTheme.primaryColor,
                                    labelStyle: TextStyle(color: Colors.white),
                                  )
                                : null,
                          );
                        }),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        
        // Start button
        Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton(
            onPressed: () {
              setState(() {
                _matchStarted = true;
              });
              _startQuestion();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              padding: const EdgeInsets.symmetric(vertical: 16),
              minimumSize: const Size(double.infinity, 0),
            ),
            child: const Text(
              'START MATCH',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGameScreen() {
    final question = _questions[_currentQuestionIndex];
    
    return Column(
      children: [
        // Top bar with timer and question counter
        Container(
          padding: const EdgeInsets.fromLTRB(16, 40, 16, 8),
          color: AppTheme.backgroundColor,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Question counter
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.cardColor,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  'Question ${_currentQuestionIndex + 1}/${_questions.length}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              
              // Timer
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _getTimerColor(),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.timer, color: Colors.white, size: 18),
                    const SizedBox(width: 4),
                    Text(
                      '$_secondsRemaining',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        
        // Question and answers
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 24),
                
                // Category
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      question.categoryName ?? 'General',
                      style: TextStyle(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Question text
                FadeTransition(
                  opacity: _questionAnimation,
                  child: Card(
                    color: AppTheme.cardColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        question.questionText,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                
                // Answer options
                ...List.generate(question.answers.length, (index) {
                  final answer = question.answers[index];
                  final player = _players.firstWhere((p) => p['isCurrentUser']);
                  final hasAnswered = player['answered'] == true;
                  final isCorrect = answer.isCorrect;
                  
                  // Determine button color based on state
                  Color buttonColor = AppTheme.cardColor;
                  if (hasAnswered) {
                    if (isCorrect) {
                      buttonColor = AppTheme.correctAnswerColor;
                    } else if (player['correct'] == false && player['answerIndex'] == index) {
                      buttonColor = AppTheme.incorrectAnswerColor;
                    }
                  }
                  
                  return FadeTransition(
                    opacity: _questionAnimation,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: ElevatedButton(
                        onPressed: hasAnswered
                            ? null
                            : () {
                                setState(() {
                                  player['answerIndex'] = index;
                                });
                                _answerQuestion(index);
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: buttonColor,
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 30,
                              height: 30,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                String.fromCharCode(65 + index), // A, B, C, D
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                answer.answerText,
                                style: const TextStyle(
                                  fontSize: 16,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
        
        // Bottom bar with player scores
        Container(
          padding: const EdgeInsets.all(16),
          color: AppTheme.backgroundColor,
          child: Column(
            children: [
              const Text(
                'SCORES',
                style: TextStyle(
                  color: AppTheme.secondaryTextColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _players.map((player) {
                    final bool hasAnswered = player['answered'] == true;
                    final bool? isCorrect = player['correct'];
                    
                    return Container(
                      margin: const EdgeInsets.only(right: 12),
                      child: Column(
                        children: [
                          Stack(
                            alignment: Alignment.bottomRight,
                            children: [
                              CircleAvatar(
                                radius: 20,
                                backgroundColor: player['isCurrentUser']
                                    ? AppTheme.primaryColor
                                    : Colors.grey.shade700,
                                child: Text(
                                  player['name'][0],
                                  style: const TextStyle(color: Colors.white),
                                ),
                              ),
                              if (hasAnswered)
                                Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: BoxDecoration(
                                    color: isCorrect == true
                                        ? AppTheme.correctAnswerColor
                                        : AppTheme.incorrectAnswerColor,
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    isCorrect == true ? Icons.check : Icons.close,
                                    size: 12,
                                    color: Colors.white,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            player['name'],
                            style: TextStyle(
                              color: player['isCurrentUser']
                                  ? AppTheme.primaryColor
                                  : Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            '${player['score']}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildResultsScreen() {
    // Sort players by score
    final List<Map<String, dynamic>> sortedPlayers = List.from(_players)
      ..sort((a, b) => (b['score'] as int).compareTo(a['score'] as int));
    
    // Get current user rank
    final int currentUserRank =
        sortedPlayers.indexWhere((player) => player['isCurrentUser']) + 1;
    
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Match Results Title
                Card(
                  color: AppTheme.primaryColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Text(
                          'MATCH COMPLETED',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          currentUserRank == 1
                              ? '🎉 You Won! 🎉'
                              : 'You placed #$currentUserRank',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                
                // Your Stats
                Card(
                  color: AppTheme.cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Your Stats',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 16),
                        _buildStatsRow('Total Score', '$_totalScore points'),
                        const SizedBox(height: 8),
                        _buildStatsRow('Correct Answers', '$_correctAnswers/${_questions.length}'),
                        const SizedBox(height: 8),
                        _buildStatsRow('Accuracy', '${(_correctAnswers / _questions.length * 100).round()}%'),
                        const SizedBox(height: 8),
                        _buildStatsRow('Experience Gained', '+${_totalScore ~/ 10} XP'),
                        const SizedBox(height: 8),
                        _buildStatsRow('Coins Earned', '+${(_totalScore ~/ 10) + (currentUserRank == 1 ? 50 : 0)}'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                
                // Leaderboard
                Card(
                  color: AppTheme.cardColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Leaderboard',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 16),
                        ...List.generate(sortedPlayers.length, (index) {
                          final player = sortedPlayers[index];
                          final isCurrentUser = player['isCurrentUser'];
                          
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isCurrentUser
                                  ? AppTheme.primaryColor.withOpacity(0.2)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isCurrentUser
                                    ? AppTheme.primaryColor
                                    : Colors.transparent,
                              ),
                            ),
                            child: Row(
                              children: [
                                // Rank
                                Container(
                                  width: 30,
                                  height: 30,
                                  decoration: BoxDecoration(
                                    color: index == 0
                                        ? Colors.amber
                                        : index == 1
                                            ? Colors.grey.shade300
                                            : index == 2
                                                ? Colors.brown.shade300
                                                : AppTheme.backgroundColor,
                                    shape: BoxShape.circle,
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    '#${index + 1}',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: index < 3
                                          ? Colors.black
                                          : Colors.white,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                
                                // Avatar
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: isCurrentUser
                                      ? AppTheme.primaryColor
                                      : Colors.grey.shade700,
                                  child: Text(
                                    player['name'][0],
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                
                                // Name and score
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        player['name'],
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: isCurrentUser
                                              ? AppTheme.primaryColor
                                              : Colors.white,
                                        ),
                                      ),
                                      Text(
                                        '${player['score']} points',
                                        style: TextStyle(
                                          color: isCurrentUser
                                              ? AppTheme.primaryColor
                                              : AppTheme.secondaryTextColor,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                
                                // Badge for winner
                                if (index == 0)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.amber,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(Icons.emoji_events, size: 14, color: Colors.black),
                                        SizedBox(width: 4),
                                        Text(
                                          'WINNER',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: Colors.black,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        
        // Buttons
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('EXIT'),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (context) => QuickMatchScreen(
                          user: widget.user,
                          category: widget.category,
                          difficulty: widget.difficulty,
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('PLAY AGAIN'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGameInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppTheme.secondaryTextColor),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildStatsRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppTheme.secondaryTextColor),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Color _getTimerColor() {
    if (_secondsRemaining <= 3) {
      return AppTheme.timerDangerColor;
    } else if (_secondsRemaining <= 5) {
      return AppTheme.timerWarningColor;
    } else {
      return AppTheme.primaryColor;
    }
  }
}