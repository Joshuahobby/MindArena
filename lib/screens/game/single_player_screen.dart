import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:mind_arena/models/question_model.dart';
import 'package:mind_arena/services/quiz_service.dart';
import 'package:mind_arena/widgets/animated_background.dart';
import 'package:mind_arena/widgets/custom_app_bar.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:provider/provider.dart';

class SinglePlayerScreen extends StatefulWidget {
  const SinglePlayerScreen({Key? key}) : super(key: key);

  @override
  _SinglePlayerScreenState createState() => _SinglePlayerScreenState();
}

class _SinglePlayerScreenState extends State<SinglePlayerScreen> with SingleTickerProviderStateMixin {
  final QuizService _quizService = QuizService();
  final PageController _pageController = PageController();
  
  bool _isLoading = true;
  String? _errorMessage;
  List<Question> _questions = [];
  int _currentQuestion = 0;
  int _score = 0;
  List<int?> _userAnswers = [];
  Timer? _timer;
  int _timeLeft = 15; // 15 seconds per question
  bool _isGameOver = false;
  
  // Animation controller
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeIn,
    );

    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    try {
      // Load 5 random questions
      final questions = await _quizService.getRandomQuestions(5);
      
      setState(() {
        _questions = questions;
        _userAnswers = List.filled(questions.length, null);
        _isLoading = false;
      });
      
      _animationController.forward();
      
      // Start the timer for the first question
      _startTimer();
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load questions: $e';
        _isLoading = false;
      });
    }
  }

  void _startTimer() {
    // Reset timer
    setState(() {
      _timeLeft = 15;
    });
    
    // Cancel any existing timer
    _timer?.cancel();
    
    // Start new timer
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          if (_timeLeft > 0) {
            _timeLeft--;
          } else {
            // Time's up for this question
            _timer?.cancel();
            
            // If no answer was selected, mark as incorrect
            if (_userAnswers[_currentQuestion] == null) {
              _userAnswers[_currentQuestion] = -1; // -1 means no answer (timeout)
            }
            
            // Move to next question or end game
            _moveToNextQuestion();
          }
        });
      }
    });
  }

  void _selectAnswer(int answerIndex) {
    if (_userAnswers[_currentQuestion] != null) {
      return; // Already answered
    }
    
    // Cancel the timer
    _timer?.cancel();
    
    // Record the answer
    setState(() {
      _userAnswers[_currentQuestion] = answerIndex;
    });
    
    // Check if correct and update score
    final isCorrect = answerIndex == _questions[_currentQuestion].correctAnswer;
    if (isCorrect) {
      setState(() {
        // Calculate score based on time left (faster answers get more points)
        final timeBonus = _timeLeft / 15; // 15 seconds is the max time
        final questionScore = 100 + (100 * timeBonus).round();
        _score += questionScore;
      });
    }
    
    // Short delay before moving to next question
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) {
        _moveToNextQuestion();
      }
    });
  }

  void _moveToNextQuestion() {
    if (_currentQuestion < _questions.length - 1) {
      // Move to next question
      setState(() {
        _currentQuestion++;
      });
      
      // Animate to next page
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
      
      // Start timer for next question
      _startTimer();
    } else {
      // End of game
      _endGame();
    }
  }

  void _endGame() {
    _timer?.cancel();
    
    setState(() {
      _isGameOver = true;
    });
    
    // Award tokens based on score
    final tokensEarned = (_score / 100).round();
    
    // Update user tokens
    if (tokensEarned > 0) {
      final authService = Provider.of<AuthService>(context, listen: false);
      authService.addTokens(tokensEarned);
    }
  }

  void _playAgain() {
    setState(() {
      _isLoading = true;
      _currentQuestion = 0;
      _score = 0;
      _userAnswers = [];
      _isGameOver = false;
    });
    
    _pageController.jumpToPage(0);
    _loadQuestions();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CustomAppBar(
        title: 'Single Player',
        showBackButton: !_isGameOver && _currentQuestion == 0,
      ),
      body: AnimatedBackground(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Error',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: Colors.red,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _errorMessage!,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: Colors.white,
                              ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                          },
                          child: const Text('Back to Home'),
                        ),
                      ],
                    ),
                  )
                : _isGameOver
                    ? _buildGameOverScreen()
                    : _buildGameScreen(),
      ),
    );
  }

  Widget _buildGameScreen() {
    return SafeArea(
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Column(
          children: [
            // Score and timer
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Score
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16.0,
                      vertical: 8.0,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20.0),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.stars_rounded,
                          color: Colors.amber,
                          size: 24,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Score: $_score',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Timer
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16.0,
                      vertical: 8.0,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20.0),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.timer,
                          color: Colors.white,
                          size: 24,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '$_timeLeft s',
                          style: TextStyle(
                            color: _timeLeft <= 5 ? Colors.red : Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Progress indicator
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                children: List.generate(
                  _questions.length,
                  (index) => Expanded(
                    child: Container(
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 2.0),
                      decoration: BoxDecoration(
                        color: index == _currentQuestion
                            ? Colors.blue
                            : index < _currentQuestion
                                ? Colors.green
                                : Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(3.0),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            
            // Questions PageView
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _questions.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentQuestion = index;
                  });
                },
                itemBuilder: (context, index) {
                  final question = _questions[index];
                  final userAnswer = _userAnswers[index];
                  final hasAnswered = userAnswer != null;
                  
                  return Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Question number
                        Text(
                          'Question ${index + 1}/${_questions.length}',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: Colors.white70,
                              ),
                        ),
                        const SizedBox(height: 8),
                        
                        // Question text
                        Container(
                          padding: const EdgeInsets.all(16.0),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12.0),
                          ),
                          child: Text(
                            question.question,
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        
                        // Answer options
                        Expanded(
                          child: ListView.builder(
                            itemCount: question.answers.length,
                            itemBuilder: (context, answerIndex) {
                              final isSelected = userAnswer == answerIndex;
                              final isCorrect = question.correctAnswer == answerIndex;
                              
                              // Determine card color based on selection and correctness
                              Color cardColor;
                              if (hasAnswered) {
                                if (isSelected && isCorrect) {
                                  cardColor = Colors.green;
                                } else if (isSelected && !isCorrect) {
                                  cardColor = Colors.red;
                                } else if (isCorrect) {
                                  cardColor = Colors.green.withOpacity(0.5);
                                } else {
                                  cardColor = Colors.white.withOpacity(0.1);
                                }
                              } else {
                                cardColor = Colors.white.withOpacity(0.1);
                              }
                              
                              return GestureDetector(
                                onTap: hasAnswered ? null : () => _selectAnswer(answerIndex),
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 12.0),
                                  padding: const EdgeInsets.all(16.0),
                                  decoration: BoxDecoration(
                                    color: cardColor,
                                    borderRadius: BorderRadius.circular(12.0),
                                    border: Border.all(
                                      color: isSelected
                                          ? isCorrect
                                              ? Colors.green
                                              : Colors.red
                                          : Colors.transparent,
                                      width: 2.0,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 32,
                                        height: 32,
                                        decoration: BoxDecoration(
                                          color: hasAnswered
                                              ? isCorrect && (isSelected || answerIndex == question.correctAnswer)
                                                  ? Colors.green
                                                  : isSelected && !isCorrect
                                                      ? Colors.red
                                                      : Colors.white.withOpacity(0.2)
                                              : Colors.white.withOpacity(0.2),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Center(
                                          child: hasAnswered && (isCorrect && (isSelected || answerIndex == question.correctAnswer))
                                              ? const Icon(
                                                  Icons.check,
                                                  color: Colors.white,
                                                  size: 20,
                                                )
                                              : hasAnswered && isSelected && !isCorrect
                                                  ? const Icon(
                                                      Icons.close,
                                                      color: Colors.white,
                                                      size: 20,
                                                    )
                                                  : Text(
                                                      String.fromCharCode(65 + answerIndex), // A, B, C, D
                                                      style: const TextStyle(
                                                        color: Colors.white,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Text(
                                          question.answers[answerIndex],
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 16.0,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGameOverScreen() {
    // Calculate stats
    int correctAnswers = 0;
    int unansweredQuestions = 0;
    
    for (int i = 0; i < _questions.length; i++) {
      if (_userAnswers[i] == _questions[i].correctAnswer) {
        correctAnswers++;
      } else if (_userAnswers[i] == -1 || _userAnswers[i] == null) {
        unansweredQuestions++;
      }
    }
    
    final accuracy = _questions.isEmpty ? 0 : (correctAnswers / _questions.length) * 100;
    final tokensEarned = (_score / 100).round();
    
    // Determine performance message
    String performanceMessage;
    if (accuracy >= 80) {
      performanceMessage = 'Amazing!';
    } else if (accuracy >= 60) {
      performanceMessage = 'Good job!';
    } else if (accuracy >= 40) {
      performanceMessage = 'Nice try!';
    } else {
      performanceMessage = 'Keep practicing!';
    }
    
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Header
            Text(
              'Game Complete',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              performanceMessage,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Colors.amber,
                  ),
            ),
            const SizedBox(height: 32),
            
            // Stats
            Container(
              padding: const EdgeInsets.all(24.0),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16.0),
                border: Border.all(
                  color: Colors.white.withOpacity(0.2),
                  width: 1,
                ),
              ),
              child: Column(
                children: [
                  _buildStatRow(
                    icon: Icons.stars_rounded,
                    color: Colors.amber,
                    label: 'Final Score',
                    value: '$_score',
                  ),
                  const Divider(color: Colors.white24, height: 32),
                  _buildStatRow(
                    icon: Icons.check_circle,
                    color: Colors.green,
                    label: 'Correct Answers',
                    value: '$correctAnswers/${_questions.length}',
                  ),
                  const SizedBox(height: 16),
                  _buildStatRow(
                    icon: Icons.timer_off,
                    color: Colors.orange,
                    label: 'Unanswered',
                    value: '$unansweredQuestions',
                  ),
                  const SizedBox(height: 16),
                  _buildStatRow(
                    icon: Icons.percent,
                    color: Colors.blue,
                    label: 'Accuracy',
                    value: '${accuracy.toStringAsFixed(1)}%',
                  ),
                  const Divider(color: Colors.white24, height: 32),
                  _buildStatRow(
                    icon: Icons.token,
                    color: Colors.purple,
                    label: 'Tokens Earned',
                    value: '+$tokensEarned',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            // Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _playAgain,
                    icon: const Icon(Icons.replay),
                    label: const Text('Play Again'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16.0),
                      textStyle: const TextStyle(
                        fontSize: 16.0,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    icon: const Icon(Icons.home),
                    label: const Text('Home'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[800],
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16.0),
                      textStyle: const TextStyle(
                        fontSize: 16.0,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow({
    required IconData icon,
    required Color color,
    required String label,
    required String value,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(
              icon,
              color: color,
              size: 24,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
              ),
            ),
          ],
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ],
    );
  }
}