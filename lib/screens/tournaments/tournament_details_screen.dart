import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/models/tournament_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/services/firebase_service.dart';
import 'package:mind_arena/widgets/loading_overlay.dart';
import 'package:intl/intl.dart';

class TournamentDetailsScreen extends StatefulWidget {
  final Tournament tournament;
  final User? user;

  const TournamentDetailsScreen({
    Key? key,
    required this.tournament,
    this.user,
  }) : super(key: key);

  @override
  _TournamentDetailsScreenState createState() => _TournamentDetailsScreenState();
}

class _TournamentDetailsScreenState extends State<TournamentDetailsScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = false;
  bool _hasJoined = false;
  TabController? _tabController;
  List<Map<String, dynamic>> _leaderboard = [];
  List<Map<String, dynamic>> _prizes = [];
  List<Map<String, dynamic>> _rules = [];
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadTournamentDetails();
  }
  
  @override
  void dispose() {
    _tabController?.dispose();
    super.dispose();
  }
  
  Future<void> _loadTournamentDetails() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      // For demo purposes, we'll create mock data
      _leaderboard = List.generate(15, (index) {
        final score = 5000 - (index * 350 + (index > 2 ? (50 * index) : 0));
        return {
          'rank': index + 1,
          'username': index == 0
              ? 'QuizMaster'
              : index == 1
                  ? 'BrainWhiz'
                  : index == 2
                      ? 'TriviaKing'
                      : 'Player${100 + index}',
          'score': score,
          'avatar': 'https://ui-avatars.com/api/?name=P${index + 1}',
          'isCurrentUser': index == 7, // Demo: current user is at rank 8
        };
      });
      
      _prizes = widget.tournament.prizes?.map((prize) => prize.toMap()).toList() ?? [];
      
      _rules = [
        {
          'title': 'Tournament Duration',
          'description': 'Tournament runs from ${DateFormat('MMM d, h:mm a').format(widget.tournament.startDate)} to ${DateFormat('MMM d, h:mm a').format(widget.tournament.endDate)}. All matches must be completed within this timeframe.',
        },
        {
          'title': 'Entry Requirements',
          'description': 'Entry fee is ${widget.tournament.entryFee} coins. Players must have a valid account and sufficient coins to join.',
        },
        {
          'title': 'Match Format',
          'description': 'Each player will play 5 matches. Your top 3 scores will count towards your tournament ranking.',
        },
        {
          'title': 'Scoring',
          'description': 'Points are awarded based on correct answers and speed. Tiebreakers are determined by average response time.',
        },
        {
          'title': 'Prize Distribution',
          'description': 'Prizes will be awarded at the end of the tournament. Winners will receive their rewards automatically.',
        },
        {
          'title': 'Fair Play',
          'description': 'Any suspicious activity or cheating will result in disqualification. The MindArena team\'s decision is final.',
        },
      ];
      
      // Check if user has joined
      _hasJoined = widget.user?.id == 8 || (widget.user?.id ?? 0) % 5 == 0; // Demo purpose
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading tournament details: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  Future<void> _joinTournament() async {
    if (widget.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You need to be logged in to join tournaments')),
      );
      return;
    }
    
    if (widget.tournament.currentPlayers >= widget.tournament.maxPlayers) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tournament is full')),
      );
      return;
    }
    
    if ((widget.user?.coins ?? 0) < widget.tournament.entryFee) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Not enough coins to join this tournament')),
      );
      return;
    }
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final firebaseService = FirebaseService();
      
      // For demo purposes, we'll just update the UI
      await Future.delayed(const Duration(milliseconds: 1500));
      
      setState(() {
        _hasJoined = true;
        _isLoading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Successfully joined the tournament!'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      print('Error joining tournament: $e');
      setState(() {
        _isLoading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to join tournament: $e')),
      );
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
          child: SafeArea(
            child: CustomScrollView(
              slivers: [
                // App Bar
                SliverAppBar(
                  expandedHeight: 200.0,
                  floating: false,
                  pinned: true,
                  backgroundColor: AppTheme.backgroundColor,
                  flexibleSpace: FlexibleSpaceBar(
                    title: Text(
                      widget.tournament.name,
                      style: const TextStyle(
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
                          
                          // Content
                          Positioned(
                            bottom: 60,
                            left: 16,
                            right: 16,
                            child: Row(
                              children: [
                                // Trophy Icon
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.emoji_events,
                                    color: Colors.white,
                                    size: 40,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                
                                // Tournament Details
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 4,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                        child: Text(
                                          widget.tournament.status.toUpperCase(),
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Prize Pool: ${widget.tournament.getTotalPrizePool()} coins',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
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
                
                // Tournament Status Card
                SliverToBoxAdapter(
                  child: Card(
                    margin: const EdgeInsets.all(16),
                    color: AppTheme.cardColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: _buildInfoItem(
                                  'Entry Fee',
                                  '${widget.tournament.entryFee}',
                                  Icons.monetization_on,
                                ),
                              ),
                              Expanded(
                                child: _buildInfoItem(
                                  'Players',
                                  '${widget.tournament.currentPlayers}/${widget.tournament.maxPlayers}',
                                  Icons.people,
                                ),
                              ),
                              Expanded(
                                child: _buildInfoItem(
                                  'Status',
                                  widget.tournament.timeStatus,
                                  Icons.timer,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          
                          // Join Button
                          if (!_hasJoined && widget.tournament.isUpcoming)
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: (widget.user?.coins ?? 0) >= widget.tournament.entryFee
                                    ? _joinTournament
                                    : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primaryColor,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                ),
                                child: Text(
                                  (widget.user?.coins ?? 0) >= widget.tournament.entryFee
                                      ? 'JOIN TOURNAMENT'
                                      : 'NOT ENOUGH COINS',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          
                          // Already Joined
                          if (_hasJoined)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: Colors.green.shade900.withOpacity(0.3),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.green.shade700),
                              ),
                              alignment: Alignment.center,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: const [
                                  Icon(
                                    Icons.check_circle,
                                    color: Colors.green,
                                    size: 16,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'TOURNAMENT JOINED',
                                    style: TextStyle(
                                      color: Colors.green,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          
                          // Play Button (if active and joined)
                          if (_hasJoined && widget.tournament.isActive)
                            Padding(
                              padding: const EdgeInsets.only(top: 12.0),
                              child: SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () {
                                    // Navigate to tournament play screen
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.amber,
                                    foregroundColor: Colors.black,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                  ),
                                  child: const Text(
                                    'PLAY NOW',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          
                          // Entry Closed
                          if (!_hasJoined && widget.tournament.isActive)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade800,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              alignment: Alignment.center,
                              child: const Text(
                                'ENTRY CLOSED',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          
                          // Tournament ended
                          if (widget.tournament.isCompleted)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade800,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              alignment: Alignment.center,
                              child: const Text(
                                'TOURNAMENT ENDED',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
                
                // Tabs
                SliverPersistentHeader(
                  delegate: _SliverAppBarDelegate(
                    TabBar(
                      controller: _tabController,
                      indicatorColor: AppTheme.primaryColor,
                      labelColor: AppTheme.primaryColor,
                      unselectedLabelColor: AppTheme.secondaryTextColor,
                      tabs: const [
                        Tab(text: 'LEADERBOARD'),
                        Tab(text: 'PRIZES'),
                        Tab(text: 'RULES'),
                      ],
                    ),
                  ),
                  pinned: true,
                ),
                
                // Tab Content
                SliverFillRemaining(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // Leaderboard Tab
                      _buildLeaderboardTab(),
                      
                      // Prizes Tab
                      _buildPrizesTab(),
                      
                      // Rules Tab
                      _buildRulesTab(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildInfoItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(
          icon,
          color: AppTheme.primaryColor,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.secondaryTextColor,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
  
  Widget _buildLeaderboardTab() {
    if (_leaderboard.isEmpty) {
      return const Center(
        child: Text(
          'No leaderboard data available yet',
          style: TextStyle(color: AppTheme.secondaryTextColor),
        ),
      );
    }
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _leaderboard.length,
      itemBuilder: (context, index) {
        final player = _leaderboard[index];
        final bool isCurrentUser = player['isCurrentUser'] == true;
        final int rank = player['rank'];
        
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isCurrentUser
                ? AppTheme.primaryColor.withOpacity(0.2)
                : AppTheme.cardColor,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isCurrentUser ? AppTheme.primaryColor : Colors.transparent,
            ),
          ),
          child: Row(
            children: [
              // Rank
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: rank == 1
                      ? Colors.amber
                      : rank == 2
                          ? Colors.grey.shade300
                          : rank == 3
                              ? Colors.brown.shade300
                              : Colors.grey.shade800,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  '$rank',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: rank <= 3 ? Colors.black : Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              
              // Avatar
              CircleAvatar(
                radius: 16,
                backgroundColor: isCurrentUser
                    ? AppTheme.primaryColor
                    : Colors.grey.shade700,
                child: Text(
                  player['username'][0],
                  style: const TextStyle(color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              
              // Username and Score
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      player['username'],
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isCurrentUser
                            ? AppTheme.primaryColor
                            : Colors.white,
                      ),
                    ),
                    if (isCurrentUser)
                      const Text(
                        'You',
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
              
              // Score
              Text(
                '${player['score']}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isCurrentUser
                      ? AppTheme.primaryColor
                      : Colors.white,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
  
  Widget _buildPrizesTab() {
    if (_prizes.isEmpty) {
      return const Center(
        child: Text(
          'No prize information available',
          style: TextStyle(color: AppTheme.secondaryTextColor),
        ),
      );
    }
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _prizes.length,
      itemBuilder: (context, index) {
        final prize = _prizes[index];
        final rank = prize['rank'];
        
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          color: rank == 1
              ? Colors.amber.withOpacity(0.2)
              : rank == 2
                  ? Colors.grey.shade300.withOpacity(0.1)
                  : rank == 3
                      ? Colors.brown.shade300.withOpacity(0.1)
                      : AppTheme.cardColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(
              color: rank == 1
                  ? Colors.amber
                  : rank == 2
                      ? Colors.grey.shade300
                      : rank == 3
                          ? Colors.brown.shade300
                          : Colors.transparent,
              width: rank <= 3 ? 1 : 0,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Rank
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: rank == 1
                        ? Colors.amber
                        : rank == 2
                            ? Colors.grey.shade300
                            : rank == 3
                                ? Colors.brown.shade300
                                : Colors.grey.shade800,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '$rank',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: rank <= 3 ? Colors.black : Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                
                // Prize details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        prize['name'],
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      if (prize['type'] == 'coins')
                        Row(
                          children: [
                            const Icon(
                              Icons.monetization_on,
                              size: 16,
                              color: Colors.amber,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${prize['amount']} coins',
                              style: const TextStyle(
                                color: Colors.amber,
                              ),
                            ),
                          ],
                        ),
                      if (prize['type'] == 'avatar')
                        Row(
                          children: [
                            const Icon(
                              Icons.face,
                              size: 16,
                              color: Colors.purple,
                            ),
                            const SizedBox(width: 4),
                            const Text(
                              'Exclusive Avatar',
                              style: TextStyle(
                                color: Colors.purple,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
                
                // Trophy for top 3
                if (rank <= 3)
                  Icon(
                    Icons.emoji_events,
                    color: rank == 1
                        ? Colors.amber
                        : rank == 2
                            ? Colors.grey.shade300
                            : Colors.brown.shade300,
                    size: 24,
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildRulesTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _rules.length,
      itemBuilder: (context, index) {
        final rule = _rules[index];
        
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      rule['title'],
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.only(left: 36),
                child: Text(
                  rule['description'],
                  style: const TextStyle(
                    color: AppTheme.secondaryTextColor,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar _tabBar;

  _SliverAppBarDelegate(this._tabBar);

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppTheme.backgroundColor,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}