import 'package:cloud_firestore/cloud_firestore.dart';

class Clan {
  final String? id;
  final String name;
  final String description;
  final String leaderId;
  final int membersCount;
  final int totalScore;
  final String? bannerUrl;
  final String? avatarUrl;
  final DateTime? createdAt;
  final List<ClanMember>? members;
  
  Clan({
    this.id,
    required this.name,
    required this.description,
    required this.leaderId,
    this.membersCount = 1,
    this.totalScore = 0,
    this.bannerUrl,
    this.avatarUrl,
    this.createdAt,
    this.members,
  });
  
  factory Clan.fromMap(Map<String, dynamic> map) {
    List<ClanMember> membersList = [];
    
    if (map['members'] != null) {
      membersList = (map['members'] as List).map((item) {
        return ClanMember.fromMap(item);
      }).toList();
    }
    
    return Clan(
      id: map['id'],
      name: map['name'],
      description: map['description'],
      leaderId: map['leader_id'],
      membersCount: map['members_count'] ?? 1,
      totalScore: map['total_score'] ?? 0,
      bannerUrl: map['banner_url'],
      avatarUrl: map['avatar_url'],
      createdAt: map['created_at'] is Timestamp
        ? (map['created_at'] as Timestamp).toDate()
        : map['created_at'] != null
          ? DateTime.parse(map['created_at'])
          : null,
      members: membersList,
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'leader_id': leaderId,
      'members_count': membersCount,
      'total_score': totalScore,
      'banner_url': bannerUrl,
      'avatar_url': avatarUrl,
      'created_at': createdAt,
      'members': members?.map((member) => member.toMap()).toList(),
    };
  }
  
  bool isLeader(String userId) {
    return leaderId == userId;
  }
  
  bool isOfficer(String userId) {
    if (members == null) return false;
    
    final member = members!.firstWhere(
      (member) => member.userId == userId,
      orElse: () => ClanMember(userId: '', clanId: '', role: ''),
    );
    
    return member.role == 'officer';
  }
  
  bool isMember(String userId) {
    if (members == null) return false;
    
    return members!.any((member) => member.userId == userId);
  }
  
  bool canManage(String userId) {
    return isLeader(userId) || isOfficer(userId);
  }
}

class ClanMember {
  final String? id;
  final String userId;
  final String clanId;
  final String role; // 'leader', 'officer', 'member'
  final DateTime? joinedAt;
  final String? username;
  final String? displayName;
  final String? avatarUrl;
  
  ClanMember({
    this.id,
    required this.userId,
    required this.clanId,
    required this.role,
    this.joinedAt,
    this.username,
    this.displayName,
    this.avatarUrl,
  });
  
  factory ClanMember.fromMap(Map<String, dynamic> map) {
    return ClanMember(
      id: map['id'],
      userId: map['user_id'],
      clanId: map['clan_id'],
      role: map['role'] ?? 'member',
      joinedAt: map['joined_at'] is Timestamp
        ? (map['joined_at'] as Timestamp).toDate()
        : map['joined_at'] != null
          ? DateTime.parse(map['joined_at'])
          : null,
      username: map['username'],
      displayName: map['display_name'],
      avatarUrl: map['avatar_url'],
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'user_id': userId,
      'clan_id': clanId,
      'role': role,
      'joined_at': joinedAt,
      'username': username,
      'display_name': displayName,
      'avatar_url': avatarUrl,
    };
  }
  
  bool get isLeader => role == 'leader';
  bool get isOfficer => role == 'officer';
}