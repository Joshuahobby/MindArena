import 'package:flutter/material.dart';
import 'package:mind_arena/models/question_model.dart';
import 'package:mind_arena/services/game_service.dart';
import 'package:mind_arena/utils/app_theme.dart';
import 'package:provider/provider.dart';
import 'dart:async';

class GameScreen extends StatefulWidget {
  const GameScreen({Key? key}) : super(key: key);

  @override
  _GameScreenState createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with TickerProviderStateMixin {
  late AnimationController _questionAnimationController;
  late Animation<double> _questionAnimation;
  
  bool _gameStarted = false;
  bool _showResults = false;
  
  @override
  void initState() {
    super.initState();
    
    _questionAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    
    _questionAnimation = CurvedAnimation(
      parent: _questionAnimationController,
      curve: Curves.easeInOut,
    );
    
    // Set up game service listeners
    final gameService = Provider.of<GameService>(context, listen: false);
    
    gameService.onGameStarted = () {
      setState(() {
        _gameStarted = true;
      });
    };
    
    gameService.onQuestionReceived = (question) {
      _questionAnimationController.forward(from: 0.0);
    };
    
    gameService.onGameEnded = () {
      setState(() {
        _showResults = true;
      });
    };
  }
  
  @override
  void dispose() {
    _questionAnimationController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final gameService = Provider.of<GameService>(context);
    
    if (_showResults) {
      return _buildResultsScreen(gameService);
    }
    
    if (!_gameStarted) {
      return _buildPreparingScreen(gameService);
    }
    
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Quiz Battle'),
            if (gameService.isSinglePlayer)
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.purple.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'BOT MODE',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.purple,
                  ),
                ),
              ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Score display
          _buildScoreBoard(gameService),
          
          // Question content
          Expanded(
            child: FadeTransition(
              opacity: _questionAnimation,
              child: _buildQuestionContent(gameService),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPreparingScreen(GameService gameService) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: AppTheme.backgroundGradient,
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.sports_esports,
                size: 80,
                color: Colors.white,
              ),
              const SizedBox(height: 24),
              
              Text(
                gameService.isSinglePlayer 
                    ? 'Virtual Bot Match' 
                    : 'Quiz Battle',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              
              if (gameService.opponent != null)
                Text(
                  'VS ${gameService.opponent!.username}',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
              const SizedBox(height: 36),
              
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
              const SizedBox(height: 16),
              
              const Text(
                'Preparing your game...',
                style: TextStyle(
                  color: Colors.white70,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildScoreBoard(GameService gameService) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Player score
          Expanded(
            child: Column(
              children: [
                const Text(
                  'YOU',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${gameService.playerScore}',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ),
          
          // VS divider
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'VS',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          
          // Opponent score
          Expanded(
            child: Column(
              children: [
                Text(
                  gameService.opponent?.username?.toUpperCase() ?? 'OPPONENT',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: gameService.isSinglePlayer ? Colors.purple : Colors.red,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${gameService.opponentScore}',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: gameService.isSinglePlayer ? Colors.purple : Colors.red,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildQuestionContent(GameService gameService) {
    final question = gameService.currentQuestion;
    
    if (question == null) {
      return const Center(child: CircularProgressIndicator());
    }
    
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Question number and timer
          Row(
            children: [
              Text(
                'Question ${gameService.currentQuestionIndex + 1}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey,
                ),
              ),
              const Spacer(),
              _buildTimer(gameService),
            ],
          ),
          const SizedBox(height: 16),
          
          // Question text
          Text(
            question.text,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          
          // Answer options
          Expanded(
            child: ListView.builder(
              itemCount: question.answers.length,
              itemBuilder: (context, index) {
                final isSelected = gameService.selectedAnswer == index;
                final isCorrect = gameService.hasSubmittedAnswer && 
                                  question.correctAnswer != null && 
                                  question.correctAnswer == index;
                final isIncorrect = gameService.hasSubmittedAnswer && 
                                   gameService.selectedAnswer == index && 
                                   question.correctAnswer != null && 
                                   question.correctAnswer != index;
                
                Color borderColor = Colors.grey[300]!;
                Color backgroundColor = Colors.white;
                
                if (isSelected && !gameService.hasSubmittedAnswer) {
                  borderColor = AppTheme.primaryColor;
                  backgroundColor = AppTheme.primaryColor.withOpacity(0.1);
                } else if (isCorrect) {
                  borderColor = Colors.green;
                  backgroundColor = Colors.green.withOpacity(0.1);
                } else if (isIncorrect) {
                  borderColor = Colors.red;
                  backgroundColor = Colors.red.withOpacity(0.1);
                }
                
                return GestureDetector(
                  onTap: () {
                    if (!gameService.hasSubmittedAnswer) {
                      gameService.selectAnswer(index);
                    }
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: backgroundColor,
                      border: Border.all(color: borderColor, width: 2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        // Option letter (A, B, C, D)
                        Container(
                          width: 30,
                          height: 30,
                          decoration: BoxDecoration(
                            color: isSelected ? AppTheme.primaryColor : Colors.grey[300],
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              String.fromCharCode(65 + index), // A, B, C, D
                              style: TextStyle(
                                color: isSelected ? Colors.white : Colors.black,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        
                        // Answer text
                        Expanded(
                          child: Text(
                            question.answers[index],
                            style: const TextStyle(
                              fontSize: 16,
                            ),
                          ),
                        ),
                        
                        // Correct/Incorrect icon
                        if (gameService.hasSubmittedAnswer)
                          Icon(
                            isCorrect ? Icons.check_circle : (isIncorrect ? Icons.cancel : null),
                            color: isCorrect ? Colors.green : (isIncorrect ? Colors.red : null),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Submit button
          if (!gameService.hasSubmittedAnswer)
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: gameService.selectedAnswer != null 
                    ? () => gameService.submitAnswer() 
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Submit Answer',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildTimer(GameService gameService) {
    final timeRemaining = gameService.timeRemaining;
    final timeLimit = gameService.currentQuestion?.timeLimit ?? 15;
    final progress = timeRemaining / timeLimit;
    
    Color timerColor = Colors.green;
    if (progress < 0.5) timerColor = Colors.orange;
    if (progress < 0.25) timerColor = Colors.red;
    
    return Row(
      children: [
        const Icon(Icons.timer, size: 18, color: Colors.grey),
        const SizedBox(width: 4),
        Text(
          '${timeRemaining.toInt()}s',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: timerColor,
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 50,
          height: 6,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.grey[300],
              valueColor: AlwaysStoppedAnimation<Color>(timerColor),
            ),
          ),
        ),
      ],
    );
  }
  
  Widget _buildResultsScreen(GameService gameService) {
    final results = gameService.gameResults;
    if (results == null) return const SizedBox();
    
    final isWinner = results['isWinner'] as bool;
    final isDraw = results['isDraw'] as bool;
    final playerScore = results['playerScore'] as int;
    final opponentScore = results['opponentScore'] as int;
    final rewards = results['rewards'] as Map<String, dynamic>;
    final tokens = rewards['tokens'] as int;
    final xp = rewards['xp'] as int;
    
    String resultText = 'IT\'S A DRAW!';
    Color resultColor = Colors.amber;
    IconData resultIcon = Icons.equalizer;
    
    if (isWinner) {
      resultText = 'YOU WIN!';
      resultColor = Colors.green;
      resultIcon = Icons.emoji_events;
    } else if (!isDraw) {
      resultText = 'YOU LOSE';
      resultColor = Colors.red;
      resultIcon = Icons.sentiment_dissatisfied;
    }
    
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: AppTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Result icon
                        Icon(
                          resultIcon,
                          size: 80,
                          color: resultColor,
                        ),
                        const SizedBox(height: 16),
                        
                        // Result text
                        Text(
                          resultText,
                          style: TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                            color: resultColor,
                          ),
                        ),
                        const SizedBox(height: 32),
                        
                        // Scores
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            children: [
                              const Text(
                                'FINAL SCORE',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                children: [
                                  // Player score
                                  Column(
                                    children: [
                                      const Text(
                                        'YOU',
                                        style: TextStyle(
                                          color: Colors.white70,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '$playerScore',
                                        style: const TextStyle(
                                          fontSize: 32,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                  
                                  // VS divider
                                  const Text(
                                    'VS',
                                    style: TextStyle(
                                      color: Colors.white30,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  
                                  // Opponent score
                                  Column(
                                    children: [
                                      Text(
                                        gameService.opponent?.username?.toUpperCase() ?? 'OPPONENT',
                                        style: const TextStyle(
                                          color: Colors.white70,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '$opponentScore',
                                        style: const TextStyle(
                                          fontSize: 32,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),
                        
                        // Rewards
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            children: [
                              const Text(
                                'REWARDS',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                children: [
                                  // Tokens reward
                                  Column(
                                    children: [
                                      const Icon(
                                        Icons.token,
                                        color: Colors.amber,
                                        size: 36,
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        '+$tokens',
                                        style: const TextStyle(
                                          fontSize: 24,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                      const Text(
                                        'TOKENS',
                                        style: TextStyle(
                                          color: Colors.white70,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                  
                                  // XP reward
                                  Column(
                                    children: [
                                      const Icon(
                                        Icons.stars,
                                        color: Colors.lightBlue,
                                        size: 36,
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        '+$xp',
                                        style: const TextStyle(
                                          fontSize: 24,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                      const Text(
                                        'BATTLE PASS XP',
                                        style: TextStyle(
                                          color: Colors.white70,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              
              // Buttons
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    // Play again button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          // Reset game and start a new one of the same type
                          final gameService = Provider.of<GameService>(
                            context, 
                            listen: false,
                          );
                          
                          gameService.resetGame();
                          
                          if (gameService.isSinglePlayer) {
                            gameService.startSinglePlayerGame();
                          } else {
                            gameService.startMatchmaking();
                          }
                          
                          setState(() {
                            _gameStarted = false;
                            _showResults = false;
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text(
                          'Play Again',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    // Return to dashboard button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: TextButton(
                        onPressed: () {
                          // Reset game and return to dashboard
                          final gameService = Provider.of<GameService>(
                            context, 
                            listen: false,
                          );
                          gameService.resetGame();
                          Navigator.pop(context);
                        },
                        style: TextButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text(
                          'Return to Dashboard',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white70,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}