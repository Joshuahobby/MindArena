class User {
  final int? id;
  final String username;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final int coins;
  final int experiencePoints;
  final int level;
  final DateTime? createdAt;

  User({
    this.id,
    required this.username,
    required this.email,
    this.displayName,
    this.avatarUrl,
    this.coins = 0,
    this.experiencePoints = 0,
    this.level = 1,
    this.createdAt,
  });

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'],
      username: map['username'],
      email: map['email'],
      displayName: map['display_name'],
      avatarUrl: map['avatar_url'],
      coins: map['coins'] ?? 0,
      experiencePoints: map['experience_points'] ?? 0,
      level: map['level'] ?? 1,
      createdAt: map['created_at'] != null 
        ? map['created_at'] is DateTime 
          ? map['created_at'] 
          : DateTime.parse(map['created_at'])
        : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'display_name': displayName,
      'avatar_url': avatarUrl,
      'coins': coins,
      'experience_points': experiencePoints,
      'level': level,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}