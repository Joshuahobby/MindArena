import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:mind_arena/config/constants.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Get current authenticated user
  User? get currentUser => _auth.currentUser;

  // Stream of auth state changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Sign in with email and password
  Future<UserCredential> signInWithEmailAndPassword(String email, String password) async {
    try {
      UserCredential result = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Update last login date
      await _updateLoginDate(result.user!.uid);
      
      return result;
    } catch (e) {
      throw _handleAuthException(e);
    }
  }

  // Register with email and password
  Future<UserCredential> registerWithEmailAndPassword(
    String email,
    String password,
    String username,
    String avatarUrl,
  ) async {
    try {
      // Check if username already exists
      QuerySnapshot usernameCheck = await _firestore
          .collection(AppConstants.usersCollection)
          .where('username', isEqualTo: username)
          .get();
      
      if (usernameCheck.docs.isNotEmpty) {
        throw Exception('Username already taken');
      }

      // Create user account
      UserCredential result = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Create user profile
      await _createUserProfile(result.user!.uid, email, username, avatarUrl);
      
      return result;
    } catch (e) {
      throw _handleAuthException(e);
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      return await _auth.signOut();
    } catch (e) {
      throw Exception('Failed to sign out: ${e.toString()}');
    }
  }

  // Reset password
  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (e) {
      throw _handleAuthException(e);
    }
  }

  // Update user profile
  Future<void> updateUserProfile({
    required String userId,
    String? username,
    String? avatarUrl,
  }) async {
    try {
      // If username is being updated, check if it's already taken
      if (username != null) {
        QuerySnapshot usernameCheck = await _firestore
            .collection(AppConstants.usersCollection)
            .where('username', isEqualTo: username)
            .where(FieldPath.documentId, isNotEqualTo: userId)
            .get();
        
        if (usernameCheck.docs.isNotEmpty) {
          throw Exception('Username already taken');
        }
      }

      Map<String, dynamic> updateData = {
        'updatedAt': Timestamp.now(),
      };

      if (username != null) updateData['username'] = username;
      if (avatarUrl != null) updateData['avatarUrl'] = avatarUrl;

      await _firestore
          .collection(AppConstants.usersCollection)
          .doc(userId)
          .update(updateData);
    } catch (e) {
      throw Exception('Failed to update profile: ${e.toString()}');
    }
  }

  // Get user data
  Future<UserModel?> getUserData(String userId) async {
    try {
      DocumentSnapshot doc = await _firestore
          .collection(AppConstants.usersCollection)
          .doc(userId)
          .get();
      
      if (doc.exists) {
        return UserModel.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      throw Exception('Failed to get user data: ${e.toString()}');
    }
  }

  // Create user profile in Firestore
  Future<void> _createUserProfile(
    String userId,
    String email,
    String username,
    String avatarUrl,
  ) async {
    try {
      DateTime now = DateTime.now();
      
      // Select a default avatar if none provided
      if (avatarUrl.isEmpty) {
        int randomIndex = now.microsecond % AppConstants.defaultAvatars.length;
        avatarUrl = AppConstants.defaultAvatars[randomIndex];
      }

      UserModel newUser = UserModel(
        id: userId,
        username: username,
        email: email,
        avatarUrl: avatarUrl,
        coins: 100, // Starting coins
        lastLoginDate: now,
        createdAt: now,
        updatedAt: now,
      );

      await _firestore
          .collection(AppConstants.usersCollection)
          .doc(userId)
          .set(newUser.toFirestore());
    } catch (e) {
      throw Exception('Failed to create user profile: ${e.toString()}');
    }
  }

  // Update last login date and track consecutive days
  Future<void> _updateLoginDate(String userId) async {
    try {
      DocumentSnapshot userDoc = await _firestore
          .collection(AppConstants.usersCollection)
          .doc(userId)
          .get();
      
      if (!userDoc.exists) return;

      UserModel user = UserModel.fromFirestore(userDoc);
      DateTime now = DateTime.now();
      DateTime lastLogin = user.lastLoginDate;
      int consecutiveDays = user.consecutiveLoginDays;
      
      // Check if this is a new day login
      bool isNewDay = now.year > lastLogin.year ||
          now.month > lastLogin.month ||
          now.day > lastLogin.day;
      
      // Calculate consecutive days
      if (isNewDay) {
        // Check if the last login was yesterday
        DateTime yesterday = now.subtract(const Duration(days: 1));
        bool wasYesterday = lastLogin.year == yesterday.year &&
            lastLogin.month == yesterday.month &&
            lastLogin.day == yesterday.day;
            
        if (wasYesterday) {
          consecutiveDays += 1;
        } else {
          consecutiveDays = 1; // Reset streak if not consecutive
        }
        
        // Store login info in local storage for offline tracking
        SharedPreferences prefs = await SharedPreferences.getInstance();
        prefs.setString(AppConstants.lastLoginDateKey, now.toIso8601String());
        prefs.setInt(AppConstants.consecutiveLoginDaysKey, consecutiveDays);
        prefs.setBool(AppConstants.dailyRewardClaimedKey, false);
      }

      // Update user document
      await _firestore.collection(AppConstants.usersCollection).doc(userId).update({
        'lastLoginDate': Timestamp.now(),
        'consecutiveLoginDays': consecutiveDays,
        'updatedAt': Timestamp.now(),
      });
    } catch (e) {
      // Just log the error but don't throw to prevent login issues
      print('Error updating login date: ${e.toString()}');
    }
  }

  // Handle Firebase Auth exceptions
  Exception _handleAuthException(dynamic e) {
    if (e is FirebaseAuthException) {
      switch (e.code) {
        case 'user-not-found':
          return Exception('No user found with this email.');
        case 'wrong-password':
          return Exception('Incorrect password.');
        case 'email-already-in-use':
          return Exception('This email is already registered.');
        case 'weak-password':
          return Exception('Password is too weak.');
        case 'invalid-email':
          return Exception('Invalid email address.');
        case 'operation-not-allowed':
          return Exception('This operation is not allowed.');
        case 'user-disabled':
          return Exception('This account has been disabled.');
        case 'too-many-requests':
          return Exception('Too many requests. Try again later.');
        case 'network-request-failed':
          return Exception('Network error. Check your connection.');
        default:
          return Exception('Authentication error: ${e.message}');
      }
    }
    return Exception('An unexpected error occurred: ${e.toString()}');
  }
}
