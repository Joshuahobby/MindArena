import 'package:flutter/material.dart';
import 'package:mind_arena/theme/app_theme.dart';

class GameModeCard extends StatelessWidget {
  final String name;
  final String description;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool isLocked;

  const GameModeCard({
    Key? key,
    required this.name,
    required this.description,
    required this.icon,
    required this.color,
    required this.onTap,
    this.isLocked = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 250,
      margin: const EdgeInsets.all(8),
      child: Card(
        elevation: 4,
        color: AppTheme.cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(
            color: isLocked ? Colors.grey.shade700 : color.withOpacity(0.5),
            width: 1,
          ),
        ),
        child: InkWell(
          onTap: isLocked ? null : onTap,
          borderRadius: BorderRadius.circular(12),
          splashColor: color.withOpacity(0.1),
          highlightColor: color.withOpacity(0.05),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Mode Icon
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isLocked ? Colors.grey.shade800 : color.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        icon,
                        color: isLocked ? Colors.grey : color,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    
                    // Mode Name
                    Expanded(
                      child: Text(
                        name,
                        style: TextStyle(
                          color: isLocked ? Colors.grey : Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    
                    // Lock Icon
                    if (isLocked)
                      const Icon(
                        Icons.lock,
                        color: Colors.grey,
                        size: 18,
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                
                // Description
                Text(
                  description,
                  style: TextStyle(
                    color: isLocked ? Colors.grey.shade600 : AppTheme.secondaryTextColor,
                    fontSize: 12,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 12),
                
                // Play Button
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isLocked ? Colors.grey.shade800 : color.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    isLocked ? 'LOGIN REQUIRED' : 'PLAY NOW',
                    style: TextStyle(
                      color: isLocked ? Colors.grey : Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}