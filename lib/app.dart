import 'package:flutter/material.dart';
import 'package:mind_arena/config/routes.dart';
import 'package:mind_arena/config/theme.dart';
import 'package:mind_arena/screens/splash_screen.dart';
import 'package:provider/provider.dart';

// Import mock services from main.dart
import 'main.dart';

class MindArenaApp extends StatelessWidget {
  const MindArenaApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Using mock analytics service
    final analyticsService = Provider.of<MockAnalyticsService>(context);

    return MaterialApp(
      title: 'MindArena',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const SplashScreen(),
      // Remove analytics observer for now
      navigatorObservers: [],
      onGenerateRoute: AppRouter.onGenerateRoute,
      initialRoute: SplashScreen.routeName,
    );
  }
}
