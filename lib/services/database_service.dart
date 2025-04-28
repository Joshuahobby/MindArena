import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:mind_arena/config/constants.dart';
import 'package:mind_arena/models/leaderboard_model.dart';
import 'package:mind_arena/models/match_model.dart';
import 'package:mind_arena/models/question_model.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:uuid/uuid.dart';

class DatabaseService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseDatabase _database = FirebaseDatabase.instance;
  final Uuid _uuid = const Uuid();

  // User methods
  Future<UserModel?> getUserData(String userId) async {
    try {
      DocumentSnapshot doc = await _firestore.collection(AppConstants.usersCollection).doc(userId).get();
      if (doc.exists) {
        return UserModel.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      throw Exception('Failed to get user data: ${e.toString()}');
    }
  }
  
  Future<void> updateUserData(String userId, Map<String, dynamic> data) async {
    try {
      data['updatedAt'] = Timestamp.now();
      await _firestore.collection(AppConstants.usersCollection).doc(userId).update(data);
    } catch (e) {
      throw Exception('Failed to update user data: ${e.toString()}');
    }
  }

  Future<void> updateUserCoins(String userId, int amount) async {
    try {
      await _firestore.collection(AppConstants.usersCollection).doc(userId).update({
        'coins': FieldValue.increment(amount),
        'updatedAt': Timestamp.now(),
      });
    } catch (e) {
      throw Exception('Failed to update user coins: ${e.toString()}');
    }
  }

  Future<void> updateUserStats(String userId, {
    bool isWin = false,
    int pointsEarned = 0,
  }) async {
    try {
      await _firestore.collection(AppConstants.usersCollection).doc(userId).update({
        'totalMatches': FieldValue.increment(1),
        'matchesWon': isWin ? FieldValue.increment(1) : FieldValue.increment(0),
        'totalPoints': FieldValue.increment(pointsEarned),
        'updatedAt': Timestamp.now(),
      });

      // Update leaderboard entry
      await _updateLeaderboardEntry(userId, pointsEarned, isWin);
    } catch (e) {
      throw Exception('Failed to update user stats: ${e.toString()}');
    }
  }

  // Friend/Invitation methods
  Future<void> sendFriendRequest(String senderId, String receiverId) async {
    try {
      // Check if users exist
      DocumentSnapshot senderDoc = await _firestore.collection(AppConstants.usersCollection).doc(senderId).get();
      DocumentSnapshot receiverDoc = await _firestore.collection(AppConstants.usersCollection).doc(receiverId).get();
      
      if (!senderDoc.exists || !receiverDoc.exists) {
        throw Exception('User not found');
      }

      // Create friend request in Realtime Database
      String requestId = _uuid.v4();
      await _database.reference().child('friendRequests').child(requestId).set({
        'senderId': senderId,
        'senderName': (senderDoc.data() as Map<String, dynamic>)['username'],
        'receiverId': receiverId,
        'timestamp': ServerValue.timestamp,
        'status': 'pending',
      });
    } catch (e) {
      throw Exception('Failed to send friend request: ${e.toString()}');
    }
  }

  Future<void> acceptFriendRequest(String requestId) async {
    try {
      // Get request data
      DatabaseEvent event = await _database.reference().child('friendRequests').child(requestId).once();
      Map<String, dynamic> requestData = Map<String, dynamic>.from(event.snapshot.value as Map);
      
      String senderId = requestData['senderId'];
      String receiverId = requestData['receiverId'];

      // Update request status
      await _database.reference().child('friendRequests').child(requestId).update({
        'status': 'accepted',
        'acceptedAt': ServerValue.timestamp,
      });

      // Add to friends list for both users
      await _firestore.collection(AppConstants.usersCollection).doc(senderId).update({
        'friends': FieldValue.arrayUnion([receiverId]),
        'updatedAt': Timestamp.now(),
      });

      await _firestore.collection(AppConstants.usersCollection).doc(receiverId).update({
        'friends': FieldValue.arrayUnion([senderId]),
        'updatedAt': Timestamp.now(),
      });
    } catch (e) {
      throw Exception('Failed to accept friend request: ${e.toString()}');
    }
  }

  Future<List<Map<String, dynamic>>> getPendingFriendRequests(String userId) async {
    try {
      DatabaseEvent event = await _database.reference()
          .child('friendRequests')
          .orderByChild('receiverId')
          .equalTo(userId)
          .once();
      
      if (event.snapshot.value == null) return [];
      
      Map<dynamic, dynamic> data = Map<dynamic, dynamic>.from(event.snapshot.value as Map);
      List<Map<String, dynamic>> requests = [];
      
      data.forEach((key, value) {
        if (value['status'] == 'pending') {
          requests.add({
            'id': key,
            'senderId': value['senderId'],
            'senderName': value['senderName'],
            'timestamp': value['timestamp'],
          });
        }
      });
      
      return requests;
    } catch (e) {
      throw Exception('Failed to get friend requests: ${e.toString()}');
    }
  }

  // Question methods
  Future<List<QuestionModel>> getRandomQuestions({
    int count = 5, 
    String? category,
    int? difficulty,
  }) async {
    try {
      Query query = _firestore.collection(AppConstants.questionsCollection)
          .where('isActive', isEqualTo: true);
      
      if (category != null) {
        query = query.where('category', isEqualTo: category);
      }
      
      if (difficulty != null) {
        query = query.where('difficulty', isEqualTo: difficulty);
      }
      
      QuerySnapshot snapshot = await query.get();
      List<QuestionModel> questions = snapshot.docs
          .map((doc) => QuestionModel.fromFirestore(doc))
          .toList();
      
      // Randomize and limit to count
      questions.shuffle();
      if (questions.length > count) {
        questions = questions.sublist(0, count);
      }
      
      return questions;
    } catch (e) {
      throw Exception('Failed to get questions: ${e.toString()}');
    }
  }

  // Match methods
  Future<String> createMatch(List<String> playerIds) async {
    try {
      // Get random questions
      List<QuestionModel> randomQuestions = await getRandomQuestions(
        count: AppConstants.questionsPerMatch,
      );
      
      if (randomQuestions.isEmpty) {
        throw Exception('No questions available for the match');
      }

      // Get player details
      List<MatchPlayer> players = [];
      for (String playerId in playerIds) {
        DocumentSnapshot userDoc = await _firestore.collection(AppConstants.usersCollection).doc(playerId).get();
        if (userDoc.exists) {
          Map<String, dynamic> userData = userDoc.data() as Map<String, dynamic>;
          players.add(MatchPlayer(
            userId: playerId,
            username: userData['username'] ?? 'Player',
            avatarUrl: userData['avatarUrl'] ?? '',
          ));
        }
      }

      // Convert questions to match format
      List<MatchQuestion> matchQuestions = randomQuestions.map((q) => MatchQuestion(
        questionId: q.id,
        question: q.question,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        category: q.category,
      )).toList();

      // Create match document
      String matchId = _uuid.v4();
      DateTime now = DateTime.now();
      
      MatchModel match = MatchModel(
        id: matchId,
        players: players,
        questions: matchQuestions,
        createdAt: now,
        status: 'waiting',
      );

      await _firestore.collection(AppConstants.matchesCollection).doc(matchId).set(match.toFirestore());
      
      return matchId;
    } catch (e) {
      throw Exception('Failed to create match: ${e.toString()}');
    }
  }

  Future<void> startMatch(String matchId) async {
    try {
      await _firestore.collection(AppConstants.matchesCollection).doc(matchId).update({
        'status': 'inProgress',
        'startedAt': Timestamp.now(),
      });
    } catch (e) {
      throw Exception('Failed to start match: ${e.toString()}');
    }
  }

  Future<void> submitAnswer(String matchId, String userId, int questionIndex, int answerIndex, int timeSpent) async {
    try {
      // Get match and question data
      DocumentSnapshot matchDoc = await _firestore.collection(AppConstants.matchesCollection).doc(matchId).get();
      if (!matchDoc.exists) throw Exception('Match not found');
      
      MatchModel match = MatchModel.fromFirestore(matchDoc);
      if (match.status != 'inProgress') throw Exception('Match is not in progress');
      
      if (questionIndex >= match.questions.length) throw Exception('Invalid question index');
      MatchQuestion question = match.questions[questionIndex];
      
      // Calculate score based on correctness and time
      bool isCorrect = answerIndex == question.correctOptionIndex;
      int basePoints = isCorrect ? AppConstants.pointsPerCorrectAnswer : 0;
      
      // Time bonus: faster answers get more points (max bonus for 1 second or less)
      int timeBonus = 0;
      if (isCorrect) {
        int maxTime = AppConstants.questionTimeLimit;
        int remainingTime = maxTime - timeSpent;
        if (remainingTime > 0) {
          timeBonus = (remainingTime / maxTime) * AppConstants.bonusPointsForSpeed;
        }
      }
      
      int totalPoints = basePoints + timeBonus.toInt();
      
      // Update player's answer in match
      await _firestore.runTransaction((transaction) async {
        DocumentSnapshot freshMatchDoc = await transaction.get(
          _firestore.collection(AppConstants.matchesCollection).doc(matchId)
        );
        
        MatchModel freshMatch = MatchModel.fromFirestore(freshMatchDoc);
        List<MatchPlayer> updatedPlayers = [];
        
        for (MatchPlayer player in freshMatch.players) {
          if (player.userId == userId) {
            // Update this player
            Map<String, dynamic> answers = Map.from(player.answers);
            answers['q$questionIndex'] = {
              'answerIndex': answerIndex,
              'isCorrect': isCorrect,
              'timeSpent': timeSpent,
              'points': totalPoints,
              'timestamp': Timestamp.now(),
            };
            
            player.answers = answers;
            player.score += totalPoints;
          }
          updatedPlayers.add(player);
        }
        
        // Update match data
        transaction.update(
          _firestore.collection(AppConstants.matchesCollection).doc(matchId),
          {
            'players': updatedPlayers.map((p) => p.toMap()).toList(),
          }
        );
      });
      
      // Check if all active players have answered
      DocumentSnapshot updatedMatchDoc = await _firestore.collection(AppConstants.matchesCollection).doc(matchId).get();
      MatchModel updatedMatch = MatchModel.fromFirestore(updatedMatchDoc);
      
      if (updatedMatch.allPlayersAnswered) {
        // Move to next question or end match
        if (questionIndex == updatedMatch.questions.length - 1) {
          // Last question, end the match
          await _endMatch(matchId);
        } else {
          // Move to next question
          await _firestore.collection(AppConstants.matchesCollection).doc(matchId).update({
            'currentQuestionIndex': questionIndex + 1,
          });
        }
      }
    } catch (e) {
      throw Exception('Failed to submit answer: ${e.toString()}');
    }
  }

  Future<void> _endMatch(String matchId) async {
    try {
      await _firestore.runTransaction((transaction) async {
        DocumentSnapshot matchDoc = await transaction.get(
          _firestore.collection(AppConstants.matchesCollection).doc(matchId)
        );
        
        MatchModel match = MatchModel.fromFirestore(matchDoc);
        List<MatchPlayer> players = match.players;
        
        // Sort players by score to determine rank
        players.sort((a, b) => b.score.compareTo(a.score));
        
        // Assign ranks
        int currentRank = 1;
        int previousScore = -1;
        for (int i = 0; i < players.length; i++) {
          if (i > 0 && players[i].score != previousScore) {
            currentRank = i + 1;
          }
          players[i].rank = currentRank;
          previousScore = players[i].score;
        }
        
        // Update match data
        transaction.update(
          _firestore.collection(AppConstants.matchesCollection).doc(matchId),
          {
            'status': 'completed',
            'endedAt': Timestamp.now(),
            'players': players.map((p) => p.toMap()).toList(),
          }
        );
      });
      
      // Update stats for all players
      DocumentSnapshot matchDoc = await _firestore.collection(AppConstants.matchesCollection).doc(matchId).get();
      MatchModel match = MatchModel.fromFirestore(matchDoc);
      
      for (MatchPlayer player in match.players) {
        bool isWinner = player.rank == 1;
        int earnedCoins = isWinner ? AppConstants.coinsPerWin : 0;
        
        // Update user stats and coins
        await updateUserStats(player.userId, isWin: isWinner, pointsEarned: player.score);
        if (earnedCoins > 0) {
          await updateUserCoins(player.userId, earnedCoins);
        }
      }
    } catch (e) {
      throw Exception('Failed to end match: ${e.toString()}');
    }
  }

  Future<Stream<DocumentSnapshot>> matchStream(String matchId) {
    return Future.value(_firestore.collection(AppConstants.matchesCollection).doc(matchId).snapshots());
  }

  // Leaderboard methods
  Future<List<LeaderboardEntry>> getLeaderboard({String type = 'global', int limit = 100}) async {
    try {
      QuerySnapshot snapshot = await _firestore.collection(AppConstants.leaderboardCollection)
          .doc(type)
          .collection('entries')
          .orderBy('score', descending: true)
          .limit(limit)
          .get();
      
      List<LeaderboardEntry> entries = [];
      int rank = 1;
      for (var doc in snapshot.docs) {
        Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
        entries.add(LeaderboardEntry(
          userId: doc.id,
          username: data['username'] ?? 'Unknown',
          avatarUrl: data['avatarUrl'] ?? '',
          score: data['score'] ?? 0,
          rank: rank,
          matchesPlayed: data['matchesPlayed'] ?? 0,
          matchesWon: data['matchesWon'] ?? 0,
          lastUpdated: (data['lastUpdated'] as Timestamp).toDate(),
        ));
        rank++;
      }
      
      return entries;
    } catch (e) {
      throw Exception('Failed to get leaderboard: ${e.toString()}');
    }
  }

  Future<void> _updateLeaderboardEntry(String userId, int pointsEarned, bool isWin) async {
    try {
      // Get user data
      DocumentSnapshot userDoc = await _firestore.collection(AppConstants.usersCollection).doc(userId).get();
      if (!userDoc.exists) return;
      
      UserModel user = UserModel.fromFirestore(userDoc);
      
      // Update global leaderboard
      DocumentReference entryRef = _firestore
          .collection(AppConstants.leaderboardCollection)
          .doc('global')
          .collection('entries')
          .doc(userId);
      
      // Check if entry exists
      DocumentSnapshot entryDoc = await entryRef.get();
      
      if (entryDoc.exists) {
        // Update existing entry
        await entryRef.update({
          'username': user.username,
          'avatarUrl': user.avatarUrl,
          'score': FieldValue.increment(pointsEarned),
          'matchesPlayed': FieldValue.increment(1),
          'matchesWon': isWin ? FieldValue.increment(1) : FieldValue.increment(0),
          'lastUpdated': Timestamp.now(),
        });
      } else {
        // Create new entry
        await entryRef.set({
          'username': user.username,
          'avatarUrl': user.avatarUrl,
          'score': pointsEarned,
          'matchesPlayed': 1,
          'matchesWon': isWin ? 1 : 0,
          'lastUpdated': Timestamp.now(),
        });
      }
      
      // TODO: Weekly and monthly leaderboards updates would go here
    } catch (e) {
      // Log error but don't throw to prevent match flow disruption
      print('Failed to update leaderboard: ${e.toString()}');
    }
  }

  // Daily rewards methods
  Future<Map<String, dynamic>> getDailyRewardInfo(String userId) async {
    try {
      DocumentSnapshot userDoc = await _firestore.collection(AppConstants.usersCollection).doc(userId).get();
      if (!userDoc.exists) throw Exception('User not found');
      
      UserModel user = UserModel.fromFirestore(userDoc);
      int day = user.consecutiveLoginDays;
      if (day <= 0) day = 1; // Ensure minimum day is 1
      
      // Get reward amount
      int rewardAmount = AppConstants.dailyRewards[
        (day - 1) % AppConstants.dailyRewards.length
      ];
      
      return {
        'day': day,
        'amount': rewardAmount,
        'claimed': false, // This will be set based on local storage check
      };
    } catch (e) {
      throw Exception('Failed to get daily reward info: ${e.toString()}');
    }
  }

  Future<bool> claimDailyReward(String userId) async {
    try {
      Map<String, dynamic> rewardInfo = await getDailyRewardInfo(userId);
      int rewardAmount = rewardInfo['amount'];
      
      // Update user coins
      await updateUserCoins(userId, rewardAmount);
      
      return true;
    } catch (e) {
      throw Exception('Failed to claim daily reward: ${e.toString()}');
    }
  }
}
