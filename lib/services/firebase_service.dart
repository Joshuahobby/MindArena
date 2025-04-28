import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart' as auth;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:developer' as developer;
import 'package:mind_arena/models/user_model.dart';

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  final auth.FirebaseAuth _auth = auth.FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  // Initialize Firebase
  Future<void> initialize() async {
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(
          options: kIsWeb
              ? FirebaseOptions(
                  apiKey: String.fromEnvironment('VITE_FIREBASE_API_KEY'),
                  appId: String.fromEnvironment('VITE_FIREBASE_APP_ID'),
                  projectId: String.fromEnvironment('VITE_FIREBASE_PROJECT_ID'),
                  messagingSenderId: '',
                  storageBucket: '',
                )
              : null, // For non-web platforms, options are in the local file
        );
      }
      developer.log('Firebase initialized successfully');
    } catch (e) {
      developer.log('Error initializing Firebase: $e');
      rethrow;
    }
  }

  // Sign in with email and password
  Future<User> signInWithEmailAndPassword(String email, String password) async {
    try {
      final auth.UserCredential userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Get user profile from Firestore
      final User userProfile = await _getUserProfile(userCredential.user!.uid);
      return userProfile;
    } catch (e) {
      developer.log('Error signing in with email and password: $e');
      rethrow;
    }
  }

  // Sign in with Google
  Future<User> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        throw Exception('Sign in cancelled by user');
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final auth.OAuthCredential credential = auth.GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final auth.UserCredential userCredential = await _auth.signInWithCredential(credential);
      
      // Check if user exists in Firestore
      bool userExists = await _checkUserExists(userCredential.user!.uid);
      
      if (!userExists) {
        // Create new user profile
        await _createUserProfile(
          userCredential.user!.uid,
          userCredential.user!.displayName ?? '',
          userCredential.user!.email ?? '',
          userCredential.user!.photoURL,
        );
      }
      
      // Get user profile from Firestore
      final User userProfile = await _getUserProfile(userCredential.user!.uid);
      return userProfile;
    } catch (e) {
      developer.log('Error signing in with Google: $e');
      rethrow;
    }
  }

  // Register a new user
  Future<User> registerWithEmailAndPassword(
    String username,
    String email,
    String password,
  ) async {
    try {
      // Check if username is already taken
      final QuerySnapshot usernameQuery = await _firestore
          .collection('users')
          .where('username', isEqualTo: username)
          .limit(1)
          .get();
      
      if (usernameQuery.docs.isNotEmpty) {
        throw Exception('Username is already taken');
      }
      
      // Create auth user
      final auth.UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Create user profile in Firestore
      await _createUserProfile(
        userCredential.user!.uid,
        username,
        email,
        null,
      );
      
      // Get user profile from Firestore
      final User userProfile = await _getUserProfile(userCredential.user!.uid);
      return userProfile;
    } catch (e) {
      developer.log('Error registering user: $e');
      rethrow;
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      await _auth.signOut();
      await _googleSignIn.signOut();
    } catch (e) {
      developer.log('Error signing out: $e');
      rethrow;
    }
  }

  // Get current user
  auth.User? getCurrentAuthUser() {
    return _auth.currentUser;
  }

  // Get current user profile
  Future<User?> getCurrentUserProfile() async {
    try {
      final auth.User? currentUser = _auth.currentUser;
      if (currentUser == null) {
        return null;
      }
      
      return await _getUserProfile(currentUser.uid);
    } catch (e) {
      developer.log('Error getting current user profile: $e');
      return null;
    }
  }

  // Check if user exists in Firestore
  Future<bool> _checkUserExists(String userId) async {
    try {
      final DocumentSnapshot doc = await _firestore.collection('users').doc(userId).get();
      return doc.exists;
    } catch (e) {
      developer.log('Error checking if user exists: $e');
      rethrow;
    }
  }

  // Create user profile in Firestore
  Future<void> _createUserProfile(
    String userId,
    String username,
    String email,
    String? avatarUrl,
  ) async {
    try {
      await _firestore.collection('users').doc(userId).set({
        'username': username,
        'display_name': username,
        'email': email,
        'avatar_url': avatarUrl,
        'level': 1,
        'experience_points': 0,
        'coins': 500, // Starting coins
        'is_premium': false,
        'created_at': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      developer.log('Error creating user profile: $e');
      rethrow;
    }
  }

  // Get user profile from Firestore
  Future<User> _getUserProfile(String userId) async {
    try {
      final DocumentSnapshot doc = await _firestore.collection('users').doc(userId).get();
      
      if (!doc.exists) {
        throw Exception('User profile not found');
      }
      
      final data = doc.data() as Map<String, dynamic>;
      data['id'] = doc.id;
      
      return User.fromJson(data);
    } catch (e) {
      developer.log('Error getting user profile: $e');
      rethrow;
    }
  }

  // Update user profile
  Future<User> updateUserProfile(String userId, Map<String, dynamic> data) async {
    try {
      await _firestore.collection('users').doc(userId).update(data);
      return await _getUserProfile(userId);
    } catch (e) {
      developer.log('Error updating user profile: $e');
      rethrow;
    }
  }

  // Listen to auth state changes
  Stream<auth.User?> get authStateChanges => _auth.authStateChanges();

  // Get user profile by ID
  Future<User> getUserById(String userId) async {
    try {
      return await _getUserProfile(userId);
    } catch (e) {
      developer.log('Error getting user by ID: $e');
      rethrow;
    }
  }

  // Get Firestore instance for direct access if needed
  FirebaseFirestore get firestore => _firestore;
}