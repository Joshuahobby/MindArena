enum UserRole {
  player,
  admin,
}

class User {
  final String id;
  final String username;
  final String email;
  final String? phoneNumber;
  final String? avatarUrl;
  final int tokens;
  final int level;
  final int xp;
  final bool isOnline;
  final DateTime joinDate;
  final bool hasPremiumBattlePass;
  final DateTime? battlePassPurchaseDate;
  final Map<String, dynamic>? stats;
  final Map<String, dynamic>? preferences;
  final List<String>? friends;
  final UserRole role;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.phoneNumber,
    this.avatarUrl,
    required this.tokens,
    required this.level,
    required this.xp,
    required this.isOnline,
    required this.joinDate,
    this.hasPremiumBattlePass = false,
    this.battlePassPurchaseDate,
    this.stats,
    this.preferences,
    this.friends,
    this.role = UserRole.player,
  });

  // Create a copy with updated fields
  User copyWith({
    String? id,
    String? username,
    String? email,
    String? phoneNumber,
    String? avatarUrl,
    int? tokens,
    int? level,
    int? xp,
    bool? isOnline,
    DateTime? joinDate,
    bool? hasPremiumBattlePass,
    DateTime? battlePassPurchaseDate,
    Map<String, dynamic>? stats,
    Map<String, dynamic>? preferences,
    List<String>? friends,
    UserRole? role,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      tokens: tokens ?? this.tokens,
      level: level ?? this.level,
      xp: xp ?? this.xp,
      isOnline: isOnline ?? this.isOnline,
      joinDate: joinDate ?? this.joinDate,
      hasPremiumBattlePass: hasPremiumBattlePass ?? this.hasPremiumBattlePass,
      battlePassPurchaseDate: battlePassPurchaseDate ?? this.battlePassPurchaseDate,
      stats: stats ?? this.stats,
      preferences: preferences ?? this.preferences,
      friends: friends ?? this.friends,
      role: role ?? this.role,
    );
  }

  // Create from JSON
  factory User.fromJson(Map<String, dynamic> json) {
    // Parse the role from JSON
    UserRole role = UserRole.player;
    if (json['role'] != null) {
      if (json['role'] == 'admin') {
        role = UserRole.admin;
      }
    }

    return User(
      id: json['id'] ?? '',
      username: json['username'] ?? 'Player',
      email: json['email'] ?? '',
      phoneNumber: json['phoneNumber'],
      avatarUrl: json['avatarUrl'],
      tokens: json['tokens'] ?? 0,
      level: json['level'] ?? 1,
      xp: json['xp'] ?? 0,
      isOnline: json['isOnline'] ?? false,
      joinDate: json['joinDate'] != null
          ? DateTime.parse(json['joinDate'])
          : DateTime.now(),
      hasPremiumBattlePass: json['hasPremiumBattlePass'] ?? false,
      battlePassPurchaseDate: json['battlePassPurchaseDate'] != null
          ? DateTime.parse(json['battlePassPurchaseDate'])
          : null,
      stats: json['stats'],
      preferences: json['preferences'],
      friends: json['friends'] != null
          ? List<String>.from(json['friends'])
          : null,
      role: role,
    );
  }

  // Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'phoneNumber': phoneNumber,
      'avatarUrl': avatarUrl,
      'tokens': tokens,
      'level': level,
      'xp': xp,
      'isOnline': isOnline,
      'joinDate': joinDate.toIso8601String(),
      'hasPremiumBattlePass': hasPremiumBattlePass,
      'battlePassPurchaseDate': battlePassPurchaseDate?.toIso8601String(),
      'stats': stats,
      'preferences': preferences,
      'friends': friends,
      'role': role.toString().split('.').last, // Convert enum to string
    };
  }
}