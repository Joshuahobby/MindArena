import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/services/firebase_service.dart';
import 'package:mind_arena/widgets/loading_overlay.dart';
import 'package:confetti/confetti.dart';

class QuizResultScreen extends StatefulWidget {
  final String mode;
  final String? category;
  final int score;
  final int correctAnswers;
  final int totalQuestions;
  final double averageTime;
  final double accuracy;
  final User? user;

  const QuizResultScreen({
    Key? key,
    required this.mode,
    this.category,
    required this.score,
    required this.correctAnswers,
    required this.totalQuestions,
    required this.averageTime,
    required this.accuracy,
    this.user,
  }) : super(key: key);

  @override
  _QuizResultScreenState createState() => _QuizResultScreenState();
}

class _QuizResultScreenState extends State<QuizResultScreen> {
  bool _isLoading = false;
  bool _isHighScore = false;
  late ConfettiController _confettiController;
  Map<String, dynamic> _rewards = {};
  
  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    _processResults();
  }
  
  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }
  
  Future<void> _processResults() async {
    if (widget.user == null) {
      // Guest user, just show results
      return;
    }
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final firebaseService = FirebaseService();
      
      // Check if this is a high score
      _isHighScore = widget.score > 800; // Just for demo
      
      // Calculate and apply rewards
      _rewards = {
        'coins': 0,
        'xp': 0,
      };
      
      // Base rewards
      _rewards['xp'] = widget.score ~/ 10;
      
      // Rewards based on mode
      if (widget.mode == 'ranked') {
        _rewards['coins'] = widget.correctAnswers * 5;
      } else if (widget.mode == 'daily_challenge') {
        _rewards['coins'] = 50;
        _rewards['xp'] += 100;
      } else if (widget.mode == 'weekend_challenge') {
        _rewards['coins'] = 200;
        _rewards['xp'] += 500;
      }
      
      // Performance bonus
      if (widget.accuracy >= 80) {
        _rewards['coins'] += 20;
        _rewards['xp'] += 50;
      }
      
      if (_isHighScore) {
        _rewards['coins'] += 50;
        _rewards['xp'] += 100;
        _confettiController.play();
      }
      
      // For demo purposes, we're not actually updating the user's profile
      // In a real app, you'd call a function to update the user's profile
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error processing results: $e');
      setState(() {
        _isLoading = false;
      });
    }
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
          child: Stack(
            children: [
              // Main Content
              SafeArea(
                child: CustomScrollView(
                  slivers: [
                    // App Bar
                    SliverAppBar(
                      expandedHeight: 120.0,
                      floating: false,
                      pinned: true,
                      backgroundColor: AppTheme.backgroundColor,
                      actions: [
                        TextButton.icon(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.home),
                          label: const Text('HOME'),
                        ),
                      ],
                      flexibleSpace: FlexibleSpaceBar(
                        titlePadding: const EdgeInsets.all(16),
                        title: const Text(
                          'Game Results',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        background: Container(
                          decoration: BoxDecoration(
                            gradient: AppTheme.primaryGradient,
                          ),
                          child: Stack(
                            children: [
                              // Background Pattern
                              Positioned.fill(
                                child: Opacity(
                                  opacity: 0.1,
                                  child: GridView.builder(
                                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: 5,
                                    ),
                                    itemBuilder: (context, index) => const Icon(
                                      Icons.star,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    
                    // Content
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Score Card
                            Card(
                              color: AppTheme.cardColor,
                              elevation: 4,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                children: [
                                  // Header
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          Colors.amber.shade800,
                                          Colors.amber.shade600,
                                        ],
                                      ),
                                      borderRadius: const BorderRadius.vertical(
                                        top: Radius.circular(12),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: Colors.white.withOpacity(0.2),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: const Icon(
                                            Icons.emoji_events,
                                            color: Colors.white,
                                            size: 24,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              const Text(
                                                'Your Score',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                ),
                                              ),
                                              if (_isHighScore)
                                                Container(
                                                  margin: const EdgeInsets.only(top: 4),
                                                  padding: const EdgeInsets.symmetric(
                                                    horizontal: 8,
                                                    vertical: 2,
                                                  ),
                                                  decoration: BoxDecoration(
                                                    color: Colors.white.withOpacity(0.3),
                                                    borderRadius: BorderRadius.circular(16),
                                                  ),
                                                  child: const Text(
                                                    'NEW HIGH SCORE!',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          '${widget.score}',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 24,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  
                                  // Performance Stats
                                  Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: _buildStatColumn(
                                            'Correct',
                                            '${widget.correctAnswers}/${widget.totalQuestions}',
                                            Icons.check_circle,
                                            Colors.green,
                                          ),
                                        ),
                                        Expanded(
                                          child: _buildStatColumn(
                                            'Accuracy',
                                            '${widget.accuracy.toStringAsFixed(1)}%',
                                            Icons.gps_fixed,
                                            Colors.blue,
                                          ),
                                        ),
                                        Expanded(
                                          child: _buildStatColumn(
                                            'Avg Time',
                                            '${widget.averageTime.toStringAsFixed(1)}s',
                                            Icons.timer,
                                            Colors.orange,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),
                            
                            // Rewards Card (for logged in users)
                            if (widget.user != null)
                              Card(
                                color: AppTheme.cardColor,
                                elevation: 4,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Header
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: Colors.purple.shade800,
                                        borderRadius: const BorderRadius.vertical(
                                          top: Radius.circular(12),
                                        ),
                                      ),
                                      child: const Text(
                                        'Rewards Earned',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ),
                                    
                                    // Rewards
                                    Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          _buildRewardItem(
                                            icon: Icons.monetization_on,
                                            color: Colors.amber,
                                            value: _rewards['coins'] ?? 0,
                                            label: 'Coins',
                                          ),
                                          const SizedBox(width: 32),
                                          _buildRewardItem(
                                            icon: Icons.auto_awesome,
                                            color: Colors.blue,
                                            value: _rewards['xp'] ?? 0,
                                            label: 'XP',
                                          ),
                                        ],
                                      ),
                                    ),
                                    
                                    // Claim Button
                                    Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: SizedBox(
                                        width: double.infinity,
                                        child: ElevatedButton(
                                          onPressed: () => Navigator.pop(context),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.purple,
                                            padding: const EdgeInsets.symmetric(vertical: 12),
                                          ),
                                          child: const Text(
                                            'CLAIM REWARDS',
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            
                            const SizedBox(height: 24),
                            
                            // Performance Analysis Card
                            Card(
                              color: AppTheme.cardColor,
                              elevation: 4,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Performance Analysis',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    
                                    // Accuracy Chart (simplified for demo)
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Accuracy: ${widget.accuracy.toStringAsFixed(1)}%',
                                          style: const TextStyle(
                                            color: AppTheme.secondaryTextColor,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(4),
                                          child: LinearProgressIndicator(
                                            value: widget.accuracy / 100,
                                            backgroundColor: Colors.grey.shade800,
                                            valueColor: AlwaysStoppedAnimation<Color>(
                                              widget.accuracy >= 80
                                                  ? Colors.green
                                                  : widget.accuracy >= 60
                                                      ? Colors.amber
                                                      : Colors.red,
                                            ),
                                            minHeight: 8,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    
                                    // Response Time
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Avg. Response Time: ${widget.averageTime.toStringAsFixed(1)} seconds',
                                          style: const TextStyle(
                                            color: AppTheme.secondaryTextColor,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(4),
                                          child: LinearProgressIndicator(
                                            value: (15 - widget.averageTime) / 15,
                                            backgroundColor: Colors.grey.shade800,
                                            valueColor: AlwaysStoppedAnimation<Color>(
                                              widget.averageTime <= 5
                                                  ? Colors.green
                                                  : widget.averageTime <= 8
                                                      ? Colors.amber
                                                      : Colors.red,
                                            ),
                                            minHeight: 8,
                                          ),
                                        ),
                                      ],
                                    ),
                                    
                                    // Feedback Text
                                    const SizedBox(height: 16),
                                    const Divider(
                                      color: AppTheme.secondaryTextColor,
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      _getFeedbackText(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            
                            const SizedBox(height: 24),
                            
                            // Action Buttons
                            Row(
                              children: [
                                // Play Again Button
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () {
                                      // Navigate back to game screen
                                      Navigator.pop(context);
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.primaryColor,
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                    ),
                                    child: const Text(
                                      'PLAY AGAIN',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                
                                // Share Button
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () {
                                      // Share results
                                    },
                                    icon: const Icon(Icons.share),
                                    label: const Text('SHARE'),
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              // Confetti Animation
              Align(
                alignment: Alignment.topCenter,
                child: ConfettiWidget(
                  confettiController: _confettiController,
                  blastDirectionality: BlastDirectionality.explosive,
                  particleDrag: 0.05,
                  emissionFrequency: 0.05,
                  numberOfParticles: 50,
                  gravity: 0.2,
                  shouldLoop: false,
                  colors: const [
                    Colors.green,
                    Colors.blue,
                    Colors.pink,
                    Colors.orange,
                    Colors.purple,
                    Colors.yellow,
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildStatColumn(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(
          icon,
          color: color,
          size: 24,
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.secondaryTextColor,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
  
  Widget _buildRewardItem({
    required IconData icon,
    required Color color,
    required int value,
    required String label,
  }) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            color: color,
            size: 32,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '+$value',
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.secondaryTextColor,
          ),
        ),
      ],
    );
  }
  
  String _getFeedbackText() {
    if (widget.accuracy >= 90) {
      return 'Outstanding performance! Your knowledge is impressive and your fast response time shows great expertise. Keep up the excellent work!';
    } else if (widget.accuracy >= 70) {
      return 'Great job! You have a solid understanding of this topic. A bit more practice could help improve your response time and accuracy.';
    } else if (widget.accuracy >= 50) {
      return 'Good effort! You\'re on the right track, but there\'s room for improvement. Try focusing on accuracy rather than speed for better results.';
    } else {
      return 'Nice try! This topic seems challenging, but don\'t worry. Regular practice will help you improve both your knowledge and response time.';
    }
  }
}