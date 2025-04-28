import 'package:cloud_firestore/cloud_firestore.dart';

class BattlePassReward {
  final int tier;
  final String type; // 'coins', 'avatar', 'experience', etc.
  final String name;
  final String description;
  final String? imageUrl;
  final int? amount; // For coins or experience
  final String? avatarId; // For avatar rewards
  final bool isPremium; // Whether this reward is for premium pass holders only
  
  BattlePassReward({
    required this.tier,
    required this.type,
    required this.name,
    required this.description,
    this.imageUrl,
    this.amount,
    this.avatarId,
    this.isPremium = false,
  });
  
  factory BattlePassReward.fromMap(Map<String, dynamic> map) {
    return BattlePassReward(
      tier: map['tier'],
      type: map['type'],
      name: map['name'],
      description: map['description'],
      imageUrl: map['image_url'],
      amount: map['amount'],
      avatarId: map['avatar_id'],
      isPremium: map['is_premium'] ?? false,
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'tier': tier,
      'type': type,
      'name': name,
      'description': description,
      'image_url': imageUrl,
      'amount': amount,
      'avatar_id': avatarId,
      'is_premium': isPremium,
    };
  }
}

class BattlePass {
  final String? id;
  final String name;
  final DateTime startDate;
  final DateTime endDate;
  final int premiumCost;
  final List<BattlePassReward> rewards;
  final DateTime? createdAt;
  
  BattlePass({
    this.id,
    required this.name,
    required this.startDate,
    required this.endDate,
    required this.premiumCost,
    required this.rewards,
    this.createdAt,
  });
  
  factory BattlePass.fromMap(Map<String, dynamic> map) {
    List<BattlePassReward> rewardsList = [];
    
    if (map['rewards'] != null) {
      rewardsList = (map['rewards'] as List).map((item) {
        return BattlePassReward.fromMap(item);
      }).toList();
      
      // Sort rewards by tier
      rewardsList.sort((a, b) => a.tier.compareTo(b.tier));
    }
    
    return BattlePass(
      id: map['id'],
      name: map['name'],
      startDate: map['start_date'] is Timestamp
        ? (map['start_date'] as Timestamp).toDate()
        : DateTime.parse(map['start_date']),
      endDate: map['end_date'] is Timestamp
        ? (map['end_date'] as Timestamp).toDate()
        : DateTime.parse(map['end_date']),
      premiumCost: map['premium_cost'] ?? 1000,
      rewards: rewardsList,
      createdAt: map['created_at'] is Timestamp
        ? (map['created_at'] as Timestamp).toDate()
        : map['created_at'] != null
          ? DateTime.parse(map['created_at'])
          : null,
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'start_date': startDate,
      'end_date': endDate,
      'premium_cost': premiumCost,
      'rewards': rewards.map((reward) => reward.toMap()).toList(),
      'created_at': createdAt,
    };
  }
  
  bool get isActive {
    final now = DateTime.now();
    return now.isAfter(startDate) && now.isBefore(endDate);
  }
  
  int get daysRemaining {
    final now = DateTime.now();
    if (now.isAfter(endDate)) return 0;
    return endDate.difference(now).inDays;
  }
  
  double get progressPercentage {
    final now = DateTime.now();
    if (now.isBefore(startDate)) return 0.0;
    if (now.isAfter(endDate)) return 1.0;
    
    final totalDuration = endDate.difference(startDate).inMilliseconds;
    final elapsed = now.difference(startDate).inMilliseconds;
    
    return elapsed / totalDuration;
  }
}

class UserBattlePass {
  final String userId;
  final String battlePassId;
  final bool isPremium;
  final int currentTier;
  final int experiencePoints;
  final List<int> unlockedRewardTiers;
  final List<int> claimedRewardTiers;
  
  UserBattlePass({
    required this.userId,
    required this.battlePassId,
    this.isPremium = false,
    this.currentTier = 0,
    this.experiencePoints = 0,
    this.unlockedRewardTiers = const [],
    this.claimedRewardTiers = const [],
  });
  
  factory UserBattlePass.fromMap(Map<String, dynamic> map) {
    return UserBattlePass(
      userId: map['user_id'],
      battlePassId: map['battle_pass_id'],
      isPremium: map['is_premium'] ?? false,
      currentTier: map['current_tier'] ?? 0,
      experiencePoints: map['experience_points'] ?? 0,
      unlockedRewardTiers: map['unlocked_reward_tiers'] != null
        ? List<int>.from(map['unlocked_reward_tiers'])
        : [],
      claimedRewardTiers: map['claimed_reward_tiers'] != null
        ? List<int>.from(map['claimed_reward_tiers'])
        : [],
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'user_id': userId,
      'battle_pass_id': battlePassId,
      'is_premium': isPremium,
      'current_tier': currentTier,
      'experience_points': experiencePoints,
      'unlocked_reward_tiers': unlockedRewardTiers,
      'claimed_reward_tiers': claimedRewardTiers,
    };
  }
  
  bool canClaimReward(int tier, bool isPremiumReward) {
    // If reward is premium and user doesn't have premium pass
    if (isPremiumReward && !this.isPremium) {
      return false;
    }
    
    // If tier is already claimed
    if (claimedRewardTiers.contains(tier)) {
      return false;
    }
    
    // If tier is unlocked
    return unlockedRewardTiers.contains(tier) || currentTier >= tier;
  }
}