import 'package:flutter/material.dart';
import 'package:mind_arena/config/constants.dart';
import 'package:mind_arena/config/theme.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/screens/game/matchmaking_screen.dart';
import 'package:mind_arena/screens/leaderboard_screen.dart';
import 'package:mind_arena/screens/missions_screen.dart';
import 'package:mind_arena/screens/profile_screen.dart';
import 'package:mind_arena/screens/shop_screen.dart';
import 'package:mind_arena/services/ad_service.dart';
import 'package:mind_arena/services/analytics_service.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/services/database_service.dart';
import 'package:mind_arena/widgets/ad_banner_widget.dart';
import 'package:mind_arena/widgets/custom_button.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class HomeScreen extends StatefulWidget {
  static const String routeName = '/home';

  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  UserModel? _user;
  bool _isLoading = true;
  bool _showDailyReward = false;
  Map<String, dynamic>? _dailyRewardInfo;

  @override
  void initState() {
    super.initState();
    _loadUserData();
    _checkDailyReward();

    // Log screen view
    Provider.of<AnalyticsService>(context, listen: false)
        .logScreenView(screenName: 'home_screen');
  }

  Future<void> _loadUserData() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    final userId = authService.currentUser?.uid;

    if (userId != null) {
      try {
        UserModel? user = await authService.getUserData(userId);
        if (mounted) {
          setState(() {
            _user = user;
            _isLoading = false;
          });
        }
      } catch (e) {
        _handleError('Failed to load user data: $e');
      }
    } else {
      _handleError('No authenticated user found');
    }
  }

  Future<void> _checkDailyReward() async {
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final databaseService = Provider.of<DatabaseService>(context, listen: false);
      final userId = authService.currentUser?.uid;

      if (userId == null) return;

      // Check if daily reward was already claimed today
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String today = DateTime.now().toIso8601String().split('T')[0];
      bool claimed = prefs.getBool('${AppConstants.dailyRewardClaimedKey}_$today') ?? false;

      if (!claimed) {
        // Get reward info
        Map<String, dynamic> rewardInfo = await databaseService.getDailyRewardInfo(userId);
        
        if (mounted) {
          setState(() {
            _showDailyReward = true;
            _dailyRewardInfo = rewardInfo;
          });
        }
      }
    } catch (e) {
      print('Error checking daily reward: $e');
      // Don't show error UI for this - non-critical
    }
  }

  Future<void> _claimDailyReward() async {
    if (_dailyRewardInfo == null) return;

    final databaseService = Provider.of<DatabaseService>(context, listen: false);
    final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
    final authService = Provider.of<AuthService>(context, listen: false);
    final userId = authService.currentUser?.uid;

    if (userId == null) return;

    try {
      // Claim reward
      bool success = await databaseService.claimDailyReward(userId);
      
      if (success) {
        // Mark as claimed in local storage
        SharedPreferences prefs = await SharedPreferences.getInstance();
        String today = DateTime.now().toIso8601String().split('T')[0];
        await prefs.setBool('${AppConstants.dailyRewardClaimedKey}_$today', true);
        
        // Log event
        analyticsService.logDailyRewardClaimed(
          day: _dailyRewardInfo!['day'],
          amount: _dailyRewardInfo!['amount'],
        );
        
        // Update UI
        setState(() {
          _showDailyReward = false;
        });
        
        // Reload user data to reflect new coin amount
        _loadUserData();
        
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('You claimed ${_dailyRewardInfo!['amount']} coins!'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      _handleError('Failed to claim daily reward: $e');
    }
  }

  void _onNavItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  void _handleError(String message) {
    setState(() {
      _isLoading = false;
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppTheme.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Show different screens based on selected index
    Widget body;
    
    switch (_selectedIndex) {
      case 0:
        body = _buildHomeTab();
        break;
      case 1:
        body = const LeaderboardScreen();
        break;
      case 2:
        body = const MissionsScreen();
        break;
      case 3:
        body = const ShopScreen();
        break;
      case 4:
        body = ProfileScreen();
        break;
      default:
        body = _buildHomeTab();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('MindArena'),
        centerTitle: true,
        elevation: 0,
        actions: [
          if (_user != null)
            Padding(
              padding: const EdgeInsets.only(right: 16.0),
              child: Center(
                child: Row(
                  children: [
                    const Icon(Icons.monetization_on, color: AppTheme.coinColor),
                    const SizedBox(width: 4),
                    Text(
                      _user!.coins.toString(),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Banner ad at the top
          if (_selectedIndex != 0) // Don't show on home tab
            const AdBannerWidget(adPosition: 'home_top'),
          
          // Main content
          Expanded(
            child: body,
          ),
          
          // Optional banner at the bottom (only on certain tabs)
          if (_selectedIndex == 1 || _selectedIndex == 2) // Show on leaderboard and missions
            const AdBannerWidget(adPosition: 'home_bottom'),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.leaderboard),
            label: 'Leaderboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment),
            label: 'Missions',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.store),
            label: 'Shop',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
        currentIndex: _selectedIndex,
        onTap: _onNavItemTapped,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: Colors.grey,
      ),
      // Show daily reward dialog if available
      floatingActionButton: _showDailyReward ? FloatingActionButton(
        onPressed: () => _showDailyRewardDialog(),
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(Icons.calendar_today),
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(10),
                ),
                constraints: const BoxConstraints(
                  minWidth: 14,
                  minHeight: 14,
                ),
                child: const Text(
                  '!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: AppTheme.coinColor,
      ) : null,
    );
  }

  void _showDailyRewardDialog() {
    if (_dailyRewardInfo == null) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Daily Reward!'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Day ${_dailyRewardInfo!['day']} Streak'),
            const SizedBox(height: 16),
            Icon(
              Icons.monetization_on,
              color: AppTheme.coinColor,
              size: 64,
            ),
            const SizedBox(height: 16),
            Text(
              '${_dailyRewardInfo!['amount']} Coins',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _claimDailyReward();
            },
            child: const Text('CLAIM'),
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab() {
    final size = MediaQuery.of(context).size;
    
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_user == null) {
      return const Center(
        child: Text('Failed to load user data. Please restart the app.'),
      );
    }

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Welcome message
            Text(
              'Welcome, ${_user!.username}!',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Play button
            CustomButton(
              onPressed: () {
                Navigator.of(context).pushNamed(MatchmakingScreen.routeName);
              },
              text: 'PLAY NOW',
              color: AppTheme.primaryColor,
              height: 60,
              fontSize: 20,
              icon: Icons.play_arrow,
            ),
            
            const SizedBox(height: 24),
            
            // Category grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              children: AppConstants.quizCategories.take(4).map((category) {
                return _buildCategoryCard(category);
              }).toList(),
            ),
            
            const SizedBox(height: 24),
            
            // Stats section
            const Text(
              'Your Stats',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Stats cards
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    icon: Icons.emoji_events,
                    title: 'Wins',
                    value: _user!.matchesWon.toString(),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildStatCard(
                    icon: Icons.sports_esports,
                    title: 'Matches',
                    value: _user!.totalMatches.toString(),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildStatCard(
                    icon: Icons.auto_graph,
                    title: 'Win %',
                    value: '${_user!.winPercentage.toStringAsFixed(1)}%',
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Invite friends section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    const Text(
                      'Invite Friends',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Both you and your friend will receive 50 coins when they join!',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    CustomButton(
                      onPressed: () {
                        _shareInvite();
                      },
                      text: 'SHARE INVITE',
                      color: AppTheme.secondaryColor,
                      icon: Icons.share,
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Banner ad at the bottom of home tab
            const AdBannerWidget(adPosition: 'home_bottom'),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryCard(Map<String, dynamic> category) {
    return InkWell(
      onTap: () {
        // Navigate to matchmaking with specific category
        Navigator.of(context).pushNamed(
          MatchmakingScreen.routeName,
          arguments: {'category': category['id']},
        );
      },
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              category['icon'] as IconData,
              size: 40,
              color: AppTheme.primaryColor,
            ),
            const SizedBox(height: 8),
            Text(
              category['name'] as String,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: AppTheme.primaryColor),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  void _shareInvite() {
    final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
    
    // TODO: Implement actual share functionality with deep links
    
    // For now, just log the event
    analyticsService.logShareAction(
      contentType: 'invite',
      shareMethod: 'direct',
    );
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Invite sharing will be available in the next update!'),
      ),
    );
  }
}
