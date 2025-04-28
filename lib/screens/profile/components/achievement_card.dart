import 'package:flutter/material.dart';
import 'package:mind_arena/theme/app_theme.dart';

class AchievementCard extends StatelessWidget {
  final String name;
  final String description;
  final IconData icon;
  final Color color;
  final bool unlocked;
  final int progress;
  final int total;

  const AchievementCard({
    Key? key,
    required this.name,
    required this.description,
    required this.icon,
    required this.color,
    this.unlocked = false,
    required this.progress,
    required this.total,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppTheme.cardColor,
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: unlocked ? color.withOpacity(0.7) : Colors.transparent,
          width: unlocked ? 1 : 0,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Achievement Icon
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: unlocked ? color : Colors.grey.shade800,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    icon,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 8),
                
                // Lock/Unlock Status
                unlocked
                    ? const Icon(
                        Icons.check_circle,
                        color: Colors.green,
                        size: 16,
                      )
                    : const Icon(
                        Icons.lock,
                        color: Colors.grey,
                        size: 16,
                      ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Achievement Name
            Text(
              name,
              style: TextStyle(
                color: unlocked ? Colors.white : Colors.grey.shade400,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            
            // Achievement Description
            Text(
              description,
              style: TextStyle(
                color: unlocked ? AppTheme.secondaryTextColor : Colors.grey.shade600,
                fontSize: 12,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            
            // Progress
            if (total > 1)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress / total,
                      backgroundColor: Colors.grey.shade800,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        unlocked ? color : Colors.grey.shade600,
                      ),
                      minHeight: 4,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$progress/$total',
                    style: TextStyle(
                      color: unlocked ? color : Colors.grey.shade600,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}