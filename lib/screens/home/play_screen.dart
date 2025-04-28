import 'package:flutter/material.dart';
import 'package:mind_arena/screens/game/game_screen.dart';
import 'package:mind_arena/services/game_service.dart';
import 'package:mind_arena/services/websocket_service.dart';
import 'package:provider/provider.dart';

class PlayScreen extends StatefulWidget {
  const PlayScreen({Key? key}) : super(key: key);

  @override
  _PlayScreenState createState() => _PlayScreenState();
}

class _PlayScreenState extends State<PlayScreen> {
  bool _isMatchmaking = false;
  String _matchmakingStatus = '';

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildHeroSection(),
          const SizedBox(height: 24),
          _buildGameModesSection(),
          const SizedBox(height: 24),
          _buildLeaderboardSection(),
        ],
      ),
    );
  }

  Widget _buildHeroSection() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        height: 180,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            colors: [Colors.purple, Colors.blue],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Quick Match',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Challenge players from around the world in real-time quiz battles!',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 16),
              _isMatchmaking
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Text(
                                _matchmakingStatus,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        TextButton.icon(
                          icon: const Icon(Icons.cancel, color: Colors.white),
                          label: const Text('Cancel', style: TextStyle(color: Colors.white)),
                          onPressed: _cancelMatchmaking,
                          style: TextButton.styleFrom(
                            backgroundColor: Colors.white24,
                          ),
                        ),
                      ],
                    )
                  : ElevatedButton(
                      onPressed: _startMatchmaking,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.purple,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: const Text(
                        'PLAY NOW',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGameModesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Game Modes',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        
        // First row of game mode cards
        Row(
          children: [
            Expanded(
              child: InkWell(
                onTap: _startSinglePlayerGame,
                child: Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.person,
                          color: Colors.green,
                          size: 32,
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Single Player',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Practice with virtual bot',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildGameModeCard(
                'Tournament',
                'Compete for prizes',
                Icons.emoji_events,
                Colors.orange,
                () {
                  // Navigate to tournaments
                  _showComingSoonDialog('Tournaments');
                },
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // Second row of game mode cards
        Row(
          children: [
            Expanded(
              child: _buildGameModeCard(
                'Team Battles',
                'Play with friends',
                Icons.group,
                Colors.blue,
                () {
                  // Navigate to team battles
                  _showComingSoonDialog('Team Battles');
                },
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildGameModeCard(
                'Daily Challenge',
                'Earn bonus rewards',
                Icons.calendar_today,
                Colors.purple,
                () {
                  // Navigate to daily challenge
                  _showComingSoonDialog('Daily Challenges');
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLeaderboardSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Leaderboard',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Top Players This Week',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        _showComingSoonDialog('Full Leaderboard');
                      },
                      child: const Text('View All'),
                    ),
                  ],
                ),
                const Divider(),
                _buildLeaderboardItem('1', 'Alex M.', '12,540 pts', Colors.amber),
                _buildLeaderboardItem('2', 'Jessica K.', '11,350 pts', Colors.grey.shade400),
                _buildLeaderboardItem('3', 'Michael S.', '10,845 pts', Colors.brown.shade300),
              ],
            ),
          ),
        ),
      ],
    );
  }
  
  Widget _buildGameModeCard(
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                icon,
                color: color,
                size: 32,
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildLeaderboardItem(String rank, String name, String score, Color rankColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: rankColor,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                rank,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            name,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
            ),
          ),
          const Spacer(),
          Text(
            score,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  void _showComingSoonDialog(String feature) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('$feature Coming Soon!'),
          content: Text('The $feature feature is currently in development and will be available in a future update.'),
          actions: <Widget>[
            TextButton(
              child: const Text('OK'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  void _startMatchmaking() {
    setState(() {
      _isMatchmaking = true;
      _matchmakingStatus = 'Finding an opponent...';
    });
    
    // Get the WebSocket service from the provider
    final WebSocketService webSocketService = Provider.of<WebSocketService>(context, listen: false);
    
    // Start the matchmaking
    webSocketService.startMatchmaking();
    
    // Listen for matchmaking status updates
    webSocketService.addListener(() {
      if (webSocketService.matchmakingStatus.isNotEmpty) {
        setState(() {
          _matchmakingStatus = webSocketService.matchmakingStatus;
        });
      }
      
      // If a game has been found, navigate to the game screen
      if (webSocketService.currentGameState != null) {
        setState(() {
          _isMatchmaking = false;
        });
        
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const GameScreen(),
          ),
        ).then((_) {
          // When the user returns from the game screen, reset the matchmaking
          webSocketService.clearGameState();
        });
      }
    });
  }

  void _cancelMatchmaking() {
    setState(() {
      _isMatchmaking = false;
    });
    
    final WebSocketService webSocketService = Provider.of<WebSocketService>(context, listen: false);
    webSocketService.cancelMatchmaking();
  }

  void _startSinglePlayerGame() {
    // Get the GameService from the provider
    final GameService gameService = Provider.of<GameService>(context, listen: false);
    
    // Start a single player game
    gameService.startSinglePlayerGame();
    
    // Navigate to the game screen
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const GameScreen(isSinglePlayer: true),
      ),
    ).then((_) {
      // When the user returns from the game screen, reset the game
      gameService.resetGame();
    });
  }
}