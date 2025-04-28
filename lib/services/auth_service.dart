import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/utils/app_constants.dart';

class AuthService with ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  // Firebase Auth instance
  final firebase_auth.FirebaseAuth _firebaseAuth = firebase_auth.FirebaseAuth.instance;
  
  // Current user
  User? _currentUser;
  
  // Server URL
  final String _serverUrl = 'https://mindarena.app/api';
  
  // Getters
  User? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  
  // Initialize the service
  Future<void> initialize() async {
    // Check if user is already signed in
    final firebaseUser = _firebaseAuth.currentUser;
    
    if (firebaseUser != null) {
      // User is signed in, fetch their data
      await _fetchUserData(firebaseUser.uid);
    } else {
      // Try to restore from local storage
      await _restoreUserFromLocalStorage();
    }
  }
  
  // Sign in with email and password
  Future<User> signInWithEmailAndPassword(String email, String password) async {
    try {
      final userCredential = await _firebaseAuth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      if (userCredential.user != null) {
        await _fetchUserData(userCredential.user!.uid);
        
        if (_currentUser != null) {
          return _currentUser!;
        } else {
          throw Exception('Failed to fetch user data');
        }
      } else {
        throw Exception('Authentication failed');
      }
    } catch (e) {
      throw Exception('Authentication failed: ${e.toString()}');
    }
  }
  
  // Register with email and password
  Future<User> registerWithEmailAndPassword(
    String username,
    String email,
    String password,
    {UserRole role = UserRole.player}
  ) async {
    try {
      final userCredential = await _firebaseAuth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      if (userCredential.user != null) {
        // Create user in the database
        final userId = userCredential.user!.uid;
        
        // Set display name
        await userCredential.user!.updateDisplayName(username);
        
        // Create user object
        final user = User(
          id: userId,
          username: username,
          email: email,
          tokens: 100, // Initial tokens
          level: 1,
          xp: 0,
          isOnline: true,
          joinDate: DateTime.now(),
          role: role,
        );
        
        // Save to database
        await _createUserInDatabase(user);
        
        // Set current user
        _currentUser = user;
        
        // Save to local storage
        await _saveUserToLocalStorage(user);
        
        // Notify listeners
        notifyListeners();
        
        return user;
      } else {
        throw Exception('Registration failed');
      }
    } catch (e) {
      throw Exception('Registration failed: ${e.toString()}');
    }
  }
  
  // Sign out
  Future<void> signOut() async {
    await _firebaseAuth.signOut();
    await _clearUserFromLocalStorage();
    _currentUser = null;
    notifyListeners();
  }
  
  // Fetch user data from database
  Future<void> _fetchUserData(String userId) async {
    try {
      // Try to fetch from API
      final response = await http.get(
        Uri.parse('$_serverUrl/users/$userId'),
      );
      
      if (response.statusCode == 200) {
        final userData = json.decode(response.body);
        _currentUser = User.fromJson(userData);
      } else {
        // If API fails, create a minimal user object
        _currentUser = User(
          id: userId,
          username: _firebaseAuth.currentUser?.displayName ?? 'Player',
          email: _firebaseAuth.currentUser?.email ?? '',
          tokens: 100,
          level: 1,
          xp: 0,
          isOnline: true,
          joinDate: DateTime.now(),
        );
        
        // Try to create in database
        await _createUserInDatabase(_currentUser!);
      }
      
      // Save to local storage
      if (_currentUser != null) {
        await _saveUserToLocalStorage(_currentUser!);
      }
      
      // Notify listeners
      notifyListeners();
      
    } catch (e) {
      // Create a minimal user object if everything fails
      if (_firebaseAuth.currentUser != null) {
        _currentUser = User(
          id: userId,
          username: _firebaseAuth.currentUser?.displayName ?? 'Player',
          email: _firebaseAuth.currentUser?.email ?? '',
          tokens: 100,
          level: 1,
          xp: 0,
          isOnline: true,
          joinDate: DateTime.now(),
        );
        
        // Save to local storage
        await _saveUserToLocalStorage(_currentUser!);
        
        // Notify listeners
        notifyListeners();
      }
    }
  }
  
  // Create user in database
  Future<void> _createUserInDatabase(User user) async {
    try {
      await http.post(
        Uri.parse('$_serverUrl/users'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(user.toJson()),
      );
    } catch (e) {
      // Ignore errors, we already have the user locally
    }
  }
  
  // Save user to local storage
  Future<void> _saveUserToLocalStorage(User user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', json.encode(user.toJson()));
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Restore user from local storage
  Future<void> _restoreUserFromLocalStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userData = prefs.getString('user');
      
      if (userData != null) {
        _currentUser = User.fromJson(json.decode(userData));
        notifyListeners();
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Clear user from local storage
  Future<void> _clearUserFromLocalStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user');
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Refresh user data
  Future<void> refreshUserData() async {
    if (_currentUser != null) {
      await _fetchUserData(_currentUser!.id);
    }
  }
  
  // Update user profile
  Future<void> updateUserProfile({
    String? username,
    String? avatarUrl,
  }) async {
    if (_currentUser == null) return;
    
    try {
      final updatedUser = _currentUser!.copyWith(
        username: username ?? _currentUser!.username,
        avatarUrl: avatarUrl ?? _currentUser!.avatarUrl,
      );
      
      // Update in database
      await http.patch(
        Uri.parse('$_serverUrl/users/${_currentUser!.id}'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'username': updatedUser.username,
          'avatarUrl': updatedUser.avatarUrl,
        }),
      );
      
      // Update local user
      _currentUser = updatedUser;
      
      // Save to local storage
      await _saveUserToLocalStorage(_currentUser!);
      
      // Notify listeners
      notifyListeners();
      
    } catch (e) {
      // If API fails, still update locally
      final updatedUser = _currentUser!.copyWith(
        username: username ?? _currentUser!.username,
        avatarUrl: avatarUrl ?? _currentUser!.avatarUrl,
      );
      
      _currentUser = updatedUser;
      await _saveUserToLocalStorage(_currentUser!);
      notifyListeners();
    }
  }

  // Add tokens to user's account (used for single-player rewards, etc.)
  Future<void> addTokens(int amount) async {
    if (_currentUser == null || amount <= 0) return;
    
    try {
      // Try to update on server
      await http.post(
        Uri.parse('$_serverUrl/users/${_currentUser!.id}/tokens'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'amount': amount,
          'source': 'single_player_reward',
        }),
      );
      
      // Update local user
      final updatedUser = _currentUser!.copyWith(
        tokens: _currentUser!.tokens + amount,
      );
      
      _currentUser = updatedUser;
      
      // Save to local storage
      await _saveUserToLocalStorage(_currentUser!);
      
      // Notify listeners
      notifyListeners();
      
    } catch (e) {
      // If API fails, still update locally
      final updatedUser = _currentUser!.copyWith(
        tokens: _currentUser!.tokens + amount,
      );
      
      _currentUser = updatedUser;
      await _saveUserToLocalStorage(_currentUser!);
      notifyListeners();
    }
  }

  // Check if user has premium battle pass
  bool hasPremiumBattlePass() {
    return _currentUser?.hasPremiumBattlePass ?? false;
  }

  // Activate premium battle pass
  Future<void> activatePremiumBattlePass() async {
    if (_currentUser == null) return;
    
    try {
      // Try to update on server
      await http.post(
        Uri.parse('$_serverUrl/users/${_currentUser!.id}/battle-pass'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'isPremium': true,
          'activationDate': DateTime.now().toIso8601String(),
        }),
      );
      
      // Update local user
      final updatedUser = _currentUser!.copyWith(
        hasPremiumBattlePass: true,
        battlePassPurchaseDate: DateTime.now(),
      );
      
      _currentUser = updatedUser;
      
      // Save to local storage
      await _saveUserToLocalStorage(_currentUser!);
      
      // Notify listeners
      notifyListeners();
      
    } catch (e) {
      // If API fails, still update locally
      final updatedUser = _currentUser!.copyWith(
        hasPremiumBattlePass: true,
        battlePassPurchaseDate: DateTime.now(),
      );
      
      _currentUser = updatedUser;
      await _saveUserToLocalStorage(_currentUser!);
      notifyListeners();
    }
  }

  // Update XP and level
  Future<void> addXP(int amount, {String source = 'gameplay'}) async {
    if (_currentUser == null || amount <= 0) return;
    
    try {
      // Calculate new XP and level
      final currentXP = _currentUser!.xp;
      final newXP = currentXP + amount;
      
      // Simple level calculation
      // Level up every 1000 XP
      final currentLevel = _currentUser!.level;
      final xpForNextLevel = currentLevel * 1000;
      int newLevel = currentLevel;
      
      if (newXP >= xpForNextLevel) {
        newLevel = (newXP / 1000).floor() + 1;
      }
      
      // Try to update on server
      await http.post(
        Uri.parse('$_serverUrl/users/${_currentUser!.id}/xp'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'amount': amount,
          'source': source,
        }),
      );
      
      // Update local user
      final updatedUser = _currentUser!.copyWith(
        xp: newXP,
        level: newLevel,
      );
      
      _currentUser = updatedUser;
      
      // Save to local storage
      await _saveUserToLocalStorage(_currentUser!);
      
      // Notify listeners
      notifyListeners();
      
    } catch (e) {
      // If API fails, still update locally
      final currentXP = _currentUser!.xp;
      final newXP = currentXP + amount;
      
      final currentLevel = _currentUser!.level;
      final xpForNextLevel = currentLevel * 1000;
      int newLevel = currentLevel;
      
      if (newXP >= xpForNextLevel) {
        newLevel = (newXP / 1000).floor() + 1;
      }
      
      final updatedUser = _currentUser!.copyWith(
        xp: newXP,
        level: newLevel,
      );
      
      _currentUser = updatedUser;
      await _saveUserToLocalStorage(_currentUser!);
      notifyListeners();
    }
  }
  
  // Check if current user is an admin
  bool isAdmin() {
    return _currentUser?.role == UserRole.admin;
  }
  
  // Update user role
  Future<void> updateUserRole(String userId, UserRole newRole) async {
    // Only admins can update roles
    if (_currentUser == null || _currentUser!.role != UserRole.admin) {
      throw Exception('You do not have permission to update user roles');
    }
    
    try {
      // Update in database
      await http.patch(
        Uri.parse('$_serverUrl/users/$userId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'role': newRole.toString().split('.').last,
        }),
      );
      
      // If updating current user, also update locally
      if (_currentUser!.id == userId) {
        final updatedUser = _currentUser!.copyWith(
          role: newRole,
        );
        
        _currentUser = updatedUser;
        await _saveUserToLocalStorage(_currentUser!);
        notifyListeners();
      }
    } catch (e) {
      throw Exception('Failed to update user role: ${e.toString()}');
    }
  }
  
  // Send password reset email
  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _firebaseAuth.sendPasswordResetEmail(email: email);
    } catch (e) {
      throw Exception('Failed to send password reset email: ${e.toString()}');
    }
  }
  
  // Change password (when already signed in)
  Future<void> changePassword(String currentPassword, String newPassword) async {
    if (_currentUser == null || _firebaseAuth.currentUser == null) {
      throw Exception('You must be signed in to change your password');
    }
    
    try {
      // Re-authenticate user to confirm current password
      final credential = firebase_auth.EmailAuthProvider.credential(
        email: _currentUser!.email,
        password: currentPassword,
      );
      
      await _firebaseAuth.currentUser!.reauthenticateWithCredential(credential);
      
      // Change password
      await _firebaseAuth.currentUser!.updatePassword(newPassword);
    } catch (e) {
      throw Exception('Failed to change password: ${e.toString()}');
    }
  }
  
  // Create admin user (for use during initial setup)
  Future<User> createAdminUser(
    String username,
    String email,
    String password,
  ) async {
    // Check if email is in the admin email list
    if (!kAdminEmails.contains(email)) {
      throw Exception('This email is not authorized to create an admin account');
    }
    
    return registerWithEmailAndPassword(
      username,
      email,
      password,
      role: UserRole.admin,
    );
  }
}