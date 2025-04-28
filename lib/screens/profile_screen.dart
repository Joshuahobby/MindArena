import 'package:flutter/material.dart';
import 'package:mind_arena/config/constants.dart';
import 'package:mind_arena/config/theme.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/services/analytics_service.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/utils/share_utils.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

class ProfileScreen extends StatefulWidget {
  static const String routeName = '/profile';
  
  final String? userId;
  
  const ProfileScreen({Key? key, this.userId}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  UserModel? _user;
  bool _isLoading = true;
  bool _isCurrentUser = false;
  String? _errorMessage;
  
  @override
  void initState() {
    super.initState();
    _loadUserData();
    
    // Log screen view
    Provider.of<AnalyticsService>(context, listen: false)
        .logScreenView(screenName: 'profile_screen');
  }
  
  Future<void> _loadUserData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final currentUser = authService.currentUser;
      
      // Determine which user to load
      final String userIdToLoad = widget.userId ?? currentUser?.uid ?? '';
      
      // Check if this is the current user's profile
      _isCurrentUser = currentUser != null && userIdToLoad == currentUser.uid;
      
      if (userIdToLoad.isEmpty) {
        throw Exception('No user ID provided');
      }
      
      // Load user data
      final user = await authService.getUserData(userIdToLoad);
      
      if (mounted) {
        setState(() {
          _user = user;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load user data: $e';
          _isLoading = false;
        });
      }
    }
  }
  
  Future<void> _signOut() async {
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      await authService.signOut();
      
      // Navigate to login screen
      if (mounted) {
        Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error signing out: $e'),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }
  
  void _shareProfile() {
    if (_user == null) return;
    
    ShareUtils.shareProfile(
      username: _user!.username,
      stats: {
        'matches': _user!.totalMatches,
        'wins': _user!.matchesWon,
        'points': _user!.totalPoints,
      },
    );
    
    // Log share event
    Provider.of<AnalyticsService>(context, listen: false).logShareAction(
      contentType: 'user_profile',
      shareMethod: 'social',
    );
  }
  
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(
        child: CircularProgressIndicator(),
      );
    }
    
    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                color: AppTheme.error,
                size: 64,
              ),
              SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.error),
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loadUserData,
                child: Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    
    if (_user == null) {
      return Center(
        child: Text('User not found'),
      );
    }
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Profile header
          _buildProfileHeader(),
          
          SizedBox(height: 24),
          
          // Stats cards
          _buildStatsCards(),
          
          SizedBox(height: 24),
          
          // Achievements section
          _buildAchievementsSection(),
          
          SizedBox(height: 24),
          
          // Actions section
          _buildActionsSection(),
          
          // Sign out button (only for current user)
          if (_isCurrentUser) ...[
            SizedBox(height: 36),
            OutlinedButton.icon(
              onPressed: _signOut,
              icon: Icon(Icons.logout),
              label: Text('Sign Out'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: BorderSide(color: Colors.red),
                padding: EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              ),
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildProfileHeader() {
    return Column(
      children: [
        // Avatar
        CircleAvatar(
          radius: 60,
          backgroundColor: Colors.grey[200],
          backgroundImage: _user!.avatarUrl.isNotEmpty
              ? NetworkImage(_user!.avatarUrl)
              : null,
          child: _user!.avatarUrl.isEmpty
              ? Icon(Icons.person, size: 60, color: Colors.grey)
              : null,
        ),
        
        SizedBox(height: 16),
        
        // Username
        Text(
          _user!.username,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        SizedBox(height: 8),
        
        // Performance level
        Container(
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          decoration: BoxDecoration(
            color: AppTheme.primaryColor,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            _user!.performanceLevel,
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        
        SizedBox(height: 8),
        
        // Join date
        Text(
          'Joined ${DateFormat.yMMMd().format(_user!.createdAt)}',
          style: TextStyle(
            color: Colors.grey[600],
          ),
        ),
        
        SizedBox(height: 8),
        
        // Coins
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.monetization_on, color: AppTheme.coinColor),
            SizedBox(width: 4),
            Text(
              '${_user!.coins} coins',
              style: TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ],
    );
  }
  
  Widget _buildStatsCards() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Statistics',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        SizedBox(height: 12),
        
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                title: 'Total Matches',
                value: _user!.totalMatches.toString(),
                icon: Icons.sports_esports,
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                title: 'Matches Won',
                value: _user!.matchesWon.toString(),
                icon: Icons.emoji_events,
              ),
            ),
          ],
        ),
        
        SizedBox(height: 12),
        
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                title: 'Win Rate',
                value: '${_user!.winPercentage.toStringAsFixed(1)}%',
                icon: Icons.percent,
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                title: 'Total Points',
                value: _user!.totalPoints.toString(),
                icon: Icons.stars,
              ),
            ),
          ],
        ),
      ],
    );
  }
  
  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
  }) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Icon(
              icon,
              size: 32,
              color: AppTheme.primaryColor,
            ),
            SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildAchievementsSection() {
    // For MVP, we'll show placeholder achievements
    // In a real app, these would come from the user data
    
    final List<Map<String, dynamic>> achievements = [
      {
        'title': 'First Win',
        'description': 'Win your first match',
        'icon': Icons.emoji_events,
        'isUnlocked': _user!.matchesWon > 0,
      },
      {
        'title': '10 Matches',
        'description': 'Play 10 matches',
        'icon': Icons.sports_esports,
        'isUnlocked': _user!.totalMatches >= 10,
      },
      {
        'title': '5 Wins',
        'description': 'Win 5 matches',
        'icon': Icons.workspace_premium,
        'isUnlocked': _user!.matchesWon >= 5,
      },
      {
        'title': '1000 Points',
        'description': 'Earn 1000 total points',
        'icon': Icons.flash_on,
        'isUnlocked': _user!.totalPoints >= 1000,
      },
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Achievements',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        SizedBox(height: 12),
        
        GridView.builder(
          shrinkWrap: true,
          physics: NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
          itemCount: achievements.length,
          itemBuilder: (context, index) {
            final achievement = achievements[index];
            return Card(
              color: achievement['isUnlocked']
                  ? AppTheme.primaryColor.withOpacity(0.1)
                  : Colors.grey[200],
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      achievement['icon'],
                      color: achievement['isUnlocked']
                          ? AppTheme.primaryColor
                          : Colors.grey,
                      size: 28,
                    ),
                    SizedBox(height: 8),
                    Text(
                      achievement['title'],
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: achievement['isUnlocked']
                            ? AppTheme.primaryColor
                            : Colors.grey[600],
                      ),
                      textAlign: TextAlign.center,
                    ),
                    Text(
                      achievement['description'],
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey[600],
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
  
  Widget _buildActionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Actions',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        SizedBox(height: 12),
        
        Card(
          child: Column(
            children: [
              // Share profile button
              ListTile(
                leading: Icon(Icons.share, color: AppTheme.secondaryColor),
                title: Text('Share Profile'),
                trailing: Icon(Icons.arrow_forward_ios, size: 16),
                onTap: _shareProfile,
              ),
              
              Divider(),
              
              // Edit profile (only for current user)
              if (_isCurrentUser)
                ListTile(
                  leading: Icon(Icons.edit, color: AppTheme.primaryColor),
                  title: Text('Edit Profile'),
                  trailing: Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {
                    // TODO: Implement edit profile screen
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Edit profile will be available in the next update!'),
                      ),
                    );
                  },
                ),
              
              // Friend request (only for other users)
              if (!_isCurrentUser)
                ListTile(
                  leading: Icon(Icons.person_add, color: AppTheme.primaryColor),
                  title: Text('Add Friend'),
                  trailing: Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {
                    // TODO: Implement friend request functionality
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Friend requests will be available in the next update!'),
                      ),
                    );
                  },
                ),
              
              // Play with this user (only for other users)
              if (!_isCurrentUser)
                ListTile(
                  leading: Icon(Icons.gamepad, color: AppTheme.secondaryColor),
                  title: Text('Invite to Play'),
                  trailing: Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {
                    // TODO: Implement play invitation functionality
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Play invitations will be available in the next update!'),
                      ),
                    );
                  },
                ),
              
              Divider(),
              
              // Account settings (only for current user)
              if (_isCurrentUser)
                ListTile(
                  leading: Icon(Icons.settings, color: Colors.grey),
                  title: Text('Account Settings'),
                  trailing: Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {
                    // TODO: Implement account settings screen
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Account settings will be available in the next update!'),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ],
    );
  }
}
