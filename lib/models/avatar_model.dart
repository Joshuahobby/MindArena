import 'package:cloud_firestore/cloud_firestore.dart';

class Avatar {
  final String? id;
  final String name;
  final String imageUrl;
  final int cost;
  final String rarity; // 'common', 'rare', 'epic', 'legendary'
  final bool isDefault;
  final bool isPurchasable;
  final String? categoryId;
  final String? categoryName;
  final DateTime? createdAt;
  final bool? unlocked; // Client-side only, not stored in Firestore
  
  Avatar({
    this.id,
    required this.name,
    required this.imageUrl,
    required this.cost,
    required this.rarity,
    this.isDefault = false,
    this.isPurchasable = true,
    this.categoryId,
    this.categoryName,
    this.createdAt,
    this.unlocked,
  });
  
  factory Avatar.fromMap(Map<String, dynamic> map) {
    return Avatar(
      id: map['id'],
      name: map['name'],
      imageUrl: map['image_url'],
      cost: map['cost'] ?? 0,
      rarity: map['rarity'] ?? 'common',
      isDefault: map['is_default'] ?? false,
      isPurchasable: map['is_purchasable'] ?? true,
      categoryId: map['category_id'],
      categoryName: map['category_name'],
      createdAt: map['created_at'] is Timestamp
        ? (map['created_at'] as Timestamp).toDate()
        : map['created_at'] != null
          ? DateTime.parse(map['created_at'])
          : null,
      unlocked: map['unlocked'],
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'image_url': imageUrl,
      'cost': cost,
      'rarity': rarity,
      'is_default': isDefault,
      'is_purchasable': isPurchasable,
      'category_id': categoryId,
      'category_name': categoryName,
      'created_at': createdAt,
      'unlocked': unlocked,
    };
  }
  
  // Get color based on rarity
  int get rarityColor {
    switch (rarity.toLowerCase()) {
      case 'common':
        return 0xFF8E8E8E; // Gray
      case 'rare':
        return 0xFF2196F3; // Blue
      case 'epic':
        return 0xFF9C27B0; // Purple
      case 'legendary':
        return 0xFFFF9800; // Orange
      default:
        return 0xFF8E8E8E; // Gray
    }
  }
}

class AvatarCategory {
  final String? id;
  final String name;
  final String? description;
  final String? iconUrl;
  final int displayOrder;
  
  AvatarCategory({
    this.id,
    required this.name,
    this.description,
    this.iconUrl,
    this.displayOrder = 0,
  });
  
  factory AvatarCategory.fromMap(Map<String, dynamic> map) {
    return AvatarCategory(
      id: map['id'],
      name: map['name'],
      description: map['description'],
      iconUrl: map['icon_url'],
      displayOrder: map['display_order'] ?? 0,
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'icon_url': iconUrl,
      'display_order': displayOrder,
    };
  }
}

class UserAvatar {
  final String userId;
  final String avatarId;
  final DateTime purchasedAt;
  final bool isActive;
  
  UserAvatar({
    required this.userId,
    required this.avatarId,
    required this.purchasedAt,
    this.isActive = false,
  });
  
  factory UserAvatar.fromMap(Map<String, dynamic> map) {
    return UserAvatar(
      userId: map['user_id'],
      avatarId: map['avatar_id'],
      purchasedAt: map['purchased_at'] is Timestamp
        ? (map['purchased_at'] as Timestamp).toDate()
        : DateTime.parse(map['purchased_at']),
      isActive: map['is_active'] ?? false,
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'user_id': userId,
      'avatar_id': avatarId,
      'purchased_at': purchasedAt,
      'is_active': isActive,
    };
  }
}