class Clan {
  final String id;
  final String name;
  final String description;
  final String leaderId;
  final int membersCount;
  final int totalScore;
  final String? avatarUrl;
  final List<ClanMember>? members;
  final List<ClanAchievement>? achievements;
  final Map<String, dynamic>? weeklyStats;

  Clan({
    required this.id,
    required this.name,
    required this.description,
    required this.leaderId,
    required this.membersCount,
    required this.totalScore,
    this.avatarUrl,
    this.members,
    this.achievements,
    this.weeklyStats,
  });

  factory Clan.fromJson(Map<String, dynamic> json) {
    return Clan(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      leaderId: json['leader_id'] ?? '',
      membersCount: json['members_count'] ?? 0,
      totalScore: json['total_score'] ?? 0,
      avatarUrl: json['avatar_url'],
      members: json['members'] != null
          ? List<ClanMember>.from(
              json['members'].map((x) => ClanMember.fromJson(x)))
          : null,
      achievements: json['achievements'] != null
          ? List<ClanAchievement>.from(
              json['achievements'].map((x) => ClanAchievement.fromJson(x)))
          : null,
      weeklyStats: json['weekly_stats'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'leader_id': leaderId,
      'members_count': membersCount,
      'total_score': totalScore,
      'avatar_url': avatarUrl,
      'members': members?.map((x) => x.toJson()).toList(),
      'achievements': achievements?.map((x) => x.toJson()).toList(),
      'weekly_stats': weeklyStats,
    };
  }
}

class ClanMember {
  final String userId;
  final String clanId;
  final String role; // 'leader', 'officer', 'member'
  final String? username;
  final String? displayName;
  final int? contribution;
  final DateTime? joinedAt;

  ClanMember({
    required this.userId,
    required this.clanId,
    required this.role,
    this.username,
    this.displayName,
    this.contribution,
    this.joinedAt,
  });

  factory ClanMember.fromJson(Map<String, dynamic> json) {
    return ClanMember(
      userId: json['user_id'] ?? '',
      clanId: json['clan_id'] ?? '',
      role: json['role'] ?? 'member',
      username: json['username'],
      displayName: json['display_name'],
      contribution: json['contribution'],
      joinedAt: json['joined_at'] != null
          ? DateTime.parse(json['joined_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'clan_id': clanId,
      'role': role,
      'username': username,
      'display_name': displayName,
      'contribution': contribution,
      'joined_at': joinedAt?.toIso8601String(),
    };
  }

  // Getter to check if member is leader
  bool get isLeader => role == 'leader';

  // Getter to check if member is officer
  bool get isOfficer => role == 'officer';
}

class ClanAchievement {
  final String id;
  final String clanId;
  final String name;
  final String description;
  final String type; // 'tournaments', 'matches', 'seasons', etc.
  final int points;
  final DateTime earnedAt;
  final String? iconUrl;

  ClanAchievement({
    required this.id,
    required this.clanId,
    required this.name,
    required this.description,
    required this.type,
    required this.points,
    required this.earnedAt,
    this.iconUrl,
  });

  factory ClanAchievement.fromJson(Map<String, dynamic> json) {
    return ClanAchievement(
      id: json['id'] ?? '',
      clanId: json['clan_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      type: json['type'] ?? '',
      points: json['points'] ?? 0,
      earnedAt: json['earned_at'] != null
          ? DateTime.parse(json['earned_at'])
          : DateTime.now(),
      iconUrl: json['icon_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'clan_id': clanId,
      'name': name,
      'description': description,
      'type': type,
      'points': points,
      'earned_at': earnedAt.toIso8601String(),
      'icon_url': iconUrl,
    };
  }
}

class ClanChallenge {
  final String id;
  final String name;
  final String description;
  final int target;
  final int currentProgress;
  final String type; // 'win_matches', 'tournaments', 'questions', etc.
  final int reward;
  final DateTime startDate;
  final DateTime endDate;

  ClanChallenge({
    required this.id,
    required this.name,
    required this.description,
    required this.target,
    required this.currentProgress,
    required this.type,
    required this.reward,
    required this.startDate,
    required this.endDate,
  });

  factory ClanChallenge.fromJson(Map<String, dynamic> json) {
    return ClanChallenge(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      target: json['target'] ?? 0,
      currentProgress: json['current_progress'] ?? 0,
      type: json['type'] ?? '',
      reward: json['reward'] ?? 0,
      startDate: json['start_date'] != null
          ? DateTime.parse(json['start_date'])
          : DateTime.now(),
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'])
          : DateTime.now().add(const Duration(days: 7)),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'target': target,
      'current_progress': currentProgress,
      'type': type,
      'reward': reward,
      'start_date': startDate.toIso8601String(),
      'end_date': endDate.toIso8601String(),
    };
  }

  // Getter for progress percentage
  double get progressPercentage => currentProgress / target;

  // Getter to check if challenge is completed
  bool get isCompleted => currentProgress >= target;

  // Getter to check if challenge is active
  bool get isActive {
    final now = DateTime.now();
    return now.isAfter(startDate) && now.isBefore(endDate);
  }

  // Getter to check if challenge is expired
  bool get isExpired {
    final now = DateTime.now();
    return now.isAfter(endDate);
  }
}

class ClanInvitation {
  final String id;
  final String clanId;
  final String userId;
  final String inviterId;
  final DateTime createdAt;
  final DateTime expiresAt;
  final String status; // 'pending', 'accepted', 'rejected', 'expired'

  ClanInvitation({
    required this.id,
    required this.clanId,
    required this.userId,
    required this.inviterId,
    required this.createdAt,
    required this.expiresAt,
    required this.status,
  });

  factory ClanInvitation.fromJson(Map<String, dynamic> json) {
    return ClanInvitation(
      id: json['id'] ?? '',
      clanId: json['clan_id'] ?? '',
      userId: json['user_id'] ?? '',
      inviterId: json['inviter_id'] ?? '',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'])
          : DateTime.now().add(const Duration(days: 7)),
      status: json['status'] ?? 'pending',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'clan_id': clanId,
      'user_id': userId,
      'inviter_id': inviterId,
      'created_at': createdAt.toIso8601String(),
      'expires_at': expiresAt.toIso8601String(),
      'status': status,
    };
  }

  // Getter to check if invitation is pending
  bool get isPending => status == 'pending';

  // Getter to check if invitation is accepted
  bool get isAccepted => status == 'accepted';

  // Getter to check if invitation is rejected
  bool get isRejected => status == 'rejected';

  // Getter to check if invitation is expired
  bool get isExpired {
    if (status == 'expired') return true;
    final now = DateTime.now();
    return now.isAfter(expiresAt);
  }
}