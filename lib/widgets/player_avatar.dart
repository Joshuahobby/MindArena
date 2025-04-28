import 'package:flutter/material.dart';
import 'package:mind_arena/config/theme.dart';

class PlayerAvatar extends StatelessWidget {
  final String username;
  final String avatarUrl;
  final int score;
  final bool isCurrentUser;
  final bool hasAnswered;
  final bool isActive;

  const PlayerAvatar({
    Key? key,
    required this.username,
    required this.avatarUrl,
    required this.score,
    this.isCurrentUser = false,
    this.hasAnswered = false,
    this.isActive = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: _getContainerColor(),
        borderRadius: BorderRadius.circular(20),
        border: isCurrentUser
            ? Border.all(color: AppTheme.primaryColor, width: 2)
            : null,
      ),
      child: Row(
        children: [
          // Status indicator
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _getStatusColor(),
            ),
          ),
          
          const SizedBox(width: 4),
          
          // Avatar
          CircleAvatar(
            radius: 16,
            backgroundColor: Colors.grey[200],
            backgroundImage: avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
            child: avatarUrl.isEmpty
                ? const Icon(Icons.person, size: 16, color: Colors.grey)
                : null,
          ),
          
          const SizedBox(width: 6),
          
          // Username and score
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Username
              Text(
                username.length > 10 ? username.substring(0, 10) + '...' : username,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isCurrentUser ? FontWeight.bold : FontWeight.normal,
                  color: !isActive ? Colors.grey : null,
                ),
              ),
              
              // Score
              Text(
                score.toString(),
                style: TextStyle(
                  fontSize: 10,
                  color: !isActive ? Colors.grey : AppTheme.primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Color _getContainerColor() {
    if (!isActive) {
      return Colors.grey[200]!;
    }
    
    if (isCurrentUser) {
      return AppTheme.primaryColorLight.withOpacity(0.2);
    }
    
    return Colors.white;
  }
  
  Color _getStatusColor() {
    if (!isActive) {
      return Colors.grey;
    }
    
    if (hasAnswered) {
      return AppTheme.success;
    }
    
    return Colors.orange;
  }
}
