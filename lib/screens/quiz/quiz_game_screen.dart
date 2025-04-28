import 'package:flutter/material.dart';
import 'dart:async';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/models/quiz_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/services/quiz_service.dart';
import 'package:mind_arena/screens/quiz/quiz_result_screen.dart';
import 'package:mind_arena/widgets/loading_overlay.dart';

class QuizGameScreen extends StatefulWidget {
  final String mode;
  final String? category;
  final User? user;

  const QuizGameScreen({
    Key? key,
    required this.mode,
    this.category,
    this.user,
  }) : super(key: key);

  @override
  _QuizGameScreenState createState() => _QuizGameScreenState();
}

class _QuizGameScreenState extends State<QuizGameScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  bool _isGameStarted = false;
  List<Question> _questions = [];
  int _currentQuestionIndex = 0;
  int _score = 0;
  int _correctAnswers = 0;
  List<int?> _userAnswers = [];
  List<int> _timeTaken = [];
  
  // Timer
  late AnimationController _timerController;
  late Animation<double> _timerAnimation;
  Timer? _timer;
  int _timeRemaining = 15; // 15 seconds per question
  
  @override
  void initState() {
    super.initState();
    _timerController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 15),
    );
    _timerAnimation = Tween<double>(begin: 1.0, end: 0.0).animate(_timerController);
    
    _timerController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _onAnswerSelected(null);
      }
    });
    
    _loadQuestions();
  }
  
  @override
  void dispose() {
    _timer?.cancel();
    _timerController.dispose();
    super.dispose();
  }
  
  Future<void> _loadQuestions() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      final quizService = QuizService();
      
      // Load questions based on mode and category
      String difficultyLevel = 'medium';
      int questionCount = 10;
      
      if (widget.mode == 'practice') {
        difficultyLevel = 'easy';
      } else if (widget.mode == 'ranked') {
        difficultyLevel = 'hard';
      }
      
      _questions = await quizService.getQuestions(
        count: questionCount,
        category: widget.category,
        difficulty: difficultyLevel,
      );
      
      // Initialize user answers array
      _userAnswers = List.filled(_questions.length, null);
      _timeTaken = List.filled(_questions.length, 0);
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading questions: $e');
      setState(() {
        _isLoading = false;
        _questions = [];
      });
      
      // Show error dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('Error'),
          content: Text('Failed to load questions: $e'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Return to previous screen
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
  }
  
  void _startGame() {
    setState(() {
      _isGameStarted = true;
    });
    
    _startTimer();
  }
  
  void _startTimer() {
    _timeRemaining = 15;
    _timerController.reset();
    _timerController.forward();
    
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        if (_timeRemaining > 0) {
          _timeRemaining--;
        } else {
          _timer?.cancel();
        }
      });
    });
  }
  
  void _onAnswerSelected(int? answerIndex) {
    _timer?.cancel();
    _timerController.stop();
    
    final currentQuestion = _questions[_currentQuestionIndex];
    final isCorrect = answerIndex == currentQuestion.correctAnswerIndex;
    
    setState(() {
      _userAnswers[_currentQuestionIndex] = answerIndex;
      _timeTaken[_currentQuestionIndex] = 15 - _timeRemaining;
      
      if (isCorrect) {
        _correctAnswers++;
        
        // Calculate score based on time taken
        // Faster answers get more points
        final timeBonus = (_timeRemaining / 15) * 50;
        _score += 50 + timeBonus.round();
      }
    });
    
    // Wait for feedback before moving to next question
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (_currentQuestionIndex < _questions.length - 1) {
        setState(() {
          _currentQuestionIndex++;
        });
        _startTimer();
      } else {
        // Game finished
        _finishGame();
      }
    });
  }
  
  void _finishGame() {
    // Calculate final statistics
    final totalTimeTaken = _timeTaken.reduce((a, b) => a + b);
    final averageTimePerQuestion = totalTimeTaken / _questions.length;
    final accuracy = (_correctAnswers / _questions.length) * 100;
    
    // Navigate to results screen
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => QuizResultScreen(
          mode: widget.mode,
          category: widget.category,
          score: _score,
          correctAnswers: _correctAnswers,
          totalQuestions: _questions.length,
          averageTime: averageTimePerQuestion,
          accuracy: accuracy,
          user: widget.user,
        ),
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return LoadingOverlay(
      isLoading: _isLoading,
      child: Scaffold(
        body: Container(
          decoration: BoxDecoration(
            gradient: AppTheme.backgroundGradient,
          ),
          child: SafeArea(
            child: _questions.isEmpty
                ? _buildErrorView()
                : !_isGameStarted
                    ? _buildStartGameView()
                    : _buildGameView(),
          ),
        ),
      ),
    );
  }
  
  Widget _buildErrorView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 64,
            color: Colors.red,
          ),
          const SizedBox(height: 16),
          const Text(
            'Failed to load questions',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Please try again later',
            style: TextStyle(
              color: AppTheme.secondaryTextColor,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('GO BACK'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildStartGameView() {
    String modeTitle = 'Quiz Game';
    String modeDescription = 'Test your knowledge!';
    Color modeColor = AppTheme.primaryColor;
    IconData modeIcon = Icons.quiz;
    
    // Set mode details
    switch (widget.mode) {
      case 'quick_play':
        modeTitle = 'Quick Play';
        modeDescription = 'Answer 10 random questions as quickly as possible';
        modeColor = Colors.blue;
        modeIcon = Icons.flash_on;
        break;
      case 'ranked':
        modeTitle = 'Ranked Match';
        modeDescription = 'Compete against others to climb the leaderboard';
        modeColor = Colors.purple;
        modeIcon = Icons.leaderboard;
        break;
      case 'practice':
        modeTitle = 'Practice Mode';
        modeDescription = 'Improve your skills without affecting your rank';
        modeColor = Colors.green;
        modeIcon = Icons.school;
        break;
      case 'daily_challenge':
        modeTitle = 'Daily Challenge';
        modeDescription = 'Complete today\'s challenge for bonus rewards';
        modeColor = Colors.amber;
        modeIcon = Icons.calendar_today;
        break;
      case 'weekend_challenge':
        modeTitle = 'Weekend Challenge';
        modeDescription = 'Special weekend event with exclusive rewards';
        modeColor = Colors.deepPurple;
        modeIcon = Icons.star;
        break;
      case 'time_attack':
        modeTitle = 'Time Attack';
        modeDescription = 'Answer as many questions as you can in 2 minutes';
        modeColor = Colors.orange;
        modeIcon = Icons.timer;
        break;
    }
    
    // Add category if specified
    if (widget.category != null) {
      String categoryName = '';
      switch (widget.category) {
        case 'general':
          categoryName = 'General Knowledge';
          break;
        case 'science':
          categoryName = 'Science';
          break;
        case 'history':
          categoryName = 'History';
          break;
        case 'geography':
          categoryName = 'Geography';
          break;
        case 'entertainment':
          categoryName = 'Entertainment';
          break;
        case 'sports':
          categoryName = 'Sports';
          break;
      }
      modeTitle += ': $categoryName';
    }
    
    return Column(
      children: [
        // App Bar
        AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(modeTitle),
        ),
        
        Expanded(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Mode Icon
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: modeColor.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      modeIcon,
                      color: modeColor,
                      size: 64,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Mode Title
                  Text(
                    modeTitle,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  
                  // Mode Description
                  Text(
                    modeDescription,
                    style: const TextStyle(
                      fontSize: 16,
                      color: AppTheme.secondaryTextColor,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  
                  // Number of Questions
                  Text(
                    '${_questions.length} Questions',
                    style: const TextStyle(
                      fontSize: 18,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  // Time Limit
                  Text(
                    '15 seconds per question',
                    style: const TextStyle(
                      fontSize: 16,
                      color: AppTheme.secondaryTextColor,
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Start Button
                  SizedBox(
                    width: 200,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _startGame,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: modeColor,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                      ),
                      child: const Text(
                        'START GAME',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
  
  Widget _buildGameView() {
    if (_currentQuestionIndex >= _questions.length) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Calculating results...'),
          ],
        ),
      );
    }
    
    final currentQuestion = _questions[_currentQuestionIndex];
    final userAnswer = _userAnswers[_currentQuestionIndex];
    final bool hasAnswered = userAnswer != null;
    
    return Column(
      children: [
        // Progress and Timer Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: AppTheme.backgroundColor,
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
              // Question Progress
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Question Counter
                  Text(
                    'Question ${_currentQuestionIndex + 1}/${_questions.length}',
                    style: const TextStyle(
                      color: AppTheme.secondaryTextColor,
                    ),
                  ),
                  
                  // Score
                  Row(
                    children: [
                      const Icon(
                        Icons.star,
                        color: Colors.amber,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Score: $_score',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              
              // Timer Bar
              Stack(
                children: [
                  // Background
                  Container(
                    height: 8,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade800,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  
                  // Progress
                  AnimatedBuilder(
                    animation: _timerAnimation,
                    builder: (context, child) {
                      return FractionallySizedBox(
                        widthFactor: _timerAnimation.value,
                        child: Container(
                          height: 8,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                _timeRemaining > 5 ? Colors.green : Colors.red,
                                _timeRemaining > 5 ? Colors.lightGreen : Colors.redAccent,
                              ],
                            ),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
              
              // Timer Value
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    '$_timeRemaining sec',
                    style: TextStyle(
                      color: _timeRemaining > 5
                          ? Colors.green
                          : Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // Question and Answers
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Question
                Text(
                  currentQuestion.text,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),
                
                // Answers
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: currentQuestion.answers.length,
                  itemBuilder: (context, index) {
                    bool isSelected = userAnswer == index;
                    bool isCorrect = index == currentQuestion.correctAnswerIndex;
                    
                    Color backgroundColor;
                    Color borderColor;
                    
                    if (hasAnswered) {
                      if (isCorrect) {
                        backgroundColor = Colors.green.withOpacity(0.2);
                        borderColor = Colors.green;
                      } else if (isSelected) {
                        backgroundColor = Colors.red.withOpacity(0.2);
                        borderColor = Colors.red;
                      } else {
                        backgroundColor = AppTheme.cardColor;
                        borderColor = Colors.transparent;
                      }
                    } else {
                      backgroundColor = AppTheme.cardColor;
                      borderColor = Colors.transparent;
                    }
                    
                    return GestureDetector(
                      onTap: hasAnswered ? null : () => _onAnswerSelected(index),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: backgroundColor,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: borderColor,
                            width: borderColor != Colors.transparent ? 2 : 0,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: hasAnswered && isCorrect
                                    ? Colors.green
                                    : hasAnswered && isSelected
                                        ? Colors.red
                                        : AppTheme.primaryColor,
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: hasAnswered
                                  ? Icon(
                                      isCorrect
                                          ? Icons.check
                                          : isSelected
                                              ? Icons.close
                                              : null,
                                      color: Colors.white,
                                      size: 18,
                                    )
                                  : Text(
                                      String.fromCharCode(65 + index), // A, B, C, D
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Text(
                                currentQuestion.answers[index],
                                style: TextStyle(
                                  color: hasAnswered && (isCorrect || isSelected)
                                      ? isCorrect
                                          ? Colors.green
                                          : Colors.red
                                      : Colors.white,
                                  fontWeight: hasAnswered && isCorrect
                                      ? FontWeight.bold
                                      : FontWeight.normal,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}