import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/models/question_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/screens/home/quick_match_screen.dart';
import 'package:mind_arena/services/quiz_service.dart';

class PlayTab extends StatefulWidget {
  final User? user;

  const PlayTab({Key? key, this.user}) : super(key: key);

  @override
  _PlayTabState createState() => _PlayTabState();
}

class _PlayTabState extends State<PlayTab> {
  bool _isLoading = true;
  List<QuestionCategory> _categories = [];
  List<String> _difficultyLevels = ['Easy', 'Medium', 'Hard', 'Mixed'];
  String _selectedDifficulty = 'Mixed';
  QuestionCategory? _selectedCategory;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final quizService = QuizService();
      final categories = await quizService.getCategories();
      
      setState(() {
        _categories = categories;
        _selectedCategory = null; // Reset selection
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading categories: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _startQuickMatch() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => QuickMatchScreen(
          user: widget.user,
          category: _selectedCategory,
          difficulty: _selectedDifficulty,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.backgroundGradient,
      ),
      child: _isLoading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Welcome message
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
                          Text(
                            'Welcome, ${widget.user?.displayName ?? widget.user?.username ?? 'Player'}!',
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Ready to test your knowledge? Choose a game mode below to start playing!',
                            style: TextStyle(color: AppTheme.secondaryTextColor),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Daily Missions
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
                          Row(
                            children: [
                              const Icon(Icons.calendar_today, color: AppTheme.accentColor),
                              const SizedBox(width: 8),
                              Text(
                                'Daily Missions',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          _buildMissionItem(
                            'Play 3 matches',
                            1,
                            3,
                            'Reward: 50 coins',
                          ),
                          const SizedBox(height: 12),
                          _buildMissionItem(
                            'Answer 15 questions correctly',
                            8,
                            15,
                            'Reward: 75 coins',
                          ),
                          const SizedBox(height: 12),
                          _buildMissionItem(
                            'Win a match with perfect score',
                            0,
                            1,
                            'Reward: 100 coins',
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Game Modes
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
                          Row(
                            children: [
                              const Icon(Icons.gamepad, color: AppTheme.accentColor),
                              const SizedBox(width: 8),
                              Text(
                                'Game Modes',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          
                          // Quick Match
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              gradient: AppTheme.primaryGradient,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.flash_on, color: Colors.white),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Quick Match',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const Spacer(),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: const Text(
                                        '2-5 players',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Jump into a quick match with players around the world. Test your knowledge in a fast-paced quiz battle!',
                                  style: TextStyle(color: Colors.white),
                                ),
                                const SizedBox(height: 16),
                                
                                // Category Selector
                                DropdownButtonFormField<QuestionCategory>(
                                  decoration: InputDecoration(
                                    filled: true,
                                    fillColor: Colors.white.withOpacity(0.1),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide: BorderSide.none,
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 12,
                                    ),
                                    hintStyle: const TextStyle(color: Colors.white70),
                                    hintText: 'Select category',
                                  ),
                                  dropdownColor: AppTheme.primaryColor,
                                  value: _selectedCategory,
                                  onChanged: (value) {
                                    setState(() {
                                      _selectedCategory = value;
                                    });
                                  },
                                  items: [
                                    const DropdownMenuItem<QuestionCategory>(
                                      value: null,
                                      child: Text(
                                        'All Categories',
                                        style: TextStyle(color: Colors.white),
                                      ),
                                    ),
                                    ..._categories.map((category) {
                                      return DropdownMenuItem<QuestionCategory>(
                                        value: category,
                                        child: Text(
                                          category.name,
                                          style: const TextStyle(color: Colors.white),
                                        ),
                                      );
                                    }).toList(),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                
                                // Difficulty Selector
                                DropdownButtonFormField<String>(
                                  decoration: InputDecoration(
                                    filled: true,
                                    fillColor: Colors.white.withOpacity(0.1),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide: BorderSide.none,
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 12,
                                    ),
                                    hintStyle: const TextStyle(color: Colors.white70),
                                    hintText: 'Select difficulty',
                                  ),
                                  dropdownColor: AppTheme.primaryColor,
                                  value: _selectedDifficulty,
                                  onChanged: (value) {
                                    setState(() {
                                      _selectedDifficulty = value!;
                                    });
                                  },
                                  items: _difficultyLevels.map((difficulty) {
                                    return DropdownMenuItem<String>(
                                      value: difficulty,
                                      child: Text(
                                        difficulty,
                                        style: const TextStyle(color: Colors.white),
                                      ),
                                    );
                                  }).toList(),
                                ),
                                const SizedBox(height: 16),
                                
                                // Play Button
                                ElevatedButton(
                                  onPressed: _startQuickMatch,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.white,
                                    foregroundColor: AppTheme.primaryColor,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    minimumSize: const Size(double.infinity, 0),
                                  ),
                                  child: const Text(
                                    'PLAY NOW',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // Private Match (Coming Soon)
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade800,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.people, color: Colors.white70),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Private Match',
                                      style: TextStyle(
                                        color: Colors.white70,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const Spacer(),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.amber,
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: const Text(
                                        'COMING SOON',
                                        style: TextStyle(
                                          color: Colors.black,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Create a private match and invite your friends to play together. Customize the rules and compete with your friends!',
                                  style: TextStyle(color: Colors.white70),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildMissionItem(String title, int progress, int total, String reward) {
    final double percentage = progress / total;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Text(
              '$progress/$total',
              style: TextStyle(
                color: percentage == 1 ? Colors.green : Colors.white70,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: percentage,
          backgroundColor: Colors.grey.shade800,
          valueColor: AlwaysStoppedAnimation<Color>(
            percentage == 1 ? Colors.green : AppTheme.accentColor,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          reward,
          style: TextStyle(
            color: percentage == 1 ? Colors.green : Colors.amber,
            fontSize: 12,
          ),
        ),
        if (percentage == 1)
          Align(
            alignment: Alignment.centerRight,
            child: ElevatedButton(
              onPressed: () {
                // Claim reward logic
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
              ),
              child: const Text('Claim'),
            ),
          ),
      ],
    );
  }
}