import 'package:flutter/material.dart';
import 'package:mind_arena/theme/app_theme.dart';

class StatsCard extends StatelessWidget {
  final Map<String, dynamic> stats;

  const StatsCard({
    Key? key,
    required this.stats,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppTheme.cardColor,
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Overall Stats
            Row(
              children: [
                Expanded(
                  child: _buildStatColumn(
                    context,
                    'Matches Played',
                    stats['matches_played'] ?? 0,
                    Icons.videogame_asset,
                  ),
                ),
                Expanded(
                  child: _buildStatColumn(
                    context,
                    'Matches Won',
                    stats['matches_won'] ?? 0,
                    Icons.emoji_events,
                  ),
                ),
                Expanded(
                  child: _buildStatColumn(
                    context,
                    'Win Rate',
                    '${stats['win_rate'] ?? 0}%',
                    Icons.trending_up,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            
            // Performance Stats
            Row(
              children: [
                Expanded(
                  child: _buildStatRow(
                    'Average Score',
                    '${stats['average_score'] ?? 0}',
                    Icons.speed,
                    Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildStatRow(
                    'Accuracy',
                    '${stats['accuracy'] ?? 0}%',
                    Icons.gps_fixed,
                    Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            Row(
              children: [
                Expanded(
                  child: _buildStatRow(
                    'Total Questions',
                    '${stats['total_questions'] ?? 0}',
                    Icons.quiz,
                    Colors.purple,
                  ),
                ),
                Expanded(
                  child: _buildStatRow(
                    'Best Category',
                    stats['best_category'] ?? 'N/A',
                    Icons.category,
                    Colors.orange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            Row(
              children: [
                Expanded(
                  child: _buildStatRow(
                    'Tournaments Won',
                    '${stats['tournaments_won'] ?? 0}',
                    Icons.workspace_premium,
                    Colors.amber,
                  ),
                ),
                Expanded(
                  child: _buildStatRow(
                    'Highest Streak',
                    '${stats['highest_streak'] ?? 0}',
                    Icons.local_fire_department,
                    Colors.deepOrange,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildStatColumn(BuildContext context, String label, dynamic value, IconData icon) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.backgroundColor,
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            color: AppTheme.primaryColor,
            size: 24,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '$value',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: AppTheme.secondaryTextColor,
            fontSize: 12,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
  
  Widget _buildStatRow(String label, String value, IconData icon, Color iconColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(
            icon,
            size: 18,
            color: iconColor,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: AppTheme.secondaryTextColor,
                fontSize: 12,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}