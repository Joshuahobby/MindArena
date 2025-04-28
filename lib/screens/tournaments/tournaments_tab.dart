import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/models/tournament_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/services/firebase_service.dart';
import 'package:mind_arena/screens/tournaments/tournament_details_screen.dart';
import 'package:intl/intl.dart';

class TournamentsTab extends StatefulWidget {
  final User? user;

  const TournamentsTab({Key? key, this.user}) : super(key: key);

  @override
  _TournamentsTabState createState() => _TournamentsTabState();
}

class _TournamentsTabState extends State<TournamentsTab> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  List<Tournament> _activeTournaments = [];
  List<Tournament> _upcomingTournaments = [];
  TabController? _tabController;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadTournaments();
  }
  
  @override
  void dispose() {
    _tabController?.dispose();
    super.dispose();
  }
  
  Future<void> _loadTournaments() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      final firebaseService = FirebaseService();
      
      // For demo purposes, we'll create mock tournaments
      _activeTournaments = [
        Tournament(
          id: '1',
          name: 'Weekly Challenge',
          startDate: DateTime.now().subtract(const Duration(days: 1)),
          endDate: DateTime.now().add(const Duration(days: 2)),
          entryFee: 100,
          maxPlayers: 50,
          currentPlayers: 32,
          status: 'active',
          prizes: [
            TournamentPrize(rank: 1, type: 'coins', name: 'First Place', amount: 1000),
            TournamentPrize(rank: 2, type: 'coins', name: 'Second Place', amount: 500),
            TournamentPrize(rank: 3, type: 'coins', name: 'Third Place', amount: 250),
          ],
        ),
        Tournament(
          id: '2',
          name: 'Science Showdown',
          startDate: DateTime.now().subtract(const Duration(hours: 5)),
          endDate: DateTime.now().add(const Duration(hours: 19)),
          entryFee: 50,
          maxPlayers: 100,
          currentPlayers: 87,
          status: 'active',
          prizes: [
            TournamentPrize(rank: 1, type: 'coins', name: 'First Place', amount: 500),
            TournamentPrize(rank: 2, type: 'coins', name: 'Second Place', amount: 250),
            TournamentPrize(rank: 3, type: 'coins', name: 'Third Place', amount: 100),
          ],
        ),
      ];
      
      _upcomingTournaments = [
        Tournament(
          id: '3',
          name: 'Weekend Warrior',
          startDate: DateTime.now().add(const Duration(days: 2)),
          endDate: DateTime.now().add(const Duration(days: 4)),
          entryFee: 200,
          maxPlayers: 200,
          currentPlayers: 15,
          status: 'upcoming',
          prizes: [
            TournamentPrize(rank: 1, type: 'coins', name: 'First Place', amount: 2000),
            TournamentPrize(rank: 2, type: 'coins', name: 'Second Place', amount: 1000),
            TournamentPrize(rank: 3, type: 'coins', name: 'Third Place', amount: 500),
            TournamentPrize(rank: 4, type: 'coins', name: 'Fourth Place', amount: 250),
            TournamentPrize(rank: 5, type: 'coins', name: 'Fifth Place', amount: 100),
          ],
        ),
        Tournament(
          id: '4',
          name: 'History Masters',
          startDate: DateTime.now().add(const Duration(days: 3)),
          endDate: DateTime.now().add(const Duration(days: 4)),
          entryFee: 75,
          maxPlayers: 100,
          currentPlayers: 8,
          status: 'upcoming',
          prizes: [
            TournamentPrize(rank: 1, type: 'coins', name: 'First Place', amount: 750),
            TournamentPrize(rank: 2, type: 'coins', name: 'Second Place', amount: 375),
            TournamentPrize(rank: 3, type: 'coins', name: 'Third Place', amount: 150),
          ],
        ),
        Tournament(
          id: '5',
          name: 'Monthly Championship',
          startDate: DateTime.now().add(const Duration(days: 7)),
          endDate: DateTime.now().add(const Duration(days: 14)),
          entryFee: 500,
          maxPlayers: 500,
          currentPlayers: 42,
          status: 'upcoming',
          prizes: [
            TournamentPrize(rank: 1, type: 'coins', name: 'First Place', amount: 5000),
            TournamentPrize(rank: 2, type: 'coins', name: 'Second Place', amount: 2500),
            TournamentPrize(rank: 3, type: 'coins', name: 'Third Place', amount: 1000),
            TournamentPrize(rank: 4, type: 'avatar', name: 'Exclusive Avatar', avatarId: 'special_champion'),
          ],
        ),
      ];
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading tournaments: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  void _navigateToTournamentDetails(Tournament tournament) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => TournamentDetailsScreen(
          tournament: tournament,
          user: widget.user,
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
                      const Tab(text: 'ACTIVE'),
                      const Tab(text: 'UPCOMING'),
                    ],
                  ),
                ),
                
                // Tab Content
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // Active Tournaments
                      _buildTournamentList(_activeTournaments, true),
                      
                      // Upcoming Tournaments
                      _buildTournamentList(_upcomingTournaments, false),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
  
  Widget _buildTournamentList(List<Tournament> tournaments, bool isActive) {
    if (tournaments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.emoji_events_outlined,
              size: 64,
              color: AppTheme.secondaryTextColor,
            ),
            const SizedBox(height: 16),
            Text(
              isActive
                  ? 'No Active Tournaments'
                  : 'No Upcoming Tournaments',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              isActive
                  ? 'Check back soon for new tournaments to join!'
                  : 'Stay tuned for new tournaments coming soon.',
              style: TextStyle(color: AppTheme.secondaryTextColor),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: tournaments.length,
      itemBuilder: (context, index) {
        final tournament = tournaments[index];
        return _buildTournamentCard(tournament, isActive);
      },
    );
  }
  
  Widget _buildTournamentCard(Tournament tournament, bool isActive) {
    final startDateStr = DateFormat('MMM d, h:mm a').format(tournament.startDate);
    final endDateStr = DateFormat('MMM d, h:mm a').format(tournament.endDate);
    final bool isFull = tournament.currentPlayers >= tournament.maxPlayers;
    final bool canAfford = widget.user != null && widget.user!.coins >= tournament.entryFee;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      color: AppTheme.cardColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Tournament Header
          Container(
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Icon
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.emoji_events,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 12),
                
                // Name and Status
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tournament.name,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        tournament.timeStatus,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Entry Fee
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.monetization_on,
                        color: Colors.amber,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${tournament.entryFee}',
                        style: const TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Tournament Details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Dates
                Row(
                  children: [
                    const Icon(
                      Icons.calendar_today,
                      size: 16,
                      color: AppTheme.secondaryTextColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'From $startDateStr to $endDateStr',
                      style: const TextStyle(
                        color: AppTheme.secondaryTextColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                
                // Players
                Row(
                  children: [
                    const Icon(
                      Icons.people,
                      size: 16,
                      color: AppTheme.secondaryTextColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Players: ${tournament.currentPlayers}/${tournament.maxPlayers}',
                      style: TextStyle(
                        color: isFull
                            ? Colors.red
                            : AppTheme.secondaryTextColor,
                      ),
                    ),
                    if (isFull)
                      Container(
                        margin: const EdgeInsets.only(left: 8),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'FULL',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                
                // Prize Pool
                Row(
                  children: [
                    const Icon(
                      Icons.card_giftcard,
                      size: 16,
                      color: Colors.amber,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Prize Pool: ${tournament.getTotalPrizePool()} coins',
                      style: const TextStyle(
                        color: Colors.amber,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Action Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _navigateToTournamentDetails(tournament),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(
                      isActive ? 'VIEW DETAILS' : 'VIEW DETAILS',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                
                // Warning if can't afford
                if (!canAfford)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Center(
                      child: Text(
                        'Not enough coins to join',
                        style: TextStyle(
                          color: Colors.red.shade300,
                          fontSize: 12,
                        ),
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
}