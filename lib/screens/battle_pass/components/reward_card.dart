import 'package:flutter/material.dart';
import 'package:mind_arena/theme/app_theme.dart';

class RewardCard extends StatelessWidget {
  final int tier;
  final String name;
  final String description;
  final String? imageUrl;
  final String type;
  final int? amount;
  final bool isPremium;
  final bool isUnlocked;
  final bool isClaimed;
  final bool isPremiumLocked;
  final VoidCallback? onClaim;

  const RewardCard({
    Key? key,
    required this.tier,
    required this.name,
    required this.description,
    this.imageUrl,
    required this.type,
    this.amount,
    this.isPremium = false,
    this.isUnlocked = false,
    this.isClaimed = false,
    this.isPremiumLocked = false,
    this.onClaim,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      color: isPremium ? Colors.amber.shade900.withOpacity(0.3) : AppTheme.cardColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isPremium ? Colors.amber.shade700 : Colors.transparent,
          width: isPremium ? 1 : 0,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tier and Premium indicator
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Tier badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: isUnlocked ? AppTheme.primaryColor : Colors.grey.shade700,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    'TIER $tier',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                if (isPremium)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: isPremiumLocked ? Colors.grey.shade700 : Colors.amber.shade700,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isPremiumLocked ? Icons.lock : Icons.star,
                          color: isPremiumLocked ? Colors.grey.shade300 : Colors.white,
                          size: 12,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'PREMIUM',
                          style: TextStyle(
                            color: isPremiumLocked ? Colors.grey.shade300 : Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Reward content
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Reward icon
                Container(
                  width: 60,
                  height: 60,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isUnlocked ? _getTypeColor() : Colors.grey.shade800,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: _getTypeIcon(),
                  ),
                ),
                const SizedBox(width: 12),
                
                // Reward details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isUnlocked ? Colors.white : Colors.grey.shade400,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        description,
                        style: TextStyle(
                          fontSize: 12,
                          color: isUnlocked ? AppTheme.secondaryTextColor : Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      if (amount != null && type == 'coins')
                        Row(
                          children: [
                            Icon(
                              Icons.monetization_on,
                              size: 16,
                              color: isUnlocked ? Colors.amber : Colors.grey.shade600,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '$amount',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isUnlocked ? Colors.amber : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      if (amount != null && type == 'experience')
                        Row(
                          children: [
                            Icon(
                              Icons.auto_awesome,
                              size: 16,
                              color: isUnlocked ? Colors.blue : Colors.grey.shade600,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '$amount XP',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isUnlocked ? Colors.blue : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Claim button or status
            _buildStatusButton(),
          ],
        ),
      ),
    );
  }
  
  Widget _buildStatusButton() {
    if (isPremiumLocked) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: Colors.grey.shade800,
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(
              Icons.lock,
              size: 16,
              color: Colors.grey,
            ),
            SizedBox(width: 4),
            Text(
              'PREMIUM REQUIRED',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    } else if (!isUnlocked) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: Colors.grey.shade800,
          borderRadius: BorderRadius.circular(8),
        ),
        alignment: Alignment.center,
        child: const Text(
          'LOCKED',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
          ),
        ),
      );
    } else if (isClaimed) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: Colors.green.shade900.withOpacity(0.3),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.green.shade700),
        ),
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(
              Icons.check_circle,
              size: 16,
              color: Colors.green,
            ),
            SizedBox(width: 4),
            Text(
              'CLAIMED',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
          ],
        ),
      );
    } else {
      return ElevatedButton(
        onPressed: onClaim,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryColor,
          padding: const EdgeInsets.symmetric(vertical: 8),
          minimumSize: const Size(double.infinity, 0),
        ),
        child: Text(
          'CLAIM REWARD',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      );
    }
  }
  
  Color _getTypeColor() {
    switch (type) {
      case 'coins':
        return Colors.amber.shade700;
      case 'experience':
        return Colors.blue.shade700;
      case 'avatar':
        return Colors.purple.shade700;
      default:
        return AppTheme.primaryColor;
    }
  }
  
  Widget _getTypeIcon() {
    switch (type) {
      case 'coins':
        return const Icon(
          Icons.monetization_on,
          color: Colors.white,
          size: 32,
        );
      case 'experience':
        return const Icon(
          Icons.auto_awesome,
          color: Colors.white,
          size: 32,
        );
      case 'avatar':
        return const Icon(
          Icons.face,
          color: Colors.white,
          size: 32,
        );
      default:
        return const Icon(
          Icons.card_giftcard,
          color: Colors.white,
          size: 32,
        );
    }
  }
}