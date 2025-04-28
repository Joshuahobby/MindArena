class Avatar {
  final String id;
  final String name;
  final String imageUrl;
  final String rarity; // 'common', 'rare', 'epic', 'legendary'
  final String? description;
  final String? category;
  final int? cost;
  final String? obtainMethod; // 'purchase', 'battle_pass', 'achievement', etc.
  final bool? isLimited;
  final DateTime? releasedAt;
  final Map<String, dynamic>? customization;

  Avatar({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.rarity,
    this.description,
    this.category,
    this.cost,
    this.obtainMethod,
    this.isLimited,
    this.releasedAt,
    this.customization,
  });

  factory Avatar.fromJson(Map<String, dynamic> json) {
    return Avatar(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      imageUrl: json['image_url'] ?? '',
      rarity: json['rarity'] ?? 'common',
      description: json['description'],
      category: json['category'],
      cost: json['cost'],
      obtainMethod: json['obtain_method'],
      isLimited: json['is_limited'],
      releasedAt: json['released_at'] != null
          ? DateTime.parse(json['released_at'])
          : null,
      customization: json['customization'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'image_url': imageUrl,
      'rarity': rarity,
      'description': description,
      'category': category,
      'cost': cost,
      'obtain_method': obtainMethod,
      'is_limited': isLimited,
      'released_at': releasedAt?.toIso8601String(),
      'customization': customization,
    };
  }

  // Get color based on rarity
  static Map<String, dynamic> getRarityData(String rarity) {
    switch (rarity.toLowerCase()) {
      case 'common':
        return {
          'color': 0xFF808080, // Gray
          'label': 'Common',
          'borderColor': 0xFFBBBBBB,
          'gradient': [0xFF808080, 0xFF646464],
        };
      case 'rare':
        return {
          'color': 0xFF0070DD, // Blue
          'label': 'Rare',
          'borderColor': 0xFF40A0FF,
          'gradient': [0xFF0070DD, 0xFF0050AA],
        };
      case 'epic':
        return {
          'color': 0xFFA335EE, // Purple
          'label': 'Epic',
          'borderColor': 0xFFC060FF,
          'gradient': [0xFFA335EE, 0xFF800080],
        };
      case 'legendary':
        return {
          'color': 0xFFFF8000, // Orange
          'label': 'Legendary',
          'borderColor': 0xFFFFAA00,
          'gradient': [0xFFFF8000, 0xFFCC5500],
        };
      default:
        return {
          'color': 0xFF808080, // Gray
          'label': 'Common',
          'borderColor': 0xFFBBBBBB,
          'gradient': [0xFF808080, 0xFF646464],
        };
    }
  }
}

class UserAvatar {
  final String userId;
  final String avatarId;
  final bool isEquipped;
  final DateTime acquiredAt;
  final String? source; // How the user got this avatar

  UserAvatar({
    required this.userId,
    required this.avatarId,
    required this.isEquipped,
    required this.acquiredAt,
    this.source,
  });

  factory UserAvatar.fromJson(Map<String, dynamic> json) {
    return UserAvatar(
      userId: json['user_id'] ?? '',
      avatarId: json['avatar_id'] ?? '',
      isEquipped: json['is_equipped'] ?? false,
      acquiredAt: json['acquired_at'] != null
          ? DateTime.parse(json['acquired_at'])
          : DateTime.now(),
      source: json['source'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'avatar_id': avatarId,
      'is_equipped': isEquipped,
      'acquired_at': acquiredAt.toIso8601String(),
      'source': source,
    };
  }
}

class AvatarCategory {
  final String id;
  final String name;
  final String? description;
  final String? iconName;
  final int? displayOrder;

  AvatarCategory({
    required this.id,
    required this.name,
    this.description,
    this.iconName,
    this.displayOrder,
  });

  factory AvatarCategory.fromJson(Map<String, dynamic> json) {
    return AvatarCategory(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      iconName: json['icon_name'],
      displayOrder: json['display_order'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'icon_name': iconName,
      'display_order': displayOrder,
    };
  }
}