import 'package:flutter/material.dart';
import 'package:mind_arena/config/theme.dart';
import 'package:mind_arena/services/analytics_service.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/services/database_service.dart';
import 'package:mind_arena/widgets/custom_button.dart';
import 'package:provider/provider.dart';

class MissionsScreen extends StatefulWidget {
  static const String routeName = '/missions';

  const MissionsScreen({Key? key}) : super(key: key);

  @override
  State<MissionsScreen> createState() => _MissionsScreenState();
}

class _MissionsScreenState extends State<MissionsScreen> {
  bool _isLoading = true;
  List<Mission> _dailyMissions = [];
  List<Mission> _weeklyMissions = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadMissions();
    
    // Log screen view
    Provider.of<AnalyticsService>(context, listen: false)
        .logScreenView(screenName: 'missions_screen');
  }

  Future<void> _loadMissions() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // For MVP, we'll use hardcoded missions
      // In a production app, these would come from the backend
      await Future.delayed(const Duration(milliseconds: 500)); // Simulate network delay
      
      if (mounted) {
        setState(() {
          _dailyMissions = [
            Mission(
              id: 'daily_play_3',
              title: 'Play 3 Matches',
              description: 'Complete 3 matches today',
              progress: 1,
              goal: 3,
              reward: 20,
              rewardType: 'coins',
              type: 'daily',
              isCompleted: false,
            ),
            Mission(
              id: 'daily_win_1',
              title: 'Win a Match',
              description: 'Win a match today',
              progress: 0,
              goal: 1,
              reward: 30,
              rewardType: 'coins',
              type: 'daily',
              isCompleted: false,
            ),
            Mission(
              id: 'daily_answer_15',
              title: 'Answer 15 Questions',
              description: 'Answer 15 questions correctly',
              progress: 7,
              goal: 15,
              reward: 25,
              rewardType: 'coins',
              type: 'daily',
              isCompleted: false,
            ),
          ];
          
          _weeklyMissions = [
            Mission(
              id: 'weekly_play_15',
              title: 'Play 15 Matches',
              description: 'Complete 15 matches this week',
              progress: 4,
              goal: 15,
              reward: 100,
              rewardType: 'coins',
              type: 'weekly',
              isCompleted: false,
            ),
            Mission(
              id: 'weekly_win_5',
              title: 'Win 5 Matches',
              description: 'Win 5 matches this week',
              progress: 1,
              goal: 5,
              reward: 150,
              rewardType: 'coins',
              type: 'weekly',
              isCompleted: false,
            ),
            Mission(
              id: 'weekly_categories_all',
              title: 'Quiz Master',
              description: 'Play a match in every quiz category',
              progress: 3,
              goal: 10,
              reward: 200,
              rewardType: 'coins',
              type: 'weekly',
              isCompleted: false,
            ),
            Mission(
              id: 'weekly_friends_3',
              title: 'Social Butterfly',
              description: 'Invite 3 friends to play',
              progress: 0,
              goal: 3,
              reward: 125,
              rewardType: 'coins',
              type: 'weekly',
              isCompleted: false,
            ),
          ];
          
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load missions: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _claimReward(Mission mission) async {
    if (!mission.isClaimable) return;
    
    setState(() {
      mission.isClaimInProgress = true;
    });
    
    try {
      final databaseService = Provider.of<DatabaseService>(context, listen: false);
      final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
      final authService = Provider.of<AuthService>(context, listen: false);
      final userId = authService.currentUser?.uid;
      
      if (userId == null) {
        throw Exception('User not authenticated');
      }
      
      // Update user's coins
      await databaseService.updateUserCoins(userId, mission.reward);
      
      // Log event
      analyticsService.logCoinTransaction(
        transactionType: 'earn',
        amount: mission.reward,
        reason: 'mission_reward',
      );
      
      if (mounted) {
        setState(() {
          mission.isCompleted = true;
          mission.isClaimInProgress = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Claimed ${mission.reward} coins!'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          mission.isClaimInProgress = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to claim reward: $e'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  Future<void> _refreshMissions() async {
    await _loadMissions();
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Column(
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
            child: const TabBar(
              labelColor: AppTheme.primaryColor,
              unselectedLabelColor: Colors.grey,
              indicatorColor: AppTheme.primaryColor,
              tabs: [
                Tab(text: 'Daily'),
                Tab(text: 'Weekly'),
              ],
            ),
          ),
          
          // Tab content
          Expanded(
            child: TabBarView(
              children: [
                _buildMissionsTab(_dailyMissions, 'daily'),
                _buildMissionsTab(_weeklyMissions, 'weekly'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMissionsTab(List<Mission> missions, String type) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }
    
    if (_errorMessage != null) {
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
              _errorMessage!,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _refreshMissions,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }
    
    if (missions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.assignment,
              color: Colors.grey,
              size: 64,
            ),
            const SizedBox(height: 16),
            Text(
              'No $type missions available',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _refreshMissions,
              child: const Text('Refresh'),
            ),
          ],
        ),
      );
    }
    
    return RefreshIndicator(
      onRefresh: _refreshMissions,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: missions.length,
        itemBuilder: (context, index) {
          return _buildMissionCard(missions[index]);
        },
      ),
    );
  }

  Widget _buildMissionCard(Mission mission) {
    final double progress = mission.progress / mission.goal;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Mission title
            Row(
              children: [
                Icon(
                  _getMissionIcon(mission.id),
                  color: AppTheme.primaryColor,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    mission.title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: mission.type == 'daily'
                        ? AppTheme.primaryColor.withOpacity(0.1)
                        : AppTheme.secondaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    mission.type == 'daily' ? 'Daily' : 'Weekly',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: mission.type == 'daily'
                          ? AppTheme.primaryColor
                          : AppTheme.secondaryColor,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Mission description
            Text(
              mission.description,
              style: TextStyle(
                color: Colors.grey[600],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: Colors.grey[200],
                color: AppTheme.primaryColor,
                minHeight: 8,
              ),
            ),
            
            const SizedBox(height: 8),
            
            // Progress text
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${mission.progress}/${mission.goal}',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '${(progress * 100).toInt()}%',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Reward and claim button
            Row(
              children: [
                // Reward info
                Expanded(
                  child: Row(
                    children: [
                      Icon(
                        mission.rewardType == 'coins'
                            ? Icons.monetization_on
                            : Icons.card_giftcard,
                        color: mission.rewardType == 'coins'
                            ? AppTheme.coinColor
                            : AppTheme.primaryColor,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${mission.reward} ${mission.rewardType}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Claim button
                if (mission.isCompleted)
                  const Chip(
                    label: Text('Claimed'),
                    backgroundColor: Colors.grey,
                    labelStyle: TextStyle(color: Colors.white),
                  )
                else
                  CustomButton(
                    onPressed: mission.isClaimable
                        ? () => _claimReward(mission)
                        : null,
                    text: 'CLAIM',
                    color: AppTheme.primaryColor,
                    height: 36,
                    width: 100,
                    isLoading: mission.isClaimInProgress,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _getMissionIcon(String missionId) {
    if (missionId.contains('play')) return Icons.sports_esports;
    if (missionId.contains('win')) return Icons.emoji_events;
    if (missionId.contains('answer')) return Icons.question_answer;
    if (missionId.contains('categories')) return Icons.category;
    if (missionId.contains('friends')) return Icons.people;
    return Icons.assignment;
  }
}

class Mission {
  final String id;
  final String title;
  final String description;
  final int progress;
  final int goal;
  final int reward;
  final String rewardType;
  final String type; // 'daily' or 'weekly'
  bool isCompleted;
  bool isClaimInProgress;

  Mission({
    required this.id,
    required this.title,
    required this.description,
    required this.progress,
    required this.goal,
    required this.reward,
    required this.rewardType,
    required this.type,
    this.isCompleted = false,
    this.isClaimInProgress = false,
  });

  bool get isClaimable => progress >= goal && !isCompleted;
}
