import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/services/game_service.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/utils/app_theme.dart';
import 'package:mind_arena/widgets/gradient_button.dart';
import 'package:provider/provider.dart';
import 'dart:async';

class PlayScreen extends StatefulWidget {
  const PlayScreen({Key? key}) : super(key: key);

  @override
  _PlayScreenState createState() => _PlayScreenState();
}

class _PlayScreenState extends State<PlayScreen> {
  bool _isMatchmaking = false;
  String _matchmakingStatus = '';
  Timer? _statusTimer;
  int _onlineUsers = 0;

  @override
  void initState() {
    super.initState();
    _getOnlineUsersCount();
    
    // Set up a timer to periodically update the online user count
    _statusTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      _getOnlineUsersCount();
    });
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    super.dispose();
  }

  void _getOnlineUsersCount() {
    final gameService = Provider.of<GameService>(context, listen: false);
    gameService.getOnlineUsersCount().then((count) {
      if (mounted) {
        setState(() {
          _onlineUsers = count;
        });
      }
    });
  }

  void _startQuickMatch() {
    final gameService = Provider.of<GameService>(context, listen: false);
    setState(() {
      _isMatchmaking = true;
      _matchmakingStatus = 'Looking for opponents...';
    });
    
    gameService.startMatchmaking();
    
    // Set up listener for matchmaking status updates
    gameService.onMatchmakingStatusChanged = (status) {
      if (mounted) {
        setState(() {
          _matchmakingStatus = status;
        });
      }
    };
    
    // Set up listener for when a match is found
    gameService.onMatchFound = () {
      if (mounted) {
        setState(() {
          _isMatchmaking = false;
        });
        // Navigate to the game screen when a match is found
        Navigator.pushNamed(context, '/game');
      }
    };
  }

  void _cancelMatchmaking() {
    final gameService = Provider.of<GameService>(context, listen: false);
    gameService.cancelMatchmaking();
    setState(() {
      _isMatchmaking = false;
    });
  }

  void _startSinglePlayerGame() {
    final gameService = Provider.of<GameService>(context, listen: false);
    gameService.startSinglePlayerGame();
    
    // Set up listener for when the game is ready
    gameService.onMatchFound = () {
      // Navigate to the game screen
      Navigator.pushNamed(context, '/game');
    };
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthService>(context).currentUser;
    
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome message with username
            if (user != null)
              Text(
                'Welcome, ${user.username}!',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            const SizedBox(height: 8),
            
            // Online users count
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.green),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.people,
                    color: Colors.green,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '$_onlineUsers ${_onlineUsers == 1 ? 'player' : 'players'} online',
                    style: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            // Game modes section
            const Text(
              'GAME MODES',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 16),
            
            // Quick Match Card
            _buildGameModeCard(
              title: 'Quick Match',
              description: 'Play a fast-paced quiz battle against another player!',
              icon: Icons.bolt,
              color: AppTheme.primaryColor,
              onTap: _isMatchmaking ? _cancelMatchmaking : _startQuickMatch,
              buttonText: _isMatchmaking ? 'Cancel' : 'Start Match',
              isLoading: _isMatchmaking,
              statusText: _isMatchmaking ? _matchmakingStatus : null,
            ),
            const SizedBox(height: 16),
            
            // Bot Match Card
            _buildGameModeCard(
              title: 'Play with Virtual Bot',
              description: 'Challenge a virtual bot to a quiz battle! Great for practice.',
              icon: Icons.smart_toy,
              color: Colors.purple,
              onTap: _startSinglePlayerGame,
              buttonText: 'Start Game',
            ),
            const SizedBox(height: 16),
            
            // Tournament Card
            _buildGameModeCard(
              title: 'Tournament',
              description: 'Compete in a tournament with multiple rounds. Entry fee: 50 tokens',
              icon: Icons.emoji_events,
              color: Colors.amber,
              onTap: () {
                // Navigate to tournament screen
                Navigator.pushNamed(context, '/tournaments');
              },
              buttonText: 'View Tournaments',
            ),
            const SizedBox(height: 16),
            
            // Clan Battle Card
            _buildGameModeCard(
              title: 'Clan Battle',
              description: 'Fight alongside your clan members against other clans!',
              icon: Icons.groups,
              color: Colors.blueGrey,
              onTap: () {
                // Navigate to clan battles screen
                Navigator.pushNamed(context, '/clan-battles');
              },
              buttonText: 'View Clan Battles',
              comingSoon: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGameModeCard({
    required String title,
    required String description,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    required String buttonText,
    bool isLoading = false,
    String? statusText,
    bool comingSoon = false,
  }) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    icon,
                    color: color,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (comingSoon)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'COMING SOON',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              description,
              style: TextStyle(
                color: Colors.grey[700],
              ),
            ),
            if (statusText != null) ...[
              const SizedBox(height: 12),
              Text(
                statusText,
                style: const TextStyle(
                  color: Colors.blue,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: GradientButton(
                onPressed: comingSoon ? null : onTap,
                child: isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(buttonText),
                gradient: LinearGradient(
                  colors: [
                    color,
                    color.withOpacity(0.7),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}