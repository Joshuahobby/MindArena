import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:developer' as developer;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mind_arena/services/quiz_service.dart';
import 'package:mind_arena/services/database_service.dart';
import 'package:mind_arena/services/mock_database_service.dart';
import 'package:mind_arena/services/database_service_factory.dart';
import 'package:mind_arena/services/seed_service.dart';

Future<void> main() async {
  developer.log('MindArena starting...');
  WidgetsFlutterBinding.ensureInitialized();
  
  try {
    if (kIsWeb) {
      developer.log('Running on web platform, using mock database');
      // On web, we only need to initialize the QuizService with mock data
      final quizService = QuizService();
      await quizService.initialize();
      developer.log('Quiz service initialized with mock database for web');
    } else {
      // For non-web platforms, load environment variables and initialize PostgreSQL
      try {
        await dotenv.load(fileName: '.env');
        developer.log('Environment variables loaded successfully');
        
        // Print database connection details from environment (not showing password)
        final dbUrl = dotenv.env['DATABASE_URL'] ?? 'Not set';
        final dbHost = dotenv.env['PGHOST'] ?? 'Not set';
        final dbPort = dotenv.env['PGPORT'] ?? 'Not set';
        final dbName = dotenv.env['PGDATABASE'] ?? 'Not set';
        final dbUser = dotenv.env['PGUSER'] ?? 'Not set';
        
        developer.log('Database connection info:');
        developer.log('DATABASE_URL: ${dbUrl.replaceAll(RegExp(r'//(.+?):.+?@'), '//\$1:***@')}');
        developer.log('PGHOST: $dbHost, PGPORT: $dbPort, PGDATABASE: $dbName, PGUSER: $dbUser');
      } catch (e) {
        developer.log('Error loading environment variables: $e');
        // Continue with default values
      }
      
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

class MindArenaApp extends StatelessWidget {
  const MindArenaApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    developer.log('Building MindArenaApp');
    return MaterialApp(
      title: 'MindArena',
      debugShowCheckedModeBanner: true,
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key}) : super(key: key);

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;
  bool _isDatabaseConnected = false;
  String _databaseStatus = "Checking database connection...";
  
  @override
  void initState() {
    super.initState();
    _checkDatabaseConnection();
  }
  
  Future<void> _checkDatabaseConnection() async {
    try {
      final quizService = QuizService();
      // Try to execute a simple query to test the connection
      final categories = await quizService.getCategories();
      
      setState(() {
        _isDatabaseConnected = true;
        if (kIsWeb) {
          _databaseStatus = "Mock database connected successfully for web! Found ${categories.length} categories.";
        } else {
          _databaseStatus = "PostgreSQL database connected successfully! Found ${categories.length} categories.";
        }
      });
      
      developer.log('Database connection check successful');
    } catch (e) {
      setState(() {
        _isDatabaseConnected = false;
        _databaseStatus = "Database connection error: $e";
      });
      
      developer.log('Database connection check failed: $e');
    }
  }

  void _incrementCounter() {
    developer.log('Incrementing counter');
    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    developer.log('Building MyHomePage');
    return Scaffold(
      appBar: AppBar(
        title: const Text('MindArena Demo'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'Welcome to MindArena!',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            
            // Database status indicator
            Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: _isDatabaseConnected ? Colors.green.shade100 : Colors.red.shade100,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _isDatabaseConnected ? Colors.green : Colors.red,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    _isDatabaseConnected ? Icons.check_circle : Icons.error,
                    color: _isDatabaseConnected ? Colors.green : Colors.red,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _databaseStatus,
                      style: TextStyle(
                        color: _isDatabaseConnected ? Colors.green.shade900 : Colors.red.shade900,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 20),
            const Text(
              'You have pushed the button this many times:',
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _checkDatabaseConnection,
              child: const Text('Check Database Connection'),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}
