import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/screens/auth/login_screen.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/utils/app_constants.dart';
import 'package:mind_arena/screens/home/play_screen.dart';
import 'package:mind_arena/screens/store/store_screen.dart';
import 'package:mind_arena/screens/battle_pass/battle_pass_screen.dart';
import 'package:mind_arena/screens/profile/profile_screen.dart';
import 'package:provider/provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  
  late final List<Widget> _pages;
  
  @override
  void initState() {
    super.initState();
    _pages = [
      const PlayScreen(),
      const StoreScreen(),
      const BattlePassScreen(),
      const ProfileScreen(),
    ];
  }
  
  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    final User? currentUser = Provider.of<AuthService>(context).currentUser;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _selectedIndex == 0 ? 'MindArena' : _getTitle(_selectedIndex),
          style: const TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          // Tokens display
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Row(
              children: [
                const Icon(Icons.token, color: Colors.amber),
                const SizedBox(width: 4),
                Text(
                  currentUser?.tokens.toString() ?? '0',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
          // Logout button
          IconButton(
            icon: const Icon(Icons.exit_to_app),
            tooltip: 'Logout',
            onPressed: () {
              _handleLogout(context);
            },
          ),
        ],
      ),
      body: _pages[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.sports_esports),
            label: 'Play',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.store),
            label: 'Store',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.card_membership),
            label: 'Battle Pass',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        onTap: _onItemTapped,
      ),
    );
  }
  
  String _getTitle(int index) {
    switch (index) {
      case 0:
        return 'Play';
      case 1:
        return 'Store';
      case 2:
        return 'Battle Pass';
      case 3:
        return 'Profile';
      default:
        return 'MindArena';
    }
  }
  
  Future<void> _handleLogout(BuildContext context) async {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Logout'),
          content: const Text('Are you sure you want to logout?'),
          actions: <Widget>[
            TextButton(
              child: const Text('Cancel'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: const Text('Logout'),
              onPressed: () async {
                Navigator.of(context).pop();
                
                final authService = Provider.of<AuthService>(context, listen: false);
                await authService.signOut();
                
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                  (Route<dynamic> route) => false,
                );
              },
            ),
          ],
        );
      },
    );
  }
}

// Using PlayScreen from play_screen.dart for the primary play interface

class StoreScreen extends StatelessWidget {
  const StoreScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Store Screen'),
    );
  }
}

class BattlePassScreen extends StatelessWidget {
  const BattlePassScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Battle Pass Screen'),
    );
  }
}

