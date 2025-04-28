import 'dart:async';
import 'package:postgres/postgres.dart';
import 'dart:math' as math;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'dart:developer' as developer;

class DatabaseService {
  PostgreSQLConnection? _connection;
  static final DatabaseService _instance = DatabaseService._internal();
  
  factory DatabaseService() {
    return _instance;
  }
  
  DatabaseService._internal();
  
  Future<void> initialize() async {
    if (_connection != null) {
      developer.log('Database connection already initialized');
      return;
    }
    
    try {
      // Get database connection info from environment variables using flutter_dotenv
      String? host = dotenv.env['PGHOST'];
      String? portStr = dotenv.env['PGPORT'];
      String? database = dotenv.env['PGDATABASE'];
      String? username = dotenv.env['PGUSER'];
      String? password = dotenv.env['PGPASSWORD'];
      String? databaseUrl = dotenv.env['DATABASE_URL'];
      
      developer.log('Loaded environment variables for database connection');
      
      String finalHost = host ?? 'localhost';
      int finalPort = portStr != null ? int.parse(portStr) : 5432;
      String finalDatabase = database ?? 'postgres';
      String finalUsername = username ?? 'postgres';
      String finalPassword = password ?? 'postgres';
      
      // Try to parse DATABASE_URL if available
      if (databaseUrl != null && databaseUrl.isNotEmpty) {
        try {
          // Expected format: postgres://username:password@host:port/database
          final uri = Uri.parse(databaseUrl);
          
          if (uri.scheme == 'postgres' || uri.scheme == 'postgresql') {
            finalHost = uri.host;
            finalPort = uri.port != 0 ? uri.port : 5432;
            finalDatabase = uri.path.replaceFirst('/', '');
            
            if (uri.userInfo.isNotEmpty) {
              final userInfoParts = uri.userInfo.split(':');
              if (userInfoParts.length >= 1) {
                finalUsername = userInfoParts[0];
              }
              if (userInfoParts.length >= 2) {
                finalPassword = userInfoParts[1];
              }
            }
            
            developer.log('Using database connection info from DATABASE_URL');
          }
        } catch (e) {
          developer.log('Error parsing DATABASE_URL: $e, using individual environment variables');
        }
      } else {
        developer.log('DATABASE_URL not available, using individual environment variables');
      }
      
      developer.log('Connecting to PostgreSQL database: $finalHost:$finalPort/$finalDatabase');
      
      _connection = PostgreSQLConnection(
        finalHost,
        finalPort,
        finalDatabase,
        username: finalUsername,
        password: finalPassword,
      );
      
      await _connection!.open();
      developer.log('PostgreSQL connection established successfully');
      
      // Create database tables if they don't exist
      await _createTables();
    } catch (e) {
      developer.log('Error initializing database connection: $e');
      rethrow;
    }
  }
  
  Future<void> _createTables() async {
    if (_connection == null) {
      throw Exception('Database connection not initialized');
    }
    
    try {
      // Create users table
      await _connection!.query('''
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          display_name VARCHAR(100),
          avatar_url VARCHAR(255),
          coins INTEGER DEFAULT 0,
          experience_points INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      ''');
      
      // Create categories table
      await _connection!.query('''
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          icon_url VARCHAR(255)
        )
      ''');
      
      // Create questions table
      await _connection!.query('''
        CREATE TABLE IF NOT EXISTS questions (
          id SERIAL PRIMARY KEY,
          category_id INTEGER REFERENCES categories(id),
          question_text TEXT NOT NULL,
          difficulty INTEGER NOT NULL, -- 1=Easy, 2=Medium, 3=Hard
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      ''');
      
      // Create answers table
      await _connection!.query('''
        CREATE TABLE IF NOT EXISTS answers (
          id SERIAL PRIMARY KEY,
          question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
          answer_text TEXT NOT NULL,
          is_correct BOOLEAN NOT NULL DEFAULT FALSE
        )
      ''');
      
      // Create game_sessions table
      await _connection!.query('''
        CREATE TABLE IF NOT EXISTS game_sessions (
          id SERIAL PRIMARY KEY,
          session_code VARCHAR(20) UNIQUE NOT NULL,
          is_tournament BOOLEAN DEFAULT FALSE,
          entry_fee INTEGER DEFAULT 0,
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP NULL
        )
      ''');
      
      // Create player_sessions table
      await _connection!.query('''
        CREATE TABLE IF NOT EXISTS player_sessions (
          id SERIAL PRIMARY KEY,
          game_session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id),
          score INTEGER DEFAULT 0,
          completed BOOLEAN DEFAULT FALSE,
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      ''');
      
      // Create player_answers table
      await _connection!.query('''
        CREATE TABLE IF NOT EXISTS player_answers (
          id SERIAL PRIMARY KEY,
          player_session_id INTEGER REFERENCES player_sessions(id) ON DELETE CASCADE,
          question_id INTEGER REFERENCES questions(id),
          answer_id INTEGER REFERENCES answers(id),
          is_correct BOOLEAN NOT NULL,
          response_time_ms INTEGER,
          answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      ''');
      
      developer.log('Database tables created successfully');
    } catch (e) {
      developer.log('Error creating database tables: $e');
      rethrow;
    }
  }
  
  // Add a getter for the connection to properly expose it to other services
  PostgreSQLConnection? get connection => _connection;
  
  // Helper method for generating a random session code
  String _generateSessionCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters I, O, 0, 1
    final random = math.Random();
    return List.generate(6, (index) => chars[random.nextInt(chars.length)]).join();
  }
  
  // Create a new game session
  Future<Map<String, dynamic>> createGameSession(bool isTournament, int entryFee) async {
    if (_connection == null) {
      throw Exception('Database connection not initialized');
    }
    
    // Generate a unique session code
    String sessionCode;
    bool isUnique = false;
    
    do {
      sessionCode = _generateSessionCode();
      final results = await _connection!.query(
        'SELECT COUNT(*) FROM game_sessions WHERE session_code = @sessionCode',
        substitutionValues: {'sessionCode': sessionCode},
      );
      
      isUnique = results.first[0] == 0;
    } while (!isUnique);
    
    // Create the game session
    final results = await _connection!.query(
      '''
      INSERT INTO game_sessions (session_code, is_tournament, entry_fee)
      VALUES (@sessionCode, @isTournament, @entryFee)
      RETURNING *
      ''',
      substitutionValues: {
        'sessionCode': sessionCode,
        'isTournament': isTournament,
        'entryFee': entryFee,
      },
    );
    
    return results.first.toColumnMap();
  }
  
  // Close the database connection
  Future<void> close() async {
    if (_connection != null) {
      await _connection!.close();
      _connection = null;
      developer.log('Database connection closed');
    }
  }
}