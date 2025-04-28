import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/screens/battle_pass/battle_pass_tab.dart';
import 'package:mind_arena/screens/tournaments/tournaments_tab.dart';
import 'package:mind_arena/screens/clans/clans_tab.dart';
import 'package:mind_arena/screens/profile/profile_tab.dart';
import 'package:mind_arena/screens/quiz/quiz_tab.dart';

class HomeScreen extends StatefulWidget {
  final User? user;

  const HomeScreen({Key? key, this.user}) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tabs = [
      // Quiz/Play Tab
      QuizTab(user: widget.user),
      
      // Battle Pass Tab
      BattlePassTab(user: widget.user),
      
      // Tournaments Tab
      TournamentsTab(user: widget.user),
      
      // Clans Tab
      ClansTab(user: widget.user),
      
      // Profile Tab
      ProfileTab(user: widget.user),
    ];

    return Scaffold(
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: tabs,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppTheme.backgroundColor,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
              _pageController.jumpToPage(index);
            });
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: AppTheme.primaryColor,
          unselectedItemColor: AppTheme.secondaryTextColor,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.videogame_asset),
              label: 'Play',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.card_membership),
              label: 'Pass',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.emoji_events),
              label: 'Tournaments',
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