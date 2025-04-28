import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'dart:developer' as developer;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:mind_arena/models/user_model.dart' as app_models;

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  
  factory FirebaseService() {
    return _instance;
  }
  
  FirebaseService._internal();
  
  // Firebase instances
  late final FirebaseAuth _auth;
  late final FirebaseFirestore _firestore;
  late final GoogleSignIn _googleSignIn;
  
  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();
  
  // Initialize Firebase
  Future<void> initialize() async {
    try {
      // Firebase options configuration
      final firebaseOptions = FirebaseOptions(
        apiKey: dotenv.env['VITE_FIREBASE_API_KEY'] ?? '',
        appId: dotenv.env['VITE_FIREBASE_APP_ID'] ?? '',
        projectId: dotenv.env['VITE_FIREBASE_PROJECT_ID'] ?? '',
        messagingSenderId: '',
        authDomain: '${dotenv.env['VITE_FIREBASE_PROJECT_ID']}.firebaseapp.com',
        storageBucket: '${dotenv.env['VITE_FIREBASE_PROJECT_ID']}.appspot.com',
      );
      
      await Firebase.initializeApp(options: firebaseOptions);
      
      _auth = FirebaseAuth.instance;
      _firestore = FirebaseFirestore.instance;
      _googleSignIn = GoogleSignIn();
      
      developer.log('Firebase initialized successfully');
    } catch (e) {
      developer.log('Error initializing Firebase: $e');
      rethrow;
    }
  }
  
  // Authentication methods
  Future<UserCredential> signInWithEmailAndPassword(String email, String password) async {
    try {
      final userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Check if user exists in Firestore, if not create
      await _ensureUserInFirestore(userCredential.user!);
      
      return userCredential;
    } catch (e) {
      developer.log('Error signing in with email and password: $e');
      rethrow;
    }
  }
  
  Future<UserCredential> createUserWithEmailAndPassword(String email, String password, String username) async {
    try {
      final userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Update display name
      await userCredential.user!.updateDisplayName(username);
      
      // Create user document in Firestore
      await _createUserInFirestore(userCredential.user!, username);
      
      return userCredential;
    } catch (e) {
      developer.log('Error creating user with email and password: $e');
      rethrow;
    }
  }
  
  Future<UserCredential> signInWithGoogle() async {
    try {
      // Trigger the authentication flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        throw Exception('Google sign in aborted');
      }
      
      // Obtain the auth details from the request
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      // Create a new credential
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      
      // Sign in to Firebase with the Google credential
      final userCredential = await _auth.signInWithCredential(credential);
      
      // Ensure user exists in Firestore
      await _ensureUserInFirestore(userCredential.user!);
      
      return userCredential;
    } catch (e) {
      developer.log('Error signing in with Google: $e');
      rethrow;
    }
  }
  
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      await _auth.signOut();
    } catch (e) {
      developer.log('Error signing out: $e');
      rethrow;
    }
  }
  
  // Firestore methods
  Future<void> _ensureUserInFirestore(User user) async {
    try {
      final userDoc = await _firestore.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Create new user document
        String username = user.displayName ?? 'User${user.uid.substring(0, 5)}';
        await _createUserInFirestore(user, username);
      }
    } catch (e) {
      developer.log('Error ensuring user in Firestore: $e');
      rethrow;
    }
  }
  
  Future<void> _createUserInFirestore(User user, String username) async {
    try {
      // Check if username is already taken
      final usernameQuery = await _firestore
          .collection('users')
          .where('username', isEqualTo: username)
          .get();
      
      if (usernameQuery.docs.isNotEmpty) {
        // Append random number to username
        username = '$username${DateTime.now().millisecondsSinceEpoch % 1000}';
      }
      
      // Create user document
      await _firestore.collection('users').doc(user.uid).set({
        'email': user.email,
        'username': username,
        'display_name': user.displayName ?? username,
        'avatar_url': user.photoURL,
        'coins': 100, // Start with 100 coins
        'experience_points': 0,
        'level': 1,
        'created_at': FieldValue.serverTimestamp(),
        'last_login': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      developer.log('Error creating user in Firestore: $e');
      rethrow;
    }
  }
  
  Future<app_models.User?> getCurrentUserProfile() async {
    try {
      if (_auth.currentUser == null) {
        return null;
      }
      
      final userDoc = await _firestore
          .collection('users')
          .doc(_auth.currentUser!.uid)
          .get();
      
      if (!userDoc.exists) {
        return null;
      }
      
      final userData = userDoc.data()!;
      userData['id'] = userDoc.id; // Add document ID as user ID
      
      // Convert Firestore Timestamp to DateTime
      if (userData['created_at'] != null) {
        userData['created_at'] = (userData['created_at'] as Timestamp).toDate().toIso8601String();
      }
      
      return app_models.User.fromMap(userData);
    } catch (e) {
      developer.log('Error getting current user profile: $e');
      return null;
    }
  }
  
  // Battle Pass System
  Future<void> createBattlePass(String name, DateTime startDate, DateTime endDate, List<Map<String, dynamic>> rewards) async {
    try {
      await _firestore.collection('battle_passes').add({
        'name': name,
        'start_date': Timestamp.fromDate(startDate),
        'end_date': Timestamp.fromDate(endDate),
        'rewards': rewards,
        'created_at': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      developer.log('Error creating battle pass: $e');
      rethrow;
    }
  }
  
  Future<List<Map<String, dynamic>>> getBattlePasses() async {
    try {
      final querySnapshot = await _firestore
          .collection('battle_passes')
          .where('end_date', isGreaterThanOrEqualTo: Timestamp.fromDate(DateTime.now()))
          .orderBy('end_date')
          .get();
      
      return querySnapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();
    } catch (e) {
      developer.log('Error getting battle passes: $e');
      return [];
    }
  }
  
  Future<Map<String, dynamic>?> getCurrentBattlePass() async {
    try {
      final now = Timestamp.fromDate(DateTime.now());
      
      final querySnapshot = await _firestore
          .collection('battle_passes')
          .where('start_date', isLessThanOrEqualTo: now)
          .where('end_date', isGreaterThanOrEqualTo: now)
          .orderBy('start_date', descending: true)
          .limit(1)
          .get();
      
      if (querySnapshot.docs.isEmpty) {
        return null;
      }
      
      final doc = querySnapshot.docs.first;
      final data = doc.data();
      data['id'] = doc.id;
      return data;
    } catch (e) {
      developer.log('Error getting current battle pass: $e');
      return null;
    }
  }
  
  Future<void> unlockBattlePassReward(String battlePassId, String userId, int rewardTier) async {
    try {
      // First check if user has already unlocked this reward
      final existingDoc = await _firestore
          .collection('user_battle_pass_rewards')
          .where('battle_pass_id', isEqualTo: battlePassId)
          .where('user_id', isEqualTo: userId)
          .where('tier', isEqualTo: rewardTier)
          .get();
      
      if (existingDoc.docs.isNotEmpty) {
        // Already unlocked
        return;
      }
      
      // Add record of unlocked reward
      await _firestore.collection('user_battle_pass_rewards').add({
        'battle_pass_id': battlePassId,
        'user_id': userId,
        'tier': rewardTier,
        'unlocked_at': FieldValue.serverTimestamp(),
      });
      
      // Get the reward to apply it to the user
      final battlePassDoc = await _firestore.collection('battle_passes').doc(battlePassId).get();
      if (!battlePassDoc.exists) {
        throw Exception('Battle pass not found');
      }
      
      final rewards = battlePassDoc.data()!['rewards'] as List<dynamic>;
      if (rewardTier >= rewards.length) {
        throw Exception('Invalid reward tier');
      }
      
      final reward = rewards[rewardTier];
      
      // Apply reward to user
      final userDoc = _firestore.collection('users').doc(userId);
      
      if (reward['type'] == 'coins') {
        await userDoc.update({
          'coins': FieldValue.increment(reward['amount']),
        });
      } else if (reward['type'] == 'avatar') {
        await userDoc.update({
          'unlocked_avatars': FieldValue.arrayUnion([reward['avatar_id']]),
        });
      } else if (reward['type'] == 'experience') {
        await userDoc.update({
          'experience_points': FieldValue.increment(reward['amount']),
        });
      }
    } catch (e) {
      developer.log('Error unlocking battle pass reward: $e');
      rethrow;
    }
  }
  
  // Tournament System
  Future<String> createTournament(String name, DateTime startDate, DateTime endDate, int entryFee, int maxPlayers) async {
    try {
      final docRef = await _firestore.collection('tournaments').add({
        'name': name,
        'start_date': Timestamp.fromDate(startDate),
        'end_date': Timestamp.fromDate(endDate),
        'entry_fee': entryFee,
        'max_players': maxPlayers,
        'current_players': 0,
        'status': 'upcoming', // upcoming, active, completed
        'created_at': FieldValue.serverTimestamp(),
      });
      
      return docRef.id;
    } catch (e) {
      developer.log('Error creating tournament: $e');
      rethrow;
    }
  }
  
  Future<List<Map<String, dynamic>>> getActiveTournaments() async {
    try {
      final now = Timestamp.fromDate(DateTime.now());
      
      final querySnapshot = await _firestore
          .collection('tournaments')
          .where('start_date', isLessThanOrEqualTo: now)
          .where('end_date', isGreaterThanOrEqualTo: now)
          .where('status', isEqualTo: 'active')
          .get();
      
      return querySnapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();
    } catch (e) {
      developer.log('Error getting active tournaments: $e');
      return [];
    }
  }
  
  Future<List<Map<String, dynamic>>> getUpcomingTournaments() async {
    try {
      final now = Timestamp.fromDate(DateTime.now());
      
      final querySnapshot = await _firestore
          .collection('tournaments')
          .where('start_date', isGreaterThan: now)
          .where('status', isEqualTo: 'upcoming')
          .orderBy('start_date')
          .get();
      
      return querySnapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();
    } catch (e) {
      developer.log('Error getting upcoming tournaments: $e');
      return [];
    }
  }
  
  Future<bool> joinTournament(String tournamentId, String userId) async {
    try {
      // Start a transaction to ensure atomicity
      return await _firestore.runTransaction<bool>((transaction) async {
        // Get tournament document
        final tournamentDoc = await transaction.get(_firestore.collection('tournaments').doc(tournamentId));
        
        if (!tournamentDoc.exists) {
          throw Exception('Tournament not found');
        }
        
        final tournamentData = tournamentDoc.data()!;
        
        // Check if tournament is full
        if (tournamentData['current_players'] >= tournamentData['max_players']) {
          return false; // Tournament is full
        }
        
        // Check if tournament is upcoming or active
        if (tournamentData['status'] == 'completed') {
          return false; // Tournament is already completed
        }
        
        // Get user document to check coins
        final userDoc = await transaction.get(_firestore.collection('users').doc(userId));
        
        if (!userDoc.exists) {
          throw Exception('User not found');
        }
        
        final userData = userDoc.data()!;
        
        // Check if user has enough coins
        if (userData['coins'] < tournamentData['entry_fee']) {
          return false; // Not enough coins
        }
        
        // Check if user already joined
        final existingEntryQuery = await _firestore
            .collection('tournament_entries')
            .where('tournament_id', isEqualTo: tournamentId)
            .where('user_id', isEqualTo: userId)
            .get();
        
        if (existingEntryQuery.docs.isNotEmpty) {
          return false; // Already joined
        }
        
        // Deduct entry fee
        transaction.update(_firestore.collection('users').doc(userId), {
          'coins': FieldValue.increment(-tournamentData['entry_fee']),
        });
        
        // Increment player count
        transaction.update(_firestore.collection('tournaments').doc(tournamentId), {
          'current_players': FieldValue.increment(1),
        });
        
        // Create tournament entry
        final entryRef = _firestore.collection('tournament_entries').doc();
        transaction.set(entryRef, {
          'tournament_id': tournamentId,
          'user_id': userId,
          'joined_at': FieldValue.serverTimestamp(),
          'score': 0,
          'rank': null, // Will be set when tournament ends
        });
        
        return true; // Successfully joined
      });
    } catch (e) {
      developer.log('Error joining tournament: $e');
      return false;
    }
  }
  
  // Clan/Team System
  Future<String> createClan(String name, String description, String userId) async {
    try {
      // Check if clan name is already taken
      final existingClanQuery = await _firestore
          .collection('clans')
          .where('name', isEqualTo: name)
          .get();
      
      if (existingClanQuery.docs.isNotEmpty) {
        throw Exception('Clan name already taken');
      }
      
      // Create clan document
      final clanRef = await _firestore.collection('clans').add({
        'name': name,
        'description': description,
        'leader_id': userId,
        'members_count': 1, // Leader is first member
        'total_score': 0,
        'created_at': FieldValue.serverTimestamp(),
      });
      
      // Add leader as member
      await _firestore.collection('clan_members').add({
        'clan_id': clanRef.id,
        'user_id': userId,
        'role': 'leader',
        'joined_at': FieldValue.serverTimestamp(),
      });
      
      // Update user's clan reference
      await _firestore.collection('users').doc(userId).update({
        'clan_id': clanRef.id,
        'clan_role': 'leader',
      });
      
      return clanRef.id;
    } catch (e) {
      developer.log('Error creating clan: $e');
      rethrow;
    }
  }
  
  Future<bool> joinClan(String clanId, String userId) async {
    try {
      // Check if user is already in a clan
      final userDoc = await _firestore.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw Exception('User not found');
      }
      
      final userData = userDoc.data()!;
      if (userData['clan_id'] != null) {
        return false; // Already in a clan
      }
      
      // Add user as clan member
      await _firestore.collection('clan_members').add({
        'clan_id': clanId,
        'user_id': userId,
        'role': 'member',
        'joined_at': FieldValue.serverTimestamp(),
      });
      
      // Update clan member count
      await _firestore.collection('clans').doc(clanId).update({
        'members_count': FieldValue.increment(1),
      });
      
      // Update user's clan reference
      await _firestore.collection('users').doc(userId).update({
        'clan_id': clanId,
        'clan_role': 'member',
      });
      
      return true;
    } catch (e) {
      developer.log('Error joining clan: $e');
      return false;
    }
  }
  
  Future<List<Map<String, dynamic>>> getTopClans(int limit) async {
    try {
      final querySnapshot = await _firestore
          .collection('clans')
          .orderBy('total_score', descending: true)
          .limit(limit)
          .get();
      
      return querySnapshot.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        return data;
      }).toList();
    } catch (e) {
      developer.log('Error getting top clans: $e');
      return [];
    }
  }
  
  Future<Map<String, dynamic>?> getClanDetails(String clanId) async {
    try {
      final doc = await _firestore.collection('clans').doc(clanId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      final data = doc.data()!;
      data['id'] = doc.id;
      
      // Get clan members
      final membersQuery = await _firestore
          .collection('clan_members')
          .where('clan_id', isEqualTo: clanId)
          .get();
      
      final members = <Map<String, dynamic>>[];
      
      for (final memberDoc in membersQuery.docs) {
        final memberData = memberDoc.data();
        final userId = memberData['user_id'];
        
        // Get user data
        final userDoc = await _firestore.collection('users').doc(userId).get();
        if (userDoc.exists) {
          final userData = userDoc.data()!;
          members.add({
            'user_id': userId,
            'username': userData['username'],
            'display_name': userData['display_name'],
            'avatar_url': userData['avatar_url'],
            'role': memberData['role'],
            'joined_at': memberData['joined_at'],
          });
        }
      }
      
      data['members'] = members;
      
      return data;
    } catch (e) {
      developer.log('Error getting clan details: $e');
      return null;
    }
  }
  
  // Avatar and Customization System
  Future<List<Map<String, dynamic>>> getAvailableAvatars(String userId) async {
    try {
      // Get all avatars
      final avatarsQuery = await _firestore.collection('avatars').get();
      
      // Get user's unlocked avatars
      final userDoc = await _firestore.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw Exception('User not found');
      }
      
      final userData = userDoc.data()!;
      final unlockedAvatars = (userData['unlocked_avatars'] as List<dynamic>?) ?? [];
      
      // Combine data
      return avatarsQuery.docs.map((doc) {
        final data = doc.data();
        data['id'] = doc.id;
        data['unlocked'] = unlockedAvatars.contains(doc.id);
        return data;
      }).toList();
    } catch (e) {
      developer.log('Error getting available avatars: $e');
      return [];
    }
  }
  
  Future<bool> purchaseAvatar(String avatarId, String userId) async {
    try {
      return await _firestore.runTransaction<bool>((transaction) async {
        // Get avatar document
        final avatarDoc = await transaction.get(_firestore.collection('avatars').doc(avatarId));
        
        if (!avatarDoc.exists) {
          throw Exception('Avatar not found');
        }
        
        final avatarData = avatarDoc.data()!;
        
        // Get user document
        final userDoc = await transaction.get(_firestore.collection('users').doc(userId));
        
        if (!userDoc.exists) {
          throw Exception('User not found');
        }
        
        final userData = userDoc.data()!;
        
        // Check if user already has this avatar
        final unlockedAvatars = (userData['unlocked_avatars'] as List<dynamic>?) ?? [];
        if (unlockedAvatars.contains(avatarId)) {
          return false; // Already unlocked
        }
        
        // Check if user has enough coins
        if (userData['coins'] < avatarData['cost']) {
          return false; // Not enough coins
        }
        
        // Deduct coins and add avatar to unlocked avatars
        transaction.update(_firestore.collection('users').doc(userId), {
          'coins': FieldValue.increment(-avatarData['cost']),
          'unlocked_avatars': FieldValue.arrayUnion([avatarId]),
        });
        
        return true; // Purchase successful
      });
    } catch (e) {
      developer.log('Error purchasing avatar: $e');
      return false;
    }
  }
  
  Future<bool> setActiveAvatar(String avatarId, String userId) async {
    try {
      // Check if user has this avatar
      final userDoc = await _firestore.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw Exception('User not found');
      }
      
      final userData = userDoc.data()!;
      final unlockedAvatars = (userData['unlocked_avatars'] as List<dynamic>?) ?? [];
      
      if (!unlockedAvatars.contains(avatarId)) {
        return false; // Avatar not unlocked
      }
      
      // Get avatar URL
      final avatarDoc = await _firestore.collection('avatars').doc(avatarId).get();
      if (!avatarDoc.exists) {
        throw Exception('Avatar not found');
      }
      
      final avatarData = avatarDoc.data()!;
      
      // Update user's active avatar
      await _firestore.collection('users').doc(userId).update({
        'avatar_url': avatarData['image_url'],
        'active_avatar_id': avatarId,
      });
      
      return true;
    } catch (e) {
      developer.log('Error setting active avatar: $e');
      return false;
    }
  }
  
  // Real-time Multiplayer
  Stream<QuerySnapshot> getGameSessionUpdates(String sessionCode) {
    return _firestore
        .collection('game_sessions')
        .where('session_code', isEqualTo: sessionCode)
        .snapshots();
  }
  
  Stream<QuerySnapshot> getPlayerSessionUpdates(String gameSessionId) {
    return _firestore
        .collection('player_sessions')
        .where('game_session_id', isEqualTo: gameSessionId)
        .snapshots();
  }
}