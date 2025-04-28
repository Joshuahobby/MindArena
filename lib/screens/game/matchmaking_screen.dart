import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mind_arena/config/constants.dart';
import 'package:mind_arena/config/theme.dart';
import 'package:mind_arena/screens/game/battle_screen.dart';
import 'package:mind_arena/services/analytics_service.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/services/quiz_service.dart';
import 'package:mind_arena/widgets/ad_banner_widget.dart';
import 'package:provider/provider.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';

class MatchmakingScreen extends StatefulWidget {
  static const String routeName = '/matchmaking';

  const MatchmakingScreen({Key? key}) : super(key: key);

  @override
  State<MatchmakingScreen> createState() => _MatchmakingScreenState();
}

class _MatchmakingScreenState extends State<MatchmakingScreen> {
  bool _isSearching = false;
  String? _matchId;
  Timer? _statusCheckTimer;
  int _playerCount = 1;
  int _secondsElapsed = 0;
  final int _maxWaitTime = AppConstants.matchmakingTimeout;
  String? _selectedCategory;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _startMatchmaking();
    
    // Log screen view
    Provider.of<AnalyticsService>(context, listen: false)
        .logScreenView(screenName: 'matchmaking_screen');
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    
    // Get category from arguments if provided
    final Map<String, dynamic>? args = 
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    
    if (args != null && args.containsKey('category')) {
      _selectedCategory = args['category'];
    }
  }

  @override
  void dispose() {
    _statusCheckTimer?.cancel();
    _cancelMatchmaking();
    super.dispose();
  }

  Future<void> _startMatchmaking() async {
    setState(() {
      _isSearching = true;
      _errorMessage = null;
      _secondsElapsed = 0;
    });

    try {
      final quizService = Provider.of<QuizService>(context, listen: false);
      final authService = Provider.of<AuthService>(context, listen: false);
      final userId = authService.currentUser!.uid;

      // Join matchmaking queue
      String matchId = await quizService.joinMatchmaking(userId);
      
      if (mounted) {
        setState(() {
          _matchId = matchId;
        });

        // Start periodic status check
        _statusCheckTimer = Timer.periodic(
          const Duration(seconds: 1),
          _checkMatchmakingStatus,
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSearching = false;
          _errorMessage = 'Failed to join matchmaking: $e';
        });
      }
    }
  }

  Future<void> _cancelMatchmaking() async {
    if (_matchId != null && _isSearching) {
      try {
        final quizService = Provider.of<QuizService>(context, listen: false);
        final authService = Provider.of<AuthService>(context, listen: false);
        final userId = authService.currentUser!.uid;
        
        await quizService.leaveMatchmaking(userId, _matchId!);
      } catch (e) {
        print('Error leaving matchmaking: $e');
        // Don't display error to user since they're already leaving
      }
    }
  }

  void _checkMatchmakingStatus(Timer timer) async {
    setState(() {
      _secondsElapsed++;
    });
    
    // Check for timeout
    if (_secondsElapsed >= _maxWaitTime) {
      timer.cancel();
      _handleMatchmakingTimeout();
      return;
    }
    
    // Skip status check if no match ID
    if (_matchId == null) return;
    
    try {
      final quizService = Provider.of<QuizService>(context, listen: false);
      final status = await quizService.getMatchmakingStatus(_matchId!);
      
      if (mounted) {
        setState(() {
          _playerCount = status['playerCount'] ?? 1;
        });
        
        // Check if match is starting or started
        if (status['status'] == 'starting' || status['status'] == 'started') {
          timer.cancel();
          
          // Get Firestore match ID
          String? firestoreMatchId = status['firestoreMatchId'];
          if (firestoreMatchId != null) {
            _navigateToBattle(firestoreMatchId);
          } else {
            _handleMatchmakingError('Match started without a valid ID');
          }
        } else if (status['status'] == 'cancelled') {
          timer.cancel();
          _handleMatchmakingError('Matchmaking was cancelled');
        }
      }
    } catch (e) {
      print('Error checking matchmaking status: $e');
      // Don't cancel timer on error, try again next tick
    }
  }

  void _navigateToBattle(String matchId) {
    // Log analytics event
    final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
    analyticsService.logMatchStart(
      matchId: matchId,
      playerCount: _playerCount,
    );
    
    // Navigate to battle screen
    Navigator.of(context).pushReplacementNamed(
      BattleScreen.routeName,
      arguments: {
        'matchId': matchId,
        'players': _playerCount,
      },
    );
  }

  void _handleMatchmakingTimeout() {
    setState(() {
      _isSearching = false;
      _errorMessage = 'Matchmaking timed out. Not enough players found.';
    });
  }

  void _handleMatchmakingError(String message) {
    setState(() {
      _isSearching = false;
      _errorMessage = message;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Finding Opponents'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () {
              _cancelMatchmaking();
              Navigator.of(context).pop();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Banner ad at top
          const AdBannerWidget(adPosition: 'matchmaking_top'),
          
          // Main content
          Expanded(
            child: Center(
              child: _errorMessage != null
                  ? _buildErrorView()
                  : _buildSearchingView(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchingView() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Loading animation
          SpinKitPulse(
            color: AppTheme.primaryColor,
            size: 100.0,
          ),
          
          const SizedBox(height: 32),
          
          // Status text
          Text(
            'Finding Opponents...',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 16),
          
          // Player count
          Text(
            'Players: $_playerCount/${AppConstants.maxPlayersPerMatch}',
            style: const TextStyle(
              fontSize: 18,
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Time elapsed
          Text(
            'Time elapsed: $_secondsElapsed seconds',
            style: const TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Category display if selected
          if (_selectedCategory != null)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color: AppTheme.secondaryColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.category),
                  const SizedBox(width: 8),
                  Text(
                    _getCategoryName(_selectedCategory!),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 64),
          
          // Cancel button
          TextButton.icon(
            onPressed: () {
              _cancelMatchmaking();
              Navigator.of(context).pop();
            },
            icon: const Icon(Icons.cancel),
            label: const Text('Cancel Search'),
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Info text
          Text(
            'The match will begin when ${AppConstants.minPlayersPerMatch}-${AppConstants.maxPlayersPerMatch} players join',
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Error icon
          const Icon(
            Icons.error_outline,
            color: Colors.red,
            size: 80,
          ),
          
          const SizedBox(height: 24),
          
          // Error message
          Text(
            _errorMessage ?? 'An unknown error occurred',
            style: const TextStyle(
              fontSize: 18,
              color: Colors.red,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 32),
          
          // Retry button
          ElevatedButton.icon(
            onPressed: _startMatchmaking,
            icon: const Icon(Icons.refresh),
            label: const Text('Try Again'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Go back button
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            child: const Text('Go Back'),
          ),
        ],
      ),
    );
  }

  String _getCategoryName(String categoryId) {
    final category = AppConstants.quizCategories.firstWhere(
      (c) => c['id'] == categoryId,
      orElse: () => {'name': 'Unknown'},
    );
    return category['name'] as String;
  }
}
