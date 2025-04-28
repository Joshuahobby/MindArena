import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:mind_arena/services/database_service.dart';
import 'package:mind_arena/services/mock_database_service.dart';
import 'dart:developer' as developer;

/// A factory class that provides the appropriate database service implementation
/// based on the platform. For web, it returns a mock implementation since PostgreSQL
/// direct connections are not supported in browsers.
class DatabaseServiceFactory {
  /// Get the appropriate database service for the current platform.
  /// Returns a PostgreSQL implementation for non-web platforms, and a mock
  /// implementation for web.
  static dynamic getDatabaseService() {
    if (kIsWeb) {
      developer.log('Using mock database service for web platform');
      return MockDatabaseService();
    } else {
      developer.log('Using PostgreSQL database service for native platform');
      return DatabaseService();
    }
  }
}