import 'package:flutter/material.dart';
import 'package:mind_arena/config/theme.dart';

class LeaderboardItem extends StatelessWidget {
  final int rank;
  final String username;
  final String avatarUrl;
  final int score;
  final double winRate;
  final bool isCurrentUser;
  final VoidCallback? onTap;

  const LeaderboardItem({
    Key? key,
    required this.rank,
    required this.username,
    required this.avatarUrl,
    required this.score,
    this.winRate = 0.0,
    this.isCurrentUser = false,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      color: isCurrentUser ? AppTheme.primaryColor.withOpacity(0.1) : null,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: isCurrentUser
            ? BorderSide(color: AppTheme.primaryColor, width: 1)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          child: Row(
            children: [
              // Rank
              _buildRankWidget(rank),
              
              const SizedBox(width: 16),
              
              // Avatar
              CircleAvatar(
                radius: 20,
                backgroundColor: Colors.grey[200],
                backgroundImage: avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
                child: avatarUrl.isEmpty
                    ? const Icon(Icons.person, size: 24, color: Colors.grey)
                    : null,
              ),
              
              const SizedBox(width: 12),
              
              // Username and win rate
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      username,
                      style: TextStyle(
                        fontWeight: isCurrentUser ? FontWeight.bold : FontWeight.normal,
                        fontSize: 16,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      'Win Rate: ${winRate.toStringAsFixed(1)}%',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(width: 8),
              
              // Score
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    score.toString(),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  Text(
                    'points',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRankWidget(int rank) {
    Color backgroundColor;
    Color textColor = Colors.white;
    IconData? icon;
    
    // Set colors and icons based on rank
    switch (rank) {
      case 1:
        backgroundColor = Colors.amber;
        icon = Icons.emoji_events;
        break;
      case 2:
        backgroundColor = Colors.grey.shade400;
        icon = Icons.emoji_events;
        break;
      case 3:
        backgroundColor = Colors.brown.shade300;
        icon = Icons.emoji_events;
        break;
      default:
        backgroundColor = AppTheme.primaryColor;
        textColor = Colors.white;
        icon = null;
    }
    
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: backgroundColor,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: icon != null
            ? Icon(icon, color: textColor, size: 16)
            : Text(
                rank.toString(),
                style: TextStyle(
                  color: textColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
      ),
    );
  }
}
