import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/models/battle_pass_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/services/firebase_service.dart';
import 'package:mind_arena/screens/battle_pass/components/reward_card.dart';
import 'package:mind_arena/screens/battle_pass/components/premium_upsell.dart';

class BattlePassTab extends StatefulWidget {
  final User? user;

  const BattlePassTab({Key? key, this.user}) : super(key: key);

  @override
  _BattlePassTabState createState() => _BattlePassTabState();
}

class _BattlePassTabState extends State<BattlePassTab> {
  bool _isLoading = true;
  BattlePass? _currentBattlePass;
  UserBattlePass? _userBattlePass;
  bool _hasPremium = false;
  int _currentTier = 3; // For demo purposes
  
  @override
  void initState() {
    super.initState();
    _loadBattlePass();
  }
  
  Future<void> _loadBattlePass() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      final firebaseService = FirebaseService();
      final battlePassData = await firebaseService.getCurrentBattlePass();
      
      if (battlePassData != null) {
        _currentBattlePass = BattlePass.fromMap(battlePassData);
        
        // For demo, we'll create mock user battle pass
        _userBattlePass = UserBattlePass(
          userId: widget.user?.id.toString() ?? '1',
          battlePassId: _currentBattlePass!.id ?? '1',
          isPremium: false,
          currentTier: _currentTier,
          experiencePoints: 1200,
          unlockedRewardTiers: List.generate(_currentTier + 1, (index) => index),
          claimedRewardTiers: [0, 1], // First two rewards claimed
        );
        
        _hasPremium = _userBattlePass!.isPremium;
      }
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading battle pass: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  Future<void> _claimReward(int tier) async {
    setState(() {
      // For demo purposes, just update the local state
      if (_userBattlePass != null) {
        final updatedClaimedTiers = List<int>.from(_userBattlePass!.claimedRewardTiers);
        if (!updatedClaimedTiers.contains(tier)) {
          updatedClaimedTiers.add(tier);
        }
        
        _userBattlePass = UserBattlePass(
          userId: _userBattlePass!.userId,
          battlePassId: _userBattlePass!.battlePassId,
          isPremium: _userBattlePass!.isPremium,
          currentTier: _userBattlePass!.currentTier,
          experiencePoints: _userBattlePass!.experiencePoints,
          unlockedRewardTiers: _userBattlePass!.unlockedRewardTiers,
          claimedRewardTiers: updatedClaimedTiers,
        );
      }
    });
  }
  
  Future<void> _upgradeToPremium() async {
    // Show purchase confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Upgrade to Premium'),
        content: Text('Upgrade to Premium Battle Pass for ${_currentBattlePass?.premiumCost ?? 1000} coins?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL'),
          ),
          ElevatedButton(
            onPressed: widget.user != null && (widget.user!.coins >= (_currentBattlePass?.premiumCost ?? 1000))
                ? () => Navigator.pop(context, true)
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
            ),
            child: const Text('UPGRADE'),
          ),
        ],
      ),
    ) ?? false;
    
    if (confirmed) {
      setState(() {
        // For demo purposes, just update the local state
        if (_userBattlePass != null) {
          _userBattlePass = UserBattlePass(
            userId: _userBattlePass!.userId,
            battlePassId: _userBattlePass!.battlePassId,
            isPremium: true,
            currentTier: _userBattlePass!.currentTier,
            experiencePoints: _userBattlePass!.experiencePoints,
            unlockedRewardTiers: _userBattlePass!.unlockedRewardTiers,
            claimedRewardTiers: _userBattlePass!.claimedRewardTiers,
          );
          _hasPremium = true;
        }
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.backgroundGradient,
      ),
      child: _isLoading
          ? const Center(
              child: CircularProgressIndicator(),
            )
          : _buildContent(),
    );
  }
  
  Widget _buildContent() {
    if (_currentBattlePass == null) {
      return _buildNoBattlePass();
    } else {
      return _buildBattlePassContent();
    }
  }
  
  Widget _buildNoBattlePass() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.calendar_today,
              size: 64,
              color: AppTheme.secondaryTextColor,
            ),
            const SizedBox(height: 24),
            Text(
              'No Active Battle Pass',
              style: Theme.of(context).textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            const Text(
              'There is no active Battle Pass at the moment. Check back soon for the next season!',
              style: TextStyle(color: AppTheme.secondaryTextColor),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildBattlePassContent() {
    return CustomScrollView(
      slivers: [
        // Battle Pass Header
        SliverToBoxAdapter(
          child: _buildBattlePassHeader(),
        ),
        
        // Premium Upsell (if not premium)
        if (!_hasPremium)
          SliverToBoxAdapter(
            child: PremiumUpsell(
              battlePass: _currentBattlePass!,
              onUpgrade: _upgradeToPremium,
              userCoins: widget.user?.coins ?? 0,
            ),
          ),
        
        // Progress Bar
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'TIER $_currentTier',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'TIER ${_currentTier + 1}',
                      style: const TextStyle(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: 0.7, // Demo progress
                    backgroundColor: Colors.grey.shade800,
                    valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    children: [
                      const TextSpan(
                        text: '700',
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const TextSpan(
                        text: ' / ',
                        style: TextStyle(color: AppTheme.secondaryTextColor),
                      ),
                      TextSpan(
                        text: '1000 XP',
                        style: TextStyle(color: Colors.grey.shade400),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        
        // Reward Tiers
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              if (_currentBattlePass!.rewards.isEmpty) {
                return null;
              }
              
              // Create pairs of rewards (free and premium side by side)
              if (index >= _currentBattlePass!.rewards.length) {
                return null;
              }
              
              final reward = _currentBattlePass!.rewards[index];
              final isUnlocked = _userBattlePass != null &&
                  _userBattlePass!.unlockedRewardTiers.contains(reward.tier);
              final isClaimed = _userBattlePass != null &&
                  _userBattlePass!.claimedRewardTiers.contains(reward.tier);
              final canClaim = isUnlocked && !isClaimed;
              
              // If premium reward but user doesn't have premium
              final isPremiumLocked = reward.isPremium && !_hasPremium;
              
              return Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: RewardCard(
                  tier: reward.tier,
                  name: reward.name,
                  description: reward.description,
                  imageUrl: reward.imageUrl,
                  type: reward.type,
                  amount: reward.amount,
                  isPremium: reward.isPremium,
                  isUnlocked: isUnlocked,
                  isClaimed: isClaimed,
                  isPremiumLocked: isPremiumLocked,
                  onClaim: canClaim ? () => _claimReward(reward.tier) : null,
                ),
              );
            },
          ),
        ),
        
        // Bottom padding
        const SliverToBoxAdapter(
          child: SizedBox(height: 40),
        ),
      ],
    );
  }
  
  Widget _buildBattlePassHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryColor,
            AppTheme.accentColor,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Battle Pass Icon
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.stars_rounded,
                  color: Colors.white,
                  size: 40,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _currentBattlePass?.name ?? 'Season 1',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _hasPremium
                          ? 'Premium Pass Activated'
                          : 'Free Pass Active',
                      style: TextStyle(
                        color: _hasPremium
                            ? Colors.amber
                            : Colors.white.withOpacity(0.8),
                        fontWeight: _hasPremium ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Days Remaining
              if (_currentBattlePass != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    '${_currentBattlePass!.daysRemaining} days left',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _currentBattlePass?.progressPercentage ?? 0.0,
              backgroundColor: Colors.black.withOpacity(0.3),
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }
}