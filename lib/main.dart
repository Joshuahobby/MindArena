import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:developer' as developer;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import 'package:mind_arena/services/quiz_service.dart';
import 'package:mind_arena/services/database_service.dart';
import 'package:mind_arena/services/firebase_service.dart';
import 'package:mind_arena/services/database_service_factory.dart';
import 'package:mind_arena/services/seed_service.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/screens/auth/login_screen.dart';
import 'package:mind_arena/screens/home/home_screen.dart';
import 'package:mind_arena/screens/admin/admin_dashboard_screen.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/models/user_model.dart';

Future<void> main() async {
  developer.log('MindArena starting...');
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    // Load environment variables
    try {
      await dotenv.load(fileName: '.env');
      developer.log('Environment variables loaded successfully');
    } catch (e) {
      developer.log('Error loading environment variables: $e');
      // Continue with default values
    }
    
    // Initialize Firebase
    try {
      final firebaseService = FirebaseService();
      await firebaseService.initialize();
      developer.log('Firebase initialized successfully');
    } catch (e) {
      developer.log('Error initializing Firebase: $e');
      // Continue app initialization even if Firebase fails
    }
    
    if (kIsWeb) {
      developer.log('Running on web platform, using mock database');
      // On web, we only need to initialize the QuizService with mock data
      final quizService = QuizService();
      await quizService.initialize();
      developer.log('Quiz service initialized with mock database for web');
    } else {
      // For non-web platforms, initialize PostgreSQL database
      // Print database connection details from environment (not showing password)
      final dbUrl = dotenv.env['DATABASE_URL'] ?? 'Not set';
      final dbHost = dotenv.env['PGHOST'] ?? 'Not set';
      final dbPort = dotenv.env['PGPORT'] ?? 'Not set';
      final dbName = dotenv.env['PGDATABASE'] ?? 'Not set';
      final dbUser = dotenv.env['PGUSER'] ?? 'Not set';
      
      developer.log('Database connection info:');
      developer.log('DATABASE_URL: ${dbUrl.replaceAll(RegExp(r'//(.+?):.+?@'), '//\$1:***@')}');
      developer.log('PGHOST: $dbHost, PGPORT: $dbPort, PGDATABASE: $dbName, PGUSER: $dbUser');
      
      // Initialize database and seed data for non-web platforms
      final databaseService = DatabaseService();
      await databaseService.initialize();
      developer.log('PostgreSQL database service initialized successfully');
      
      final quizService = QuizService();
      await quizService.initialize();
      developer.log('Quiz service initialized successfully');
      
      // Seed the database with initial data
      try {
        final seedService = SeedService(databaseService, quizService);
        await seedService.seedDatabase();
        developer.log('Database seeded successfully');
      } catch (seedError) {
        developer.log('Error seeding database: $seedError');
        // Continue with app initialization even if seeding fails
      }
    }
  } catch (e) {
    developer.log('Error during app initialization: $e');
  }
  
  runApp(const MindArenaApp());
}

class MindArenaApp extends StatefulWidget {
  const MindArenaApp({Key? key}) : super(key: key);

  @override
  _MindArenaAppState createState() => _MindArenaAppState();
}

class _MindArenaAppState extends State<MindArenaApp> {
  final AuthService _authService = AuthService();
  bool _isInitialized = false;
  
  @override
  void initState() {
    super.initState();
    _initializeServices();
  }
  
  Future<void> _initializeServices() async {
    try {
      await _authService.initialize();
      setState(() {
        _isInitialized = true;
      });
    } catch (e) {
      developer.log('Error initializing auth service: $e');
      // Still mark as initialized to allow the user to at least see the login screen
      setState(() {
        _isInitialized = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    developer.log('Building MindArenaApp');
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthService>.value(value: _authService),
        ChangeNotifierProvider(create: (context) => AppState()),
      ],
      child: MaterialApp(
        title: 'MindArena',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: !_isInitialized
            ? const _LoadingScreen()
            : const AuthenticationWrapper(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/home': (context) => const HomeScreen(),
          '/admin': (context) => const AdminDashboardScreen(),
        },
      ),
    );
  }
}
}

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: AppTheme.backgroundGradient,
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              Container(
                height: 120,
                width: 120,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.psychology,
                  size: 80,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              
              // App Name
              const Text(
                'MindArena',
                style: TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              
              // Tagline
              const Text(
                'Where Fast Minds Become Champions',
                style: TextStyle(
                  fontSize: 16,
                  color: AppTheme.secondaryTextColor,
                ),
              ),
              const SizedBox(height: 48),
              
              // Loading Indicator
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
              ),
              const SizedBox(height: 24),
              
              // Loading Text
              const Text(
                'Loading...',
                style: TextStyle(
                  color: AppTheme.secondaryTextColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AppState extends ChangeNotifier {
  app_models.User? currentUser;
  bool isDarkMode = true;
  
  void setUser(app_models.User? user) {
    currentUser = user;
    notifyListeners();
  }
  
  void toggleTheme() {
    isDarkMode = !isDarkMode;
    notifyListeners();
  }
}
