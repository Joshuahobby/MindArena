class User {
  final int? id;
  final String username;
  final String? displayName;
  final String email;
  final String? avatarUrl;
  final int level;
  final int experiencePoints;
  final int coins;
  final bool isPremium;
  final Map<String, dynamic>? stats;
  final List<String>? achievements;
  final String? clanId;

  User({
    this.id,
    required this.username,
    this.displayName,
    required this.email,
    this.avatarUrl,
    this.level = 1,
    this.experiencePoints = 0,
    this.coins = 0,
    this.isPremium = false,
    this.stats,
    this.achievements,
    this.clanId,
  });

  User.empty()
      : id = null,
        username = '',
        displayName = null,
        email = '',
        avatarUrl = null,
        level = 1,
        experiencePoints = 0,
        coins = 0,
        isPremium = false,
        stats = null,
        achievements = null,
        clanId = null;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'] ?? '',
      displayName: json['display_name'],
      email: json['email'] ?? '',
      avatarUrl: json['avatar_url'],
      level: json['level'] ?? 1,
      experiencePoints: json['experience_points'] ?? 0,
      coins: json['coins'] ?? 0,
      isPremium: json['is_premium'] ?? false,
      stats: json['stats'],
      achievements: json['achievements'] != null
          ? List<String>.from(json['achievements'])
          : null,
      clanId: json['clan_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'display_name': displayName,
      'email': email,
      'avatar_url': avatarUrl,
      'level': level,
      'experience_points': experiencePoints,
      'coins': coins,
      'is_premium': isPremium,
      'stats': stats,
      'achievements': achievements,
      'clan_id': clanId,
    };
  }

  User copyWith({
    int? id,
    String? username,
    String? displayName,
    String? email,
    String? avatarUrl,
    int? level,
    int? experiencePoints,
    int? coins,
    bool? isPremium,
    Map<String, dynamic>? stats,
    List<String>? achievements,
    String? clanId,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      displayName: displayName ?? this.displayName,
      email: email ?? this.email,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      level: level ?? this.level,
      experiencePoints: experiencePoints ?? this.experiencePoints,
      coins: coins ?? this.coins,
      isPremium: isPremium ?? this.isPremium,
      stats: stats ?? this.stats,
      achievements: achievements ?? this.achievements,
      clanId: clanId ?? this.clanId,
    );
  }
}