import 'package:flutter/material.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/screens/home/play_tab.dart';
import 'package:mind_arena/screens/tournaments/tournaments_tab.dart';
import 'package:mind_arena/screens/battle_pass/battle_pass_tab.dart';
import 'package:mind_arena/screens/clans/clans_tab.dart';
import 'package:mind_arena/screens/profile/profile_tab.dart';
import 'package:mind_arena/services/firebase_service.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/widgets/loading_overlay.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  bool _isLoading = true;
  User? _currentUser;
  final List<String> _tabTitles = [
    'Play',
    'Tournaments',
    'Battle Pass',
    'Clans',
    'Profile',
  ];

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final firebaseService = FirebaseService();
      final userProfile = await firebaseService.getCurrentUserProfile();
      
      setState(() {
        _currentUser = userProfile;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading user profile: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  Widget _getTabBody() {
    switch (_currentIndex) {
      case 0:
        return PlayTab(user: _currentUser);
      case 1:
        return TournamentsTab(user: _currentUser);
      case 2:
        return BattlePassTab(user: _currentUser);
      case 3:
        return ClansTab(user: _currentUser);
      case 4:
        return ProfileTab(user: _currentUser);
      default:
        return PlayTab(user: _currentUser);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LoadingOverlay(
      isLoading: _isLoading,
      loadingText: 'Loading profile...',
      child: Scaffold(
        appBar: AppBar(
          title: Text(_tabTitles[_currentIndex]),
          backgroundColor: AppTheme.backgroundColor,
          elevation: 0,
          actions: [
            // Coins display
            if (_currentUser != null && _currentIndex != 4) // Don't show on profile tab
              Container(
                margin: const EdgeInsets.only(right: 16),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.amber.shade800,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.monetization_on, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      '${_currentUser!.coins}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        body: _getTabBody(),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: AppTheme.backgroundColor,
          selectedItemColor: AppTheme.primaryColor,
          unselectedItemColor: AppTheme.secondaryTextColor,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.gamepad),
              label: 'Play',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.emoji_events),
              label: 'Tournaments',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.card_membership),
              label: 'Battle Pass',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.group),
              label: 'Clans',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}