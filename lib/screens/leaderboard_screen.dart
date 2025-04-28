import 'package:flutter/material.dart';
import 'package:mind_arena/config/constants.dart';
import 'package:mind_arena/config/theme.dart';
import 'package:mind_arena/models/leaderboard_model.dart';
import 'package:mind_arena/services/analytics_service.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/services/database_service.dart';
import 'package:mind_arena/widgets/leaderboard_item.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';

class LeaderboardScreen extends StatefulWidget {
  static const String routeName = '/leaderboard';

  const LeaderboardScreen({Key? key}) : super(key: key);

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _errorMessage;
  List<LeaderboardEntry> _globalEntries = [];
  List<LeaderboardEntry> _weeklyEntries = [];
  List<LeaderboardEntry> _monthlyEntries = [];
  String? _currentUserId;
  LeaderboardEntry? _currentUserEntry;
  int _currentUserGlobalRank = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadCurrentUser();
    _loadLeaderboards();
    
    // Log screen view
    Provider.of<AnalyticsService>(context, listen: false)
        .logScreenView(screenName: 'leaderboard_screen');
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadCurrentUser() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    setState(() {
      _currentUserId = authService.currentUser?.uid;
    });
  }

  Future<void> _loadLeaderboards() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final databaseService = Provider.of<DatabaseService>(context, listen: false);
      
      // Load global leaderboard
      List<LeaderboardEntry> globalEntries = await databaseService.getLeaderboard(
        type: 'global',
        limit: 100,
      );
      
      // For MVP, we'll use the same leaderboard for weekly and monthly
      // In a real app, these would be separate leaderboards
      // TODO: Implement separate weekly and monthly leaderboards
      
      if (mounted) {
        setState(() {
          _globalEntries = globalEntries;
          _weeklyEntries = globalEntries;
          _monthlyEntries = globalEntries;
          _isLoading = false;
          
          // Find current user in leaderboard
          if (_currentUserId != null) {
            _findCurrentUserInLeaderboard();
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load leaderboard: $e';
          _isLoading = false;
        });
      }
    }
  }

  void _findCurrentUserInLeaderboard() {
    if (_currentUserId == null) return;
    
    // Find user in global entries
    for (int i = 0; i < _globalEntries.length; i++) {
      if (_globalEntries[i].userId == _currentUserId) {
        setState(() {
          _currentUserEntry = _globalEntries[i];
          _currentUserGlobalRank = i + 1;
        });
        return;
      }
    }
  }

  Future<void> _refreshLeaderboards() async {
    await _loadLeaderboards();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Tab bar
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TabBar(
            controller: _tabController,
            labelColor: AppTheme.primaryColor,
            unselectedLabelColor: Colors.grey,
            indicatorColor: AppTheme.primaryColor,
            tabs: const [
              Tab(text: 'Global'),
              Tab(text: 'Weekly'),
              Tab(text: 'Monthly'),
            ],
          ),
        ),
        
        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildLeaderboardTab(_globalEntries),
              _buildLeaderboardTab(_weeklyEntries),
              _buildLeaderboardTab(_monthlyEntries),
            ],
          ),
        ),
        
        // Current user stats (if found)
        if (_currentUserEntry != null)
          _buildCurrentUserStats(),
      ],
    );
  }

  Widget _buildLeaderboardTab(List<LeaderboardEntry> entries) {
    if (_isLoading) {
      return _buildLoadingView();
    }
    
    if (_errorMessage != null) {
      return _buildErrorView();
    }
    
    if (entries.isEmpty) {
      return _buildEmptyView();
    }
    
    return RefreshIndicator(
      onRefresh: _refreshLeaderboards,
      child: ListView.builder(
        itemCount: entries.length,
        itemBuilder: (context, index) {
          final entry = entries[index];
          final bool isCurrentUser = entry.userId == _currentUserId;
          
          return LeaderboardItem(
            rank: index + 1,
            username: entry.username,
            avatarUrl: entry.avatarUrl,
            score: entry.score,
            isCurrentUser: isCurrentUser,
            winRate: entry.winPercentage,
            onTap: () {
              // Navigate to user profile
              Navigator.pushNamed(context, '/profile', arguments: entry.userId);
            },
          );
        },
      ),
    );
  }

  Widget _buildLoadingView() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: ListView.builder(
        itemCount: 10,
        itemBuilder: (context, index) {
          return ListTile(
            leading: Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
            ),
            title: Container(
              height: 16,
              color: Colors.white,
            ),
            subtitle: Container(
              height: 12,
              width: 100,
              color: Colors.white,
            ),
            trailing: Container(
              height: 16,
              width: 50,
              color: Colors.white,
            ),
          );
        },
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
            color: AppTheme.error,
            size: 64,
          ),
          const SizedBox(height: 16),
          Text(
            _errorMessage ?? 'An error occurred',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _refreshLeaderboards,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.leaderboard,
            color: Colors.grey,
            size: 64,
          ),
          const SizedBox(height: 16),
          const Text(
            'No leaderboard data available yet',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _refreshLeaderboards,
            child: const Text('Refresh'),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentUserStats() {
    if (_currentUserEntry == null) return const SizedBox.shrink();
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        border: Border(top: BorderSide(color: AppTheme.primaryColor)),
      ),
      child: Row(
        children: [
          // User avatar
          CircleAvatar(
            radius: 20,
            backgroundColor: Colors.grey[200],
            backgroundImage: _currentUserEntry!.avatarUrl.isNotEmpty
                ? NetworkImage(_currentUserEntry!.avatarUrl)
                : null,
            child: _currentUserEntry!.avatarUrl.isEmpty
                ? const Icon(Icons.person, color: Colors.grey)
                : null,
          ),
          
          const SizedBox(width: 16),
          
          // User info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Your Ranking',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
                ),
                Text(
                  _currentUserEntry!.username,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          
          // User stats
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '#$_currentUserGlobalRank',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: AppTheme.primaryColor,
                ),
              ),
              Text(
                '${_currentUserEntry!.score} pts',
                style: TextStyle(
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
