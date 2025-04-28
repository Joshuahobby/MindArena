class BattlePass {
  final String id;
  final String name;
  final String description;
  final DateTime startDate;
  final DateTime endDate;
  final int maxTier;
  final int premiumCost;
  final String theme;
  final List<BattlePassReward>? rewards;
  final List<BattlePassChallenge>? challenges;

  BattlePass({
    required this.id,
    required this.name,
    required this.description,
    required this.startDate,
    required this.endDate,
    required this.maxTier,
    required this.premiumCost,
    required this.theme,
    this.rewards,
    this.challenges,
  });

  factory BattlePass.fromJson(Map<String, dynamic> json) {
    return BattlePass(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      startDate: json['start_date'] != null
          ? DateTime.parse(json['start_date'])
          : DateTime.now(),
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'])
          : DateTime.now().add(const Duration(days: 30)),
      maxTier: json['max_tier'] ?? 100,
      premiumCost: json['premium_cost'] ?? 950,
      theme: json['theme'] ?? 'default',
      rewards: json['rewards'] != null
          ? List<BattlePassReward>.from(
              json['rewards'].map((x) => BattlePassReward.fromJson(x)))
          : null,
      challenges: json['challenges'] != null
          ? List<BattlePassChallenge>.from(
              json['challenges'].map((x) => BattlePassChallenge.fromJson(x)))
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'start_date': startDate.toIso8601String(),
      'end_date': endDate.toIso8601String(),
      'max_tier': maxTier,
      'premium_cost': premiumCost,
      'theme': theme,
      'rewards': rewards?.map((x) => x.toJson()).toList(),
      'challenges': challenges?.map((x) => x.toJson()).toList(),
    };
  }

  // Getter to check if battle pass is active
  bool get isActive {
    final now = DateTime.now();
    return now.isAfter(startDate) && now.isBefore(endDate);
  }

  // Getter to check if battle pass is upcoming
  bool get isUpcoming {
    final now = DateTime.now();
    return now.isBefore(startDate);
  }

  // Getter to check if battle pass is expired
  bool get isExpired {
    final now = DateTime.now();
    return now.isAfter(endDate);
  }

  // Getter to get remaining days
  int get remainingDays {
    final now = DateTime.now();
    if (isExpired) return 0;
    return endDate.difference(now).inDays;
  }
}

class BattlePassReward {
  final int tier;
  final String name;
  final String description;
  final String type; // 'coins', 'experience', 'avatar', 'emote', etc.
  final int? amount; // For coins, experience, etc.
  final String? itemId; // For avatars, emotes, etc.
  final bool isPremium;
  final String? imageUrl;

  BattlePassReward({
    required this.tier,
    required this.name,
    required this.description,
    required this.type,
    this.amount,
    this.itemId,
    this.isPremium = false,
    this.imageUrl,
  });

  factory BattlePassReward.fromJson(Map<String, dynamic> json) {
    return BattlePassReward(
      tier: json['tier'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      type: json['type'] ?? '',
      amount: json['amount'],
      itemId: json['item_id'],
      isPremium: json['is_premium'] ?? false,
      imageUrl: json['image_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tier': tier,
      'name': name,
      'description': description,
      'type': type,
      'amount': amount,
      'item_id': itemId,
      'is_premium': isPremium,
      'image_url': imageUrl,
    };
  }
}

class BattlePassChallenge {
  final String id;
  final String name;
  final String description;
  final int experiencePoints;
  final String type; // 'daily', 'weekly', 'seasonal'
  final String category; // 'win_matches', 'answer_questions', etc.
  final int target;
  final DateTime? startDate;
  final DateTime? endDate;

  BattlePassChallenge({
    required this.id,
    required this.name,
    required this.description,
    required this.experiencePoints,
    required this.type,
    required this.category,
    required this.target,
    this.startDate,
    this.endDate,
  });

  factory BattlePassChallenge.fromJson(Map<String, dynamic> json) {
    return BattlePassChallenge(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      experiencePoints: json['experience_points'] ?? 0,
      type: json['type'] ?? 'daily',
      category: json['category'] ?? '',
      target: json['target'] ?? 0,
      startDate: json['start_date'] != null
          ? DateTime.parse(json['start_date'])
          : null,
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'experience_points': experiencePoints,
      'type': type,
      'category': category,
      'target': target,
      'start_date': startDate?.toIso8601String(),
      'end_date': endDate?.toIso8601String(),
    };
  }

  // Getter to check if challenge is active
  bool get isActive {
    if (startDate == null || endDate == null) return true;
    final now = DateTime.now();
    return now.isAfter(startDate!) && now.isBefore(endDate!);
  }
}

class UserBattlePass {
  final String userId;
  final String battlePassId;
  final int currentTier;
  final int experiencePoints;
  final bool isPremium;
  final List<int>? claimedTiers;
  final List<int>? claimedPremiumTiers;
  final Map<String, int>? challengeProgress;

  UserBattlePass({
    required this.userId,
    required this.battlePassId,
    required this.currentTier,
    required this.experiencePoints,
    required this.isPremium,
    this.claimedTiers,
    this.claimedPremiumTiers,
    this.challengeProgress,
  });

  factory UserBattlePass.fromJson(Map<String, dynamic> json) {
    return UserBattlePass(
      userId: json['user_id'] ?? '',
      battlePassId: json['battle_pass_id'] ?? '',
      currentTier: json['current_tier'] ?? 0,
      experiencePoints: json['experience_points'] ?? 0,
      isPremium: json['is_premium'] ?? false,
      claimedTiers: json['claimed_tiers'] != null
          ? List<int>.from(json['claimed_tiers'])
          : null,
      claimedPremiumTiers: json['claimed_premium_tiers'] != null
          ? List<int>.from(json['claimed_premium_tiers'])
          : null,
      challengeProgress: json['challenge_progress'] != null
          ? Map<String, int>.from(json['challenge_progress'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'battle_pass_id': battlePassId,
      'current_tier': currentTier,
      'experience_points': experiencePoints,
      'is_premium': isPremium,
      'claimed_tiers': claimedTiers,
      'claimed_premium_tiers': claimedPremiumTiers,
      'challenge_progress': challengeProgress,
    };
  }

  // Get the experience points needed for the next tier
  int getNextTierRequirement(int tier) {
    return 1000 + (tier * 100); // Example calculation
  }

  // Check if a tier reward is claimed
  bool isTierClaimed(int tier, bool isPremiumReward) {
    if (isPremiumReward) {
      return claimedPremiumTiers?.contains(tier) ?? false;
    } else {
      return claimedTiers?.contains(tier) ?? false;
    }
  }

  // Check if a tier is unlocked
  bool isTierUnlocked(int tier) {
    return currentTier >= tier;
  }

  // Get the progress percentage towards the next tier
  double getProgressToNextTier() {
    final nextTierRequirement = getNextTierRequirement(currentTier + 1);
    return experiencePoints / nextTierRequirement;
  }
}