import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/models/clan_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/services/firebase_service.dart';
import 'package:mind_arena/screens/clans/clan_details_screen.dart';
import 'package:mind_arena/screens/clans/create_clan_screen.dart';

class ClansTab extends StatefulWidget {
  final User? user;

  const ClansTab({Key? key, this.user}) : super(key: key);

  @override
  _ClansTabState createState() => _ClansTabState();
}

class _ClansTabState extends State<ClansTab> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  List<Clan> _topClans = [];
  Clan? _userClan;
  TabController? _tabController;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadClans();
  }
  
  @override
  void dispose() {
    _tabController?.dispose();
    super.dispose();
  }
  
  Future<void> _loadClans() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      final firebaseService = FirebaseService();
      
      // For demo purposes, we'll create mock data
      _topClans = [
        Clan(
          id: '1',
          name: 'Quiz Masters',
          description: 'Top competitive quiz clan for serious players only!',
          leaderId: '101',
          membersCount: 47,
          totalScore: 285000,
          avatarUrl: 'https://ui-avatars.com/api/?name=QM',
        ),
        Clan(
          id: '2',
          name: 'Brain Busters',
          description: 'We bust brains with our knowledge. Join us to become smarter!',
          leaderId: '102',
          membersCount: 42,
          totalScore: 252000,
          avatarUrl: 'https://ui-avatars.com/api/?name=BB',
        ),
        Clan(
          id: '3',
          name: 'Trivia Titans',
          description: 'For those who live and breathe trivia!',
          leaderId: '103',
          membersCount: 39,
          totalScore: 236000,
          avatarUrl: 'https://ui-avatars.com/api/?name=TT',
        ),
        Clan(
          id: '4',
          name: 'Knowledge Knights',
          description: 'Defenders of knowledge and seekers of truth',
          leaderId: '104',
          membersCount: 38,
          totalScore: 221000,
          avatarUrl: 'https://ui-avatars.com/api/?name=KK',
        ),
        Clan(
          id: '5',
          name: 'Wisdom Warriors',
          description: 'Fighting ignorance with facts!',
          leaderId: '105',
          membersCount: 35,
          totalScore: 209000,
          avatarUrl: 'https://ui-avatars.com/api/?name=WW',
        ),
      ];
      
      // For demo, if user id is even, they belong to a clan
      if (widget.user != null && (widget.user!.id ?? 0) % 2 == 0) {
        _userClan = Clan(
          id: '3',
          name: 'Trivia Titans',
          description: 'For those who live and breathe trivia!',
          leaderId: '103',
          membersCount: 39,
          totalScore: 236000,
          avatarUrl: 'https://ui-avatars.com/api/?name=TT',
          members: [
            ClanMember(
              userId: '103',
              clanId: '3',
              role: 'leader',
              username: 'TriviaKing',
              displayName: 'Trivia King',
            ),
            ClanMember(
              userId: widget.user!.id.toString(),
              clanId: '3',
              role: 'member',
              username: widget.user!.username,
              displayName: widget.user!.displayName,
            ),
            ClanMember(
              userId: '106',
              clanId: '3',
              role: 'officer',
              username: 'QuizWhiz',
              displayName: 'Quiz Whiz',
            ),
            ClanMember(
              userId: '107',
              clanId: '3',
              role: 'member',
              username: 'BrainiacGamer',
              displayName: 'Brainiac Gamer',
            ),
          ],
        );
      }
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading clans: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  void _navigateToClanDetails(Clan clan) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ClanDetailsScreen(
          clan: clan,
          user: widget.user,
          isMember: clan.id == _userClan?.id,
        ),
      ),
    );
  }
  
  void _navigateToCreateClan() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => CreateClanScreen(
          user: widget.user,
        ),
      ),
    ).then((_) {
      // Refresh after returning from create screen
      _loadClans();
    });
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
          : Column(
              children: [
                // Tabs
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.backgroundColor,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: TabBar(
                    controller: _tabController,
                    indicatorColor: AppTheme.primaryColor,
                    labelColor: AppTheme.primaryColor,
                    unselectedLabelColor: AppTheme.secondaryTextColor,
                    tabs: [
                      Tab(text: _userClan != null ? 'MY CLAN' : 'JOIN CLAN'),
                      const Tab(text: 'TOP CLANS'),
                    ],
                  ),
                ),
                
                // Tab Content
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // My Clan / Join Clan Tab
                      _userClan != null
                          ? _buildMyClanTab()
                          : _buildJoinClanTab(),
                      
                      // Top Clans Tab
                      _buildTopClansTab(),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
  
  Widget _buildMyClanTab() {
    if (_userClan == null) {
      return _buildJoinClanTab();
    }
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Clan Card
          Card(
            color: AppTheme.cardColor,
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Clan Header
                Container(
                  decoration: BoxDecoration(
                    gradient: AppTheme.primaryGradient,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      // Clan Avatar
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: Colors.white.withOpacity(0.2),
                        child: Text(
                          _userClan!.name.substring(0, 2),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      
                      // Clan Name and Info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _userClan!.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 20,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${_userClan!.membersCount} members',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.8),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      // Action Button
                      ElevatedButton(
                        onPressed: () => _navigateToClanDetails(_userClan!),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppTheme.primaryColor,
                        ),
                        child: const Text('VIEW'),
                      ),
                    ],
                  ),
                ),
                
                // Clan Stats
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Clan Stats',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                      const SizedBox(height: 12),
                      
                      // Total Score
                      _buildStatRow(
                        'Total Score',
                        '${_userClan!.totalScore}',
                        Icons.stars,
                        Colors.amber,
                      ),
                      const SizedBox(height: 8),
                      
                      // Global Rank
                      _buildStatRow(
                        'Global Rank',
                        '#3',
                        Icons.leaderboard,
                        Colors.green,
                      ),
                      const SizedBox(height: 8),
                      
                      // Weekly Performance
                      _buildStatRow(
                        'Weekly Performance',
                        '+12,500 points',
                        Icons.trending_up,
                        Colors.green,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Members
          const Text(
            'MEMBERS',
            style: TextStyle(
              color: AppTheme.secondaryTextColor,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 8),
          
          // Member List
          Card(
            color: AppTheme.cardColor,
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _userClan!.members?.length ?? 0,
              itemBuilder: (context, index) {
                final member = _userClan!.members![index];
                final bool isCurrentUser = member.userId == widget.user?.id.toString();
                
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: member.isLeader
                        ? Colors.amber
                        : member.isOfficer
                            ? Colors.blue
                            : AppTheme.primaryColor,
                    child: Text(
                      member.username?[0] ?? 'U',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                  title: Row(
                    children: [
                      Text(
                        member.displayName ?? member.username ?? 'Unknown',
                        style: TextStyle(
                          color: isCurrentUser
                              ? AppTheme.primaryColor
                              : Colors.white,
                          fontWeight: isCurrentUser
                              ? FontWeight.bold
                              : FontWeight.normal,
                        ),
                      ),
                      if (isCurrentUser)
                        Container(
                          margin: const EdgeInsets.only(left: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'YOU',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  subtitle: Text(
                    member.role.toUpperCase(),
                    style: TextStyle(
                      color: member.isLeader
                          ? Colors.amber
                          : member.isOfficer
                              ? Colors.blue
                              : AppTheme.secondaryTextColor,
                      fontSize: 12,
                    ),
                  ),
                  trailing: member.isLeader
                      ? const Icon(
                          Icons.shield,
                          color: Colors.amber,
                        )
                      : member.isOfficer
                          ? const Icon(
                              Icons.star,
                              color: Colors.blue,
                            )
                          : null,
                );
              },
            ),
          ),
          const SizedBox(height: 24),
          
          // Weekly Challenges
          const Text(
            'WEEKLY CHALLENGES',
            style: TextStyle(
              color: AppTheme.secondaryTextColor,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 8),
          
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
                  _buildChallengeItem(
                    'Win 50 matches as a clan',
                    32,
                    50,
                    'Reward: +500 clan score',
                  ),
                  const SizedBox(height: 16),
                  _buildChallengeItem(
                    'Answer 1000 questions correctly',
                    785,
                    1000,
                    'Reward: +1000 clan score',
                  ),
                  const SizedBox(height: 16),
                  _buildChallengeItem(
                    'Complete 5 tournaments',
                    3,
                    5,
                    'Reward: +1500 clan score',
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildJoinClanTab() {
    return Column(
      children: [
        // No Clan Banner
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'You are not in a clan yet!',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Join a clan or create your own to compete in clan challenges and earn exclusive rewards.',
                style: TextStyle(color: Colors.white),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  // Join Clan Button
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        _tabController?.animateTo(1);
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('BROWSE CLANS'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Create Clan Button
                  Expanded(
                    child: ElevatedButton(
                      onPressed: widget.user != null
                          ? _navigateToCreateClan
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppTheme.primaryColor,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('CREATE CLAN'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        
        // Benefits of Joining a Clan
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'BENEFITS OF JOINING A CLAN',
            style: TextStyle(
              color: AppTheme.secondaryTextColor,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
        ),
        const SizedBox(height: 8),
        
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildBenefitCard(
                'Team Competition',
                'Compete against other clans in weekly and monthly challenges',
                Icons.groups,
              ),
              _buildBenefitCard(
                'Exclusive Rewards',
                'Earn special clan-only avatars, banners, and other rewards',
                Icons.card_giftcard,
              ),
              _buildBenefitCard(
                'Bonus Experience',
                'Get 10% bonus XP when playing with clan members',
                Icons.add_chart,
              ),
              _buildBenefitCard(
                'Clan Chat',
                'Communicate with clan members and share strategies',
                Icons.chat,
              ),
              _buildBenefitCard(
                'Clan Tournaments',
                'Participate in special clan-only tournaments with bigger prizes',
                Icons.emoji_events,
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildTopClansTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _topClans.length,
      itemBuilder: (context, index) {
        final clan = _topClans[index];
        final bool isUserClan = clan.id == _userClan?.id;
        
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          color: isUserClan
              ? AppTheme.primaryColor.withOpacity(0.2)
              : AppTheme.cardColor,
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: isUserClan ? AppTheme.primaryColor : Colors.transparent,
              width: isUserClan ? 1 : 0,
            ),
          ),
          child: InkWell(
            onTap: () => _navigateToClanDetails(clan),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Rank
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: index == 0
                          ? Colors.amber
                          : index == 1
                              ? Colors.grey.shade300
                              : index == 2
                                  ? Colors.brown.shade300
                                  : Colors.grey.shade800,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '#${index + 1}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: index <= 2 ? Colors.black : Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  
                  // Clan Avatar
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: AppTheme.primaryColor,
                    child: Text(
                      clan.name.substring(0, 2),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  
                  // Clan Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                clan.name,
                                style: TextStyle(
                                  color: isUserClan
                                      ? AppTheme.primaryColor
                                      : Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            if (isUserClan)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryColor,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  'YOUR CLAN',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          clan.description,
                          style: const TextStyle(
                            color: AppTheme.secondaryTextColor,
                            fontSize: 14,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(
                              Icons.people,
                              size: 16,
                              color: AppTheme.secondaryTextColor,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${clan.membersCount} members',
                              style: const TextStyle(
                                color: AppTheme.secondaryTextColor,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(width: 16),
                            const Icon(
                              Icons.stars,
                              size: 16,
                              color: Colors.amber,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${clan.totalScore}',
                              style: const TextStyle(
                                color: Colors.amber,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildStatRow(String label, String value, IconData icon, Color iconColor) {
    return Row(
      children: [
        Icon(
          icon,
          color: iconColor,
          size: 20,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: AppTheme.secondaryTextColor,
            ),
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
    );
  }
  
  Widget _buildChallengeItem(String title, int progress, int total, String reward) {
    final double percentage = progress / total;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: percentage,
                  backgroundColor: Colors.grey.shade800,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    percentage == 1 ? Colors.green : AppTheme.primaryColor,
                  ),
                  minHeight: 8,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Text(
              '$progress/$total',
              style: TextStyle(
                color: percentage == 1 ? Colors.green : Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          reward,
          style: const TextStyle(
            color: Colors.amber,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
  
  Widget _buildBenefitCard(String title, String description, IconData icon) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: AppTheme.cardColor,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: AppTheme.primaryColor,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: const TextStyle(
                      color: AppTheme.secondaryTextColor,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}