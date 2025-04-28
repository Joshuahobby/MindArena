import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/services/firebase_service.dart';
import 'package:mind_arena/screens/profile/components/achievement_card.dart';
import 'package:mind_arena/screens/profile/components/stats_card.dart';
import 'package:mind_arena/screens/profile/edit_profile_screen.dart';
import 'package:mind_arena/screens/profile/avatars_screen.dart';
import 'package:mind_arena/screens/auth/login_screen.dart';

class ProfileTab extends StatefulWidget {
  final User? user;

  const ProfileTab({Key? key, this.user}) : super(key: key);

  @override
  _ProfileTabState createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  bool _isLoading = false;
  Map<String, dynamic> _userStats = {};
  List<Map<String, dynamic>> _recentMatches = [];
  List<Map<String, dynamic>> _achievements = [];
  
  @override
  void initState() {
    super.initState();
    _loadUserData();
  }
  
  Future<void> _loadUserData() async {
    if (widget.user == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      // For demo purposes, we'll create mock data
      _userStats = {
        'matches_played': 147,
        'matches_won': 98,
        'win_rate': 66.7,
        'average_score': 720,
        'total_questions': 1470,
        'correct_answers': 1105,
        'accuracy': 75.2,
        'best_category': 'Science',
        'tournaments_won': 3,
        'highest_streak': 12,
      };
      
      _recentMatches = [
        {
          'date': DateTime.now().subtract(const Duration(hours: 3)),
          'result': 'win',
          'score': 850,
          'opponent': 'BrainiacGamer',
          'category': 'Mixed',
        },
        {
          'date': DateTime.now().subtract(const Duration(hours: 5)),
          'result': 'win',
          'score': 780,
          'opponent': 'TriviaKing',
          'category': 'Science',
        },
        {
          'date': DateTime.now().subtract(const Duration(hours: 8)),
          'result': 'loss',
          'score': 620,
          'opponent': 'QuizWhiz',
          'category': 'Geography',
        },
        {
          'date': DateTime.now().subtract(const Duration(days: 1)),
          'result': 'win',
          'score': 910,
          'opponent': 'KnowledgeGuru',
          'category': 'Entertainment',
        },
        {
          'date': DateTime.now().subtract(const Duration(days: 1, hours: 3)),
          'result': 'win',
          'score': 830,
          'opponent': 'BrainWave',
          'category': 'History',
        },
      ];
      
      _achievements = [
        {
          'id': 'first_win',
          'name': 'First Victory',
          'description': 'Win your first match',
          'icon': Icons.emoji_events,
          'color': Colors.amber,
          'unlocked': true,
          'progress': 1,
          'total': 1,
        },
        {
          'id': 'win_streak_5',
          'name': 'On Fire',
          'description': 'Win 5 matches in a row',
          'icon': Icons.local_fire_department,
          'color': Colors.orange,
          'unlocked': true,
          'progress': 5,
          'total': 5,
        },
        {
          'id': 'win_streak_10',
          'name': 'Unstoppable',
          'description': 'Win 10 matches in a row',
          'icon': Icons.bolt,
          'color': Colors.amber,
          'unlocked': true,
          'progress': 10,
          'total': 10,
        },
        {
          'id': 'correct_answers_100',
          'name': 'Knowledge Beginner',
          'description': 'Answer 100 questions correctly',
          'icon': Icons.school,
          'color': Colors.blue,
          'unlocked': true,
          'progress': 100,
          'total': 100,
        },
        {
          'id': 'correct_answers_500',
          'name': 'Knowledge Expert',
          'description': 'Answer 500 questions correctly',
          'icon': Icons.psychology,
          'color': Colors.purple,
          'unlocked': true,
          'progress': 500,
          'total': 500,
        },
        {
          'id': 'correct_answers_1000',
          'name': 'Knowledge Master',
          'description': 'Answer 1000 questions correctly',
          'icon': Icons.workspace_premium,
          'color': Colors.deepPurple,
          'unlocked': true,
          'progress': 1000,
          'total': 1000,
        },
        {
          'id': 'tournament_win',
          'name': 'Tournament Champion',
          'description': 'Win a tournament',
          'icon': Icons.emoji_events,
          'color': Colors.amber,
          'unlocked': true,
          'progress': 1,
          'total': 1,
        },
        {
          'id': 'tournament_wins_5',
          'name': 'Tournament Legend',
          'description': 'Win 5 tournaments',
          'icon': Icons.shield,
          'color': Colors.deepOrange,
          'unlocked': false,
          'progress': 3,
          'total': 5,
        },
        {
          'id': 'perfect_game',
          'name': 'Flawless Victory',
          'description': 'Win a match with all correct answers',
          'icon': Icons.auto_awesome,
          'color': Colors.amber,
          'unlocked': true,
          'progress': 1,
          'total': 1,
        },
        {
          'id': 'all_categories',
          'name': 'Well-Rounded',
          'description': 'Win matches in all categories',
          'icon': Icons.category,
          'color': Colors.green,
          'unlocked': false,
          'progress': 4,
          'total': 5,
        },
      ];
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading user data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  Future<void> _signOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('SIGN OUT'),
          ),
        ],
      ),
    ) ?? false;
    
    if (confirmed) {
      setState(() {
        _isLoading = true;
      });
      
      try {
        final firebaseService = FirebaseService();
        await firebaseService.signOut();
        
        if (!mounted) return;
        
        // Navigate to login screen
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      } catch (e) {
        print('Error signing out: $e');
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
  
  void _navigateToEditProfile() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => EditProfileScreen(user: widget.user),
      ),
    ).then((_) {
      // Refresh after returning from edit screen
      _loadUserData();
    });
  }
  
  void _navigateToAvatars() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => AvatarsScreen(user: widget.user),
      ),
    ).then((_) {
      // Refresh after returning from avatars screen
      _loadUserData();
    });
  }
  
  @override
  Widget build(BuildContext context) {
    if (widget.user == null) {
      return _buildNotLoggedInView();
    }
    
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile Header
                  _buildProfileHeader(),
                  const SizedBox(height: 24),
                  
                  // Stats Section
                  const Text(
                    'STATS',
                    style: TextStyle(
                      color: AppTheme.secondaryTextColor,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  StatsCard(stats: _userStats),
                  const SizedBox(height: 24),
                  
                  // Recent Matches
                  const Text(
                    'RECENT MATCHES',
                    style: TextStyle(
                      color: AppTheme.secondaryTextColor,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildRecentMatchesCard(),
                  const SizedBox(height: 24),
                  
                  // Achievements
                  const Text(
                    'ACHIEVEMENTS',
                    style: TextStyle(
                      color: AppTheme.secondaryTextColor,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildAchievementsGrid(),
                  const SizedBox(height: 24),
                  
                  // Sign Out Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _signOut,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('SIGN OUT'),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
  
  Widget _buildNotLoggedInView() {
    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.backgroundGradient,
      ),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.account_circle,
                size: 96,
                color: AppTheme.secondaryTextColor,
              ),
              const SizedBox(height: 24),
              Text(
                'Not Logged In',
                style: Theme.of(context).textTheme.headlineMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              const Text(
                'Sign in to track your stats, customize your profile, join tournaments, and more!',
                style: TextStyle(color: AppTheme.secondaryTextColor),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (context) => const LoginScreen()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text(
                    'SIGN IN',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
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
  
  Widget _buildProfileHeader() {
    return Card(
      color: AppTheme.cardColor,
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          // Background and Avatar
          Container(
            height: 120,
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // Username
                Positioned(
                  top: 16,
                  left: 16,
                  child: Row(
                    children: [
                      Text(
                        widget.user!.displayName ?? widget.user!.username,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                        ),
                      ),
                      if (widget.user!.level >= 10)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.amber,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Text(
                            'PRO',
                            style: TextStyle(
                              color: Colors.black,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                
                // Level
                Positioned(
                  top: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.star,
                          color: Colors.amber,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Level ${widget.user!.level}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                // Avatar (positioned to overlap the containers)
                Positioned(
                  bottom: -40,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: GestureDetector(
                      onTap: _navigateToAvatars,
                      child: Stack(
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: Colors.white,
                            backgroundImage: widget.user!.avatarUrl != null
                                ? NetworkImage(widget.user!.avatarUrl!)
                                : null,
                            child: widget.user!.avatarUrl == null
                                ? Text(
                                    widget.user!.username[0].toUpperCase(),
                                    style: const TextStyle(
                                      fontSize: 32,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.primaryColor,
                                    ),
                                  )
                                : null,
                          ),
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryColor,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppTheme.cardColor,
                                  width: 2,
                                ),
                              ),
                              child: const Icon(
                                Icons.edit,
                                color: Colors.white,
                                size: 16,
                              ),
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
          
          // Profile info
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 48, 16, 16),
            child: Column(
              children: [
                // Coins and XP
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildInfoChip(
                      icon: Icons.monetization_on,
                      iconColor: Colors.amber,
                      label: 'Coins',
                      value: '${widget.user!.coins}',
                    ),
                    _buildInfoChip(
                      icon: Icons.auto_awesome,
                      iconColor: Colors.blue,
                      label: 'XP',
                      value: '${widget.user!.experiencePoints}',
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Edit Profile Button
                OutlinedButton.icon(
                  onPressed: _navigateToEditProfile,
                  icon: const Icon(Icons.edit),
                  label: const Text('EDIT PROFILE'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildInfoChip({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 8,
      ),
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: iconColor,
            size: 18,
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: AppTheme.secondaryTextColor,
                  fontSize: 12,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildRecentMatchesCard() {
    if (_recentMatches.isEmpty) {
      return Card(
        color: AppTheme.cardColor,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Padding(
          padding: EdgeInsets.all(16),
          child: Center(
            child: Text(
              'No matches played yet',
              style: TextStyle(color: AppTheme.secondaryTextColor),
            ),
          ),
        ),
      );
    }
    
    return Card(
      color: AppTheme.cardColor,
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: _recentMatches.map((match) {
            final bool isWin = match['result'] == 'win';
            
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isWin
                    ? Colors.green.withOpacity(0.1)
                    : Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isWin ? Colors.green.shade700 : Colors.red.shade700,
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  // Win/Loss Indicator
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: isWin ? Colors.green : Colors.red,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isWin ? Icons.check : Icons.close,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Match details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              isWin ? 'Victory' : 'Defeat',
                              style: TextStyle(
                                color: isWin ? Colors.green : Colors.red,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'vs ${match['opponent']}',
                              style: const TextStyle(
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Category: ${match['category']}',
                          style: const TextStyle(
                            color: AppTheme.secondaryTextColor,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Score
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.backgroundColor,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '${match['score']} pts',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
  
  Widget _buildAchievementsGrid() {
    if (_achievements.isEmpty) {
      return Card(
        color: AppTheme.cardColor,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Padding(
          padding: EdgeInsets.all(16),
          child: Center(
            child: Text(
              'No achievements yet',
              style: TextStyle(color: AppTheme.secondaryTextColor),
            ),
          ),
        ),
      );
    }
    
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1,
      ),
      itemCount: _achievements.length,
      itemBuilder: (context, index) {
        final achievement = _achievements[index];
        
        return AchievementCard(
          name: achievement['name'],
          description: achievement['description'],
          icon: achievement['icon'],
          color: achievement['color'],
          unlocked: achievement['unlocked'],
          progress: achievement['progress'],
          total: achievement['total'],
        );
      },
    );
  }
}