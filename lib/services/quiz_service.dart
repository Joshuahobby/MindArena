import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:mind_arena/config/constants.dart';
import 'package:mind_arena/models/match_model.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/services/database_service.dart';

class QuizService {
  final DatabaseService _databaseService = DatabaseService();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseDatabase _database = FirebaseDatabase.instance;

  // Matchmaking methods
  Future<String> joinMatchmaking(String userId) async {
    try {
      // Get user data
      UserModel? user = await _databaseService.getUserData(userId);
      if (user == null) throw Exception('User not found');
      
      // Check for active matchmaking reference
      DatabaseReference matchmakingRef = _database.reference().child('matchmaking');
      
      // Look for active waiting games with open slots
      DatabaseEvent snapshot = await matchmakingRef
          .orderByChild('status')
          .equalTo('waiting')
          .limitToFirst(1)
          .once();
      
      String matchId;
      
      if (snapshot.snapshot.value != null) {
        // Join existing match
        Map<dynamic, dynamic> data = Map<dynamic, dynamic>.from(snapshot.snapshot.value as Map);
        String waitingMatchId = data.keys.first;
        List<dynamic> players = List<dynamic>.from(data[waitingMatchId]['players']);
        
        // Check if player is already in this match
        bool alreadyJoined = players.any((p) => p['userId'] == userId);
        if (alreadyJoined) {
          return waitingMatchId;
        }
        
        // Check if match is full
        if (players.length >= AppConstants.maxPlayersPerMatch) {
          // Create new match if full
          matchId = await _createNewMatch(userId, user);
        } else {
          // Add player to existing match
          players.add({
            'userId': userId,
            'username': user.username,
            'avatarUrl': user.avatarUrl,
            'joinedAt': ServerValue.timestamp,
          });
          
          await matchmakingRef.child(waitingMatchId).update({
            'players': players,
          });
          
          matchId = waitingMatchId;
          
          // Check if match is now full to start the game
          if (players.length >= AppConstants.minPlayersPerMatch) {
            _checkAndStartMatch(matchId);
          }
        }
      } else {
        // No waiting matches, create new
        matchId = await _createNewMatch(userId, user);
      }
      
      return matchId;
    } catch (e) {
      throw Exception('Failed to join matchmaking: ${e.toString()}');
    }
  }
  
  Future<String> _createNewMatch(String userId, UserModel user) async {
    try {
      String matchId = DateTime.now().millisecondsSinceEpoch.toString();
      
      await _database.reference().child('matchmaking').child(matchId).set({
        'status': 'waiting',
        'createdAt': ServerValue.timestamp,
        'timeout': DateTime.now().add(const Duration(seconds: AppConstants.matchmakingTimeout)).millisecondsSinceEpoch,
        'players': [
          {
            'userId': userId,
            'username': user.username,
            'avatarUrl': user.avatarUrl,
            'joinedAt': ServerValue.timestamp,
          }
        ],
      });
      
      // Set up timeout to start match or cancel if not enough players
      Timer(const Duration(seconds: AppConstants.matchmakingTimeout), () {
        _checkAndStartMatch(matchId);
      });
      
      return matchId;
    } catch (e) {
      throw Exception('Failed to create match: ${e.toString()}');
    }
  }
  
  Future<void> _checkAndStartMatch(String matchId) async {
    try {
      DatabaseEvent snapshot = await _database.reference()
          .child('matchmaking')
          .child(matchId)
          .once();
      
      if (snapshot.snapshot.value == null) return;
      
      Map<dynamic, dynamic> data = Map<dynamic, dynamic>.from(snapshot.snapshot.value as Map);
      
      if (data['status'] != 'waiting') return; // Already processed
      
      List<dynamic> players = List<dynamic>.from(data['players']);
      
      if (players.length >= AppConstants.minPlayersPerMatch) {
        // Start the match
        await _database.reference().child('matchmaking').child(matchId).update({
          'status': 'starting',
        });
        
        // Create player ID list for Firestore match
        List<String> playerIds = players.map<String>((p) => p['userId'].toString()).toList();
        
        // Create the match in Firestore
        String firestoreMatchId = await _databaseService.createMatch(playerIds);
        
        // Update matchmaking entry with Firestore match ID
        await _database.reference().child('matchmaking').child(matchId).update({
          'firestoreMatchId': firestoreMatchId,
          'status': 'started',
        });
        
        // Start the match in Firestore
        await _databaseService.startMatch(firestoreMatchId);
      } else {
        // Not enough players, cancel the match
        await _database.reference().child('matchmaking').child(matchId).update({
          'status': 'cancelled',
          'reason': 'Not enough players',
        });
      }
    } catch (e) {
      print('Error in _checkAndStartMatch: ${e.toString()}');
    }
  }
  
  Future<void> leaveMatchmaking(String userId, String matchId) async {
    try {
      DatabaseEvent snapshot = await _database.reference()
          .child('matchmaking')
          .child(matchId)
          .once();
      
      if (snapshot.snapshot.value == null) return;
      
      Map<dynamic, dynamic> data = Map<dynamic, dynamic>.from(snapshot.snapshot.value as Map);
      
      if (data['status'] != 'waiting') return; // Can't leave if already starting
      
      List<dynamic> players = List<dynamic>.from(data['players']);
      players.removeWhere((p) => p['userId'] == userId);
      
      if (players.isEmpty) {
        // Remove the matchmaking entry if last player
        await _database.reference().child('matchmaking').child(matchId).remove();
      } else {
        // Update players list
        await _database.reference().child('matchmaking').child(matchId).update({
          'players': players,
        });
      }
    } catch (e) {
      throw Exception('Failed to leave matchmaking: ${e.toString()}');
    }
  }
  
  // Get match status from matchmaking
  Future<Map<String, dynamic>> getMatchmakingStatus(String matchId) async {
    try {
      DatabaseEvent snapshot = await _database.reference()
          .child('matchmaking')
          .child(matchId)
          .once();
      
      if (snapshot.snapshot.value == null) {
        throw Exception('Match not found');
      }
      
      Map<dynamic, dynamic> data = Map<dynamic, dynamic>.from(snapshot.snapshot.value as Map);
      
      return {
        'status': data['status'],
        'playerCount': (data['players'] as List).length,
        'firestoreMatchId': data['firestoreMatchId'],
      };
    } catch (e) {
      throw Exception('Failed to get matchmaking status: ${e.toString()}');
    }
  }
  
  // In-game methods
  Future<void> submitAnswer(String matchId, String userId, int questionIndex, int answerIndex, int timeSpent) async {
    await _databaseService.submitAnswer(matchId, userId, questionIndex, answerIndex, timeSpent);
  }
  
  Future<Stream<DocumentSnapshot>> getMatchStream(String matchId) async {
    return _databaseService.matchStream(matchId);
  }
  
  // Use rewarded ad to revive in a match
  Future<bool> useRevive(String matchId, String userId) async {
    try {
      // Check if match is still ongoing
      DocumentSnapshot matchDoc = await _firestore.collection(AppConstants.matchesCollection).doc(matchId).get();
      if (!matchDoc.exists) throw Exception('Match not found');
      
      MatchModel match = MatchModel.fromFirestore(matchDoc);
      if (match.status != 'inProgress') {
        throw Exception('Match is not in progress');
      }
      
      // Find player in match
      int playerIndex = -1;
      for (int i = 0; i < match.players.length; i++) {
        if (match.players[i].userId == userId) {
          playerIndex = i;
          break;
        }
      }
      
      if (playerIndex == -1) {
        throw Exception('Player not found in match');
      }
      
      // Check if player is already active
      if (match.players[playerIndex].isActive) {
        return false; // Already active, no need to revive
      }
      
      // Revive player
      await _firestore.collection(AppConstants.matchesCollection).doc(matchId)
          .update({
            'players.$playerIndex.isActive': true,
          });
      
      return true;
    } catch (e) {
      throw Exception('Failed to use revive: ${e.toString()}');
    }
  }
}
