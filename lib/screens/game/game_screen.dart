import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mind_arena/services/game_service.dart';
import 'package:provider/provider.dart';

class GameScreen extends StatefulWidget {
  final bool isSinglePlayer;
  
  const GameScreen({Key? key, this.isSinglePlayer = false}) : super(key: key);

  @override
  _GameScreenState createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  Timer? _timer;
  int _timeRemaining = 15;
  bool _isAnswerSubmitted = false;
  
  @override
  void initState() {
    super.initState();
    _startTimer();
  }
  
  @override
  void dispose() {
    _stopTimer();
    super.dispose();
  }
  
  void _startTimer() {
    final gameService = Provider.of<GameService>(context, listen: false);
    final gameState = gameService.gameState;
    
    if (gameState == null || gameState.currentQuestion == null) return;
    
    setState(() {
      _timeRemaining = gameState.currentQuestion!.timeLimit;
    });
    
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_timeRemaining > 0) {
        setState(() {
          _timeRemaining--;
        });
      } else {
        _stopTimer();
        
        // If time runs out and no answer was selected, consider it a miss
        if (!_isAnswerSubmitted) {
          // Automatically select no answer (timeout)
          gameService.selectAnswer(-1);
          setState(() {
            _isAnswerSubmitted = true;
          });
        }
      }
    });
  }
  
  void _stopTimer() {
    if (_timer != null) {
      _timer!.cancel();
      _timer = null;
    }
  }
  
  void _selectAnswer(int index) {
    if (_isAnswerSubmitted) return;
    
    final gameService = Provider.of<GameService>(context, listen: false);
    
    setState(() {
      _isAnswerSubmitted = true;
    });
    
    _stopTimer();
    gameService.selectAnswer(index);
  }
  
  void _goToNextQuestion() {
    final gameService = Provider.of<GameService>(context, listen: false);
    
    setState(() {
      _isAnswerSubmitted = false;
    });
    
    gameService.nextQuestion();
    _startTimer();
  }
  
  void _returnToDashboard() {
    Navigator.of(context).pop();
  }
  
  @override
  Widget build(BuildContext context) {
    final gameService = Provider.of<GameService>(context);
    final gameState = gameService.gameState;
    
    if (gameState == null) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
    
    if (gameState.isGameOver) {
      return _buildGameOverScreen(gameState);
    }
    
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isSinglePlayer ? 'Single Player Game' : 'Quick Match'),
        actions: [
          // Score display
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                const Icon(Icons.person, color: Colors.blue),
                const SizedBox(width: 4),
                Text(
                  '${gameState.myScore}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(width: 16),
                Icon(Icons.computer, color: Colors.red),
                const SizedBox(width: 4),
                Text(
                  '${gameState.opponentScore}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: gameState.currentQuestion == null
          ? const Center(child: CircularProgressIndicator())
          : _buildGameContent(gameState),
    );
  }
  
  Widget _buildGameContent(GameState gameState) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Progress and timer
          Row(
            children: [
              // Question progress
              Text(
                'Question ${gameState.currentQuestionIndex + 1}/${gameState.questions?.length ?? 5}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
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
                      '$_timeRemaining',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Question text
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  spreadRadius: 1,
                  blurRadius: 3,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              gameState.currentQuestion?.text ?? '',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Answer options
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 1.5,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemCount: gameState.currentQuestion?.answers.length ?? 0,
              itemBuilder: (context, index) {
                final isSelected = gameState.selectedAnswerIndex == index;
                final isCorrect = gameState.correctAnswerIndex == index;
                final isWrong = isSelected && !isCorrect && gameState.correctAnswerIndex != null;
                
                return GestureDetector(
                  onTap: () => _selectAnswer(index),
                  child: Container(
                    decoration: BoxDecoration(
                      color: _getAnswerColor(isSelected, isCorrect, isWrong),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? Colors.blue.shade700 : Colors.grey.shade300,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Center(
                      child: Text(
                        gameState.currentQuestion?.answers[index] ?? '',
                        style: TextStyle(
                          color: _getAnswerTextColor(isSelected, isCorrect, isWrong),
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Next question button (shown after answering)
          if (_isAnswerSubmitted)
            ElevatedButton(
              onPressed: gameState.canProceedToNextQuestion ? _goToNextQuestion : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                gameState.isLastQuestion ? 'Finish Quiz' : 'Next Question',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
            
          // Bottom info bar - opponent status
          if (widget.isSinglePlayer)
            Container(
              margin: const EdgeInsets.only(top: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.computer, color: Colors.blue),
                  const SizedBox(width: 8),
                  Text(
                    'Playing against ${gameState.opponentName}',
                    style: TextStyle(
                      color: Colors.grey.shade700,
                    ),
                  ),
                  Container(
                    margin: const EdgeInsets.only(left: 8),
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildGameOverScreen(GameState gameState) {
    final isWinner = gameState.isWinner;
    
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Result icon
            Icon(
              isWinner ? Icons.emoji_events : Icons.sentiment_dissatisfied,
              size: 80,
              color: isWinner ? Colors.amber : Colors.blue,
            ),
            
            const SizedBox(height: 24),
            
            // Result text
            Text(
              isWinner ? 'Victory!' : 'You Lost',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: isWinner ? Colors.amber.shade800 : Colors.blue,
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Score display
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.2),
                    spreadRadius: 1,
                    blurRadius: 5,
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'You:',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${gameState.myScore}',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue,
                        ),
                      ),
                      const SizedBox(width: 32),
                      Text(
                        widget.isSinglePlayer ? 'Bot:' : 'Opponent:',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${gameState.opponentScore}',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  const Divider(),
                  
                  // Rewards
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Column(
                        children: [
                          const Text(
                            'Tokens Earned',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.token, color: Colors.amber),
                              const SizedBox(width: 4),
                              Text(
                                '+${gameState.tokensEarned}',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(width: 32),
                      Column(
                        children: [
                          const Text(
                            'XP Earned',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.star, color: Colors.purple),
                              const SizedBox(width: 4),
                              Text(
                                '+${gameState.xpEarned}',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Action buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  onPressed: _returnToDashboard,
                  icon: const Icon(Icons.home),
                  label: const Text('Home'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    if (widget.isSinglePlayer) {
                      // Start a new single player game
                      Future.microtask(() {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const GameScreen(isSinglePlayer: true),
                          ),
                        );
                      });
                    } else {
                      // For multiplayer, we go back to the play screen which has matchmaking
                    }
                  },
                  icon: const Icon(Icons.replay),
                  label: const Text('Play Again'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
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
  
  Color _getTimerColor() {
    if (_timeRemaining > 10) {
      return Colors.green;
    } else if (_timeRemaining > 5) {
      return Colors.orange;
    } else {
      return Colors.red;
    }
  }
  
  Color _getAnswerColor(bool isSelected, bool isCorrect, bool isWrong) {
    final gameService = Provider.of<GameService>(context, listen: false);
    final gameState = gameService.gameState;
    
    if (isCorrect && gameState?.correctAnswerIndex != null) {
      return Colors.green.shade100;
    } else if (isWrong) {
      return Colors.red.shade100;
    } else if (isSelected) {
      return Colors.blue.shade100;
    } else {
      return Colors.white;
    }
  }
  
  Color _getAnswerTextColor(bool isSelected, bool isCorrect, bool isWrong) {
    final gameService = Provider.of<GameService>(context, listen: false);
    final gameState = gameService.gameState;
    
    if (isCorrect && gameState?.correctAnswerIndex != null) {
      return Colors.green.shade900;
    } else if (isWrong) {
      return Colors.red.shade900;
    } else if (isSelected) {
      return Colors.blue.shade900;
    } else {
      return Colors.black87;
    }
  }
}