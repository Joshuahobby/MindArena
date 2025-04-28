import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

class ShareUtils {
  // Share match results
  static void shareMatchResults({
    required bool isWinner,
    required int score,
    required int rank,
  }) {
    final String resultText = isWinner
        ? 'I just WON a match in MindArena with $score points! Can you beat my score?'
        : 'I just scored $score points in MindArena and ranked #$rank! Think you can do better?';
    
    final String appLink = 'https://mindarena.example.com/download';
    
    final String fullText = '$resultText\n\nDownload MindArena and challenge me: $appLink';
    
    Share.share(fullText, subject: 'MindArena Match Results');
  }

  // Share profile stats
  static void shareProfile({
    required String username,
    required Map<String, int> stats,
  }) {
    final int matches = stats['matches'] ?? 0;
    final int wins = stats['wins'] ?? 0;
    final int points = stats['points'] ?? 0;
    
    final double winRate = matches > 0 ? (wins / matches) * 100 : 0;
    
    final String profileText = 'Check out my MindArena stats!\n\n'
                               'Username: $username\n'
                               'Total Matches: $matches\n'
                               'Wins: $wins\n'
                               'Win Rate: ${winRate.toStringAsFixed(1)}%\n'
                               'Total Points: $points\n\n';
    
    final String appLink = 'https://mindarena.example.com/download';
    
    final String fullText = '$profileText\nDownload MindArena and challenge me: $appLink';
    
    Share.share(fullText, subject: 'MindArena Profile');
  }

  // Share invite link
  static void shareInvite({String? referralCode}) {
    final String inviteText = 'Join me on MindArena, the fast-paced quiz game where you can test your knowledge and compete with friends!';
    
    String appLink = 'https://mindarena.example.com/download';
    
    // Add referral code if available
    if (referralCode != null && referralCode.isNotEmpty) {
      appLink += '?ref=$referralCode';
    }
    
    final String fullText = '$inviteText\n\nDownload the app now: $appLink';
    
    Share.share(fullText, subject: 'Join me on MindArena!');
  }

  // Show share dialog with custom items
  static void showCustomShareDialog(
    BuildContext context, {
    required String title,
    required String text,
    required List<ShareItem> items,
  }) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (BuildContext context) {
        return Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                text,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              GridView.builder(
                shrinkWrap: true,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  return InkWell(
                    onTap: () {
                      Navigator.pop(context);
                      items[index].onTap();
                    },
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          items[index].icon,
                          size: 32,
                          color: items[index].color,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          items[index].label,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class ShareItem {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  ShareItem({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });
}
