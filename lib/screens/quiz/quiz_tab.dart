import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/screens/quiz/quiz_game_screen.dart';
import 'package:mind_arena/screens/quiz/components/category_card.dart';
import 'package:mind_arena/screens/quiz/components/game_mode_card.dart';

class QuizTab extends StatefulWidget {
  final User? user;

  const QuizTab({Key? key, this.user}) : super(key: key);

  @override
  _QuizTabState createState() => _QuizTabState();
}

class _QuizTabState extends State<QuizTab> {
  final List<Map<String, dynamic>> _gameModes = [
    {
      'id': 'quick_play',
      'name': 'Quick Play',
      'description': 'Jump into a random match and test your knowledge!',
      'icon': Icons.flash_on,
      'color': Colors.blue,
      'requiresLogin': false,
    },
    {
      'id': 'ranked',
      'name': 'Ranked Match',
      'description': 'Compete against other players and climb the leaderboard!',
      'icon': Icons.leaderboard,
      'color': Colors.purple,
      'requiresLogin': true,
    },
    {
      'id': 'daily_challenge',
      'name': 'Daily Challenge',
      'description': 'Complete the daily challenge for bonus rewards',
      'icon': Icons.calendar_today,
      'color': Colors.amber,
      'requiresLogin': true,
    },
    {
      'id': 'practice',
      'name': 'Practice Mode',
      'description': 'Improve your skills without affecting your rank',
      'icon': Icons.school,
      'color': Colors.green,
      'requiresLogin': false,
    },
  ];

  final List<Map<String, dynamic>> _categories = [
    {
      'id': 'general',
      'name': 'General Knowledge',
      'icon': Icons.lightbulb,
      'color': Colors.amber,
    },
    {
      'id': 'science',
      'name': 'Science',
      'icon': Icons.science,
      'color': Colors.blue,
    },
    {
      'id': 'history',
      'name': 'History',
      'icon': Icons.history_edu,
      'color': Colors.brown,
    },
    {
      'id': 'geography',
      'name': 'Geography',
      'icon': Icons.public,
      'color': Colors.green,
    },
    {
      'id': 'entertainment',
      'name': 'Entertainment',
      'icon': Icons.movie,
      'color': Colors.red,
    },
    {
      'id': 'sports',
      'name': 'Sports',
      'icon': Icons.sports_soccer,
      'color': Colors.orange,
    },
  ];

  void _startGame(String mode, String? category) {
    if (mode == 'ranked' && widget.user == null) {
      _showLoginRequiredDialog();
      return;
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => QuizGameScreen(
          mode: mode,
          category: category,
          user: widget.user,
        ),
      ),
    );
  }

  void _showLoginRequiredDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Login Required'),
        content: const Text(
          'You need to be logged in to play ranked matches. Please log in to continue.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate to login screen
            },
            child: const Text('LOG IN'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: AppTheme.backgroundGradient,
        ),
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                expandedHeight: 120.0,
                floating: false,
                pinned: true,
                backgroundColor: AppTheme.backgroundColor,
                flexibleSpace: FlexibleSpaceBar(
                  titlePadding: const EdgeInsets.all(16),
                  title: const Text(
                    'MindArena',
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

              // Game Modes
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                  child: Row(
                    children: [
                      const Text(
                        'GAME MODES',
                        style: TextStyle(
                          color: AppTheme.secondaryTextColor,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () {
                          // Show all game modes
                        },
                        style: TextButton.styleFrom(
                          foregroundColor: AppTheme.primaryColor,
                        ),
                        child: const Text('View All'),
                      ),
                    ],
                  ),
                ),
              ),

              // Game Modes List
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 160,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    scrollDirection: Axis.horizontal,
                    itemCount: _gameModes.length,
                    itemBuilder: (context, index) {
                      final mode = _gameModes[index];
                      return GameModeCard(
                        name: mode['name'],
                        description: mode['description'],
                        icon: mode['icon'],
                        color: mode['color'],
                        onTap: () => _startGame(mode['id'], null),
                        isLocked: mode['requiresLogin'] && widget.user == null,
                      );
                    },
                  ),
                ),
              ),

              // Categories
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                  child: Row(
                    children: [
                      const Text(
                        'CATEGORIES',
                        style: TextStyle(
                          color: AppTheme.secondaryTextColor,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () {
                          // Show all categories
                        },
                        style: TextButton.styleFrom(
                          foregroundColor: AppTheme.primaryColor,
                        ),
                        child: const Text('View All'),
                      ),
                    ],
                  ),
                ),
              ),

              // Categories Grid
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.5,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final category = _categories[index];
                      return CategoryCard(
                        name: category['name'],
                        icon: category['icon'],
                        color: category['color'],
                        onTap: () => _showCategoryOptions(category),
                      );
                    },
                    childCount: _categories.length,
                  ),
                ),
              ),

              // Featured Challenge
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Card(
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
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.deepPurple.shade800,
                                Colors.deepPurple.shade500,
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
                                  Icons.star,
                                  color: Colors.white,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Text(
                                  'Weekend Challenge',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Row(
                                  children: const [
                                    Icon(
                                      Icons.timer,
                                      color: Colors.white,
                                      size: 12,
                                    ),
                                    SizedBox(width: 4),
                                    Text(
                                      '2 DAYS LEFT',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Content
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Test your knowledge across all categories in this special weekend challenge. Complete it to earn exclusive rewards!',
                                style: TextStyle(
                                  color: AppTheme.secondaryTextColor,
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Rewards
                              Row(
                                children: [
                                  _buildRewardChip(
                                    icon: Icons.monetization_on,
                                    color: Colors.amber,
                                    text: '200 Coins',
                                  ),
                                  const SizedBox(width: 8),
                                  _buildRewardChip(
                                    icon: Icons.auto_awesome,
                                    color: Colors.blue,
                                    text: '500 XP',
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Action Button
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: widget.user != null
                                      ? () => _startGame('weekend_challenge', null)
                                      : () => _showLoginRequiredDialog(),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.deepPurple,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                  ),
                                  child: Text(
                                    widget.user != null
                                        ? 'START CHALLENGE'
                                        : 'LOG IN TO START',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
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
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCategoryOptions(Map<String, dynamic> category) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.backgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Category Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: category['color'],
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    category['icon'],
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  category['name'],
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Game Mode Options
            Row(
              children: [
                Expanded(
                  child: _buildModeOption(
                    icon: Icons.flash_on,
                    color: Colors.blue,
                    text: 'Quick Play',
                    onTap: () {
                      Navigator.pop(context);
                      _startGame('quick_play', category['id']);
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildModeOption(
                    icon: Icons.leaderboard,
                    color: Colors.purple,
                    text: 'Ranked',
                    onTap: () {
                      Navigator.pop(context);
                      _startGame('ranked', category['id']);
                    },
                    isLocked: widget.user == null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildModeOption(
                    icon: Icons.school,
                    color: Colors.green,
                    text: 'Practice',
                    onTap: () {
                      Navigator.pop(context);
                      _startGame('practice', category['id']);
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildModeOption(
                    icon: Icons.timer,
                    color: Colors.orange,
                    text: 'Time Attack',
                    onTap: () {
                      Navigator.pop(context);
                      _startGame('time_attack', category['id']);
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRewardChip({
    required IconData icon,
    required Color color,
    required String text,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: color,
            size: 16,
          ),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModeOption({
    required IconData icon,
    required Color color,
    required String text,
    required VoidCallback onTap,
    bool isLocked = false,
  }) {
    return InkWell(
      onTap: isLocked ? null : onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isLocked ? Colors.grey.shade700 : color.withOpacity(0.5),
          ),
        ),
        child: Column(
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isLocked ? Colors.grey.shade800 : color.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    icon,
                    color: isLocked ? Colors.grey : color,
                    size: 24,
                  ),
                ),
                if (isLocked)
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.lock,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              text,
              style: TextStyle(
                color: isLocked ? Colors.grey : Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}