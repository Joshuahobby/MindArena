import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/models/battle_pass_model.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/screens/battle_pass/components/reward_card.dart';
import 'package:mind_arena/screens/battle_pass/components/premium_upsell.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';

class BattlePassTab extends StatefulWidget {
  final User? user;

  const BattlePassTab({Key? key, this.user}) : super(key: key);

  @override
  _BattlePassTabState createState() => _BattlePassTabState();
}

class _BattlePassTabState extends State<BattlePassTab> {
  bool _isLoading = true;
  BattlePass? _battlePass;
  UserBattlePass? _userBattlePass;
  List<BattlePassReward> _rewards = [];
  bool _showAllRewards = false;
  
  // Mock data for development and demo
  final BattlePass _mockBattlePass = BattlePass(
    id: 'season-1',
    name: 'Season 1: Mind Masters',
    description: 'The inaugural season of MindArena! Compete against other players and earn exclusive rewards.',
    startDate: DateTime.now().subtract(const Duration(days: 15)),
    endDate: DateTime.now().add(const Duration(days: 75)),
    maxTier: 100,
    premiumCost: 950,
    theme: 'cosmic',
    rewards: [],
  );
  
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
      // In a real app, fetch from Firebase
      await Future.delayed(const Duration(milliseconds: 1000));
      
      // Create mock battle pass
      _battlePass = _mockBattlePass;
      
      // Create mock rewards
      _rewards = _generateMockRewards();
      
      // Create mock user battle pass
      _userBattlePass = UserBattlePass(
        userId: widget.user?.id.toString() ?? '0',
        battlePassId: _battlePass!.id,
        currentTier: 15,
        experiencePoints: 8500,
        isPremium: widget.user?.isPremium ?? false,
        claimedTiers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        claimedPremiumTiers: widget.user?.isPremium ?? false ? [1, 2, 3, 4, 5] : [],
      );
      
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
  
  List<BattlePassReward> _generateMockRewards() {
    final List<BattlePassReward> rewards = [];
    
    // Generate rewards for each tier
    for (int tier = 1; tier <= _battlePass!.maxTier; tier++) {
      // Free reward for every tier
      String rewardType;
      int amount = 0;
      String name;
      
      if (tier % 5 == 0) {
        // Milestone reward (every 5 tiers)
        if (tier % 10 == 0) {
          // Major milestone (every 10 tiers)
          rewardType = 'coins';
          amount = 100 + (tier ~/ 10) * 50;
          name = '$amount Coins';
        } else {
          // Minor milestone
          rewardType = 'experience';
          amount = 500 + (tier ~/ 5) * 100;
          name = '$amount XP';
        }
      } else {
        // Regular tier
        if (tier % 3 == 0) {
          rewardType = 'coins';
          amount = 50 + (tier ~/ 3) * 10;
          name = '$amount Coins';
        } else {
          rewardType = 'experience';
          amount = 200 + tier * 10;
          name = '$amount XP';
        }
      }
      
      rewards.add(BattlePassReward(
        tier: tier,
        name: name,
        description: 'Tier $tier Free Reward',
        type: rewardType,
        amount: amount,
        isPremium: false,
      ));
      
      // Premium reward for every tier
      String premiumRewardType;
      int premiumAmount = 0;
      String premiumName;
      
      if (tier % 10 == 0) {
        // Major milestone premium reward
        premiumRewardType = 'avatar';
        premiumName = 'Exclusive Avatar';
      } else if (tier % 5 == 0) {
        // Minor milestone premium reward
        premiumRewardType = 'coins';
        premiumAmount = 200 + (tier ~/ 5) * 100;
        premiumName = '$premiumAmount Coins';
      } else {
        // Regular premium reward
        if (tier % 3 == 1) {
          premiumRewardType = 'coins';
          premiumAmount = 100 + (tier ~/ 3) * 20;
          premiumName = '$premiumAmount Coins';
        } else {
          premiumRewardType = 'experience';
          premiumAmount = 300 + tier * 15;
          premiumName = '$premiumAmount XP';
        }
      }
      
      rewards.add(BattlePassReward(
        tier: tier,
        name: premiumName,
        description: 'Tier $tier Premium Reward',
        type: premiumRewardType,
        amount: premiumAmount,
        isPremium: true,
      ));
    }
    
    return rewards;
  }
  
  void _togglePremium() {
    // In a real app, this would make a purchase
    if (widget.user == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    // Simulate payment processing delay
    Future.delayed(const Duration(milliseconds: 1500), () {
      setState(() {
        _userBattlePass = UserBattlePass(
          userId: _userBattlePass!.userId,
          battlePassId: _userBattlePass!.battlePassId,
          currentTier: _userBattlePass!.currentTier,
          experiencePoints: _userBattlePass!.experiencePoints,
          isPremium: true,
          claimedTiers: _userBattlePass!.claimedTiers,
          claimedPremiumTiers: _userBattlePass!.claimedPremiumTiers,
        );
        _isLoading = false;
      });
      
      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Premium Battle Pass purchased successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    });
  }
  
  void _claimReward(BattlePassReward reward) {
    if (widget.user == null) {
      _showLoginRequiredDialog();
      return;
    }
    
    final bool isPremiumReward = reward.isPremium;
    final int tier = reward.tier;
    
    // Check if user can claim the reward
    if (!_userBattlePass!.isTierUnlocked(tier)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You haven\'t unlocked this tier yet!'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    if (isPremiumReward && !_userBattlePass!.isPremium) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You need Premium Battle Pass to claim this reward!'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    // Check if reward is already claimed
    if (_userBattlePass!.isTierClaimed(tier, isPremiumReward)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You\'ve already claimed this reward!'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    setState(() {
      _isLoading = true;
    });
    
    // In a real app, this would be a Firebase call
    Future.delayed(const Duration(milliseconds: 800), () {
      setState(() {
        if (isPremiumReward) {
          _userBattlePass!.claimedPremiumTiers!.add(tier);
        } else {
          _userBattlePass!.claimedTiers!.add(tier);
        }
        _isLoading = false;
      });
      
      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${reward.name} claimed successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    });
  }
  
  void _showLoginRequiredDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Login Required'),
        content: const Text(
          'You need to be logged in to claim rewards. Please log in to continue.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate to login screen
            },
            child: const Text('LOG IN'),
          ),
        ],
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        decoration: BoxDecoration(
          gradient: AppTheme.backgroundGradient,
        ),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
    
    if (_battlePass == null || _userBattlePass == null) {
      return Container(
        decoration: BoxDecoration(
          gradient: AppTheme.backgroundGradient,
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red,
              ),
              const SizedBox(height: 16),
              const Text(
                'Failed to load Battle Pass',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: _loadBattlePass,
                child: const Text('Try Again'),
              ),
            ],
          ),
        ),
      );
    }
    
    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.backgroundGradient,
      ),
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Battle Pass Header
            SliverAppBar(
              expandedHeight: 200.0,
              pinned: true,
              backgroundColor: AppTheme.backgroundColor,
              flexibleSpace: FlexibleSpaceBar(
                title: Text(
                  _battlePass!.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                background: Container(
                  decoration: BoxDecoration(
                    gradient: AppTheme.primaryGradient,
                  ),
                  child: Stack(
                    children: [
                      // Background Pattern
                      Positioned.fill(
                        child: Opacity(
                          opacity: 0.1,
                          child: GridView.builder(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 5,
                            ),
                            itemBuilder: (context, index) => const Icon(
                              Icons.star,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      
                      // Battle Pass Info
                      Positioned(
                        bottom: 60,
                        left: 16,
                        right: 16,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Time remaining
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.3),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                '${_battlePass!.remainingDays} days remaining',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            
                            // User tier and level
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryColor,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    'TIER ${_userBattlePass!.currentTier}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                
                                // Premium badge if premium
                                if (_userBattlePass!.isPremium)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.amber.shade800,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: const [
                                        Icon(
                                          Icons.star,
                                          color: Colors.white,
                                          size: 12,
                                        ),
                                        SizedBox(width: 4),
                                        Text(
                                          'PREMIUM',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 10,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            
            // Progress to next tier
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.all(16),
                color: AppTheme.backgroundColor,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Current Tier: ${_userBattlePass!.currentTier}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Next: Tier ${_userBattlePass!.currentTier + 1}',
                          style: TextStyle(
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    
                    // Progress bar
                    LinearPercentIndicator(
                      lineHeight: 16,
                      percent: _userBattlePass!.getProgressToNextTier(),
                      backgroundColor: Colors.grey.shade800,
                      progressColor: AppTheme.primaryColor,
                      barRadius: const Radius.circular(8),
                      center: Text(
                        '${(_userBattlePass!.getProgressToNextTier() * 100).toInt()}%',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    
                    // Experience points
                    const SizedBox(height: 4),
                    Center(
                      child: Text(
                        '${_userBattlePass!.experiencePoints} / ${_userBattlePass!.getNextTierRequirement(_userBattlePass!.currentTier + 1)} XP',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.secondaryTextColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Premium upsell if not premium
            if (!(_userBattlePass!.isPremium) && widget.user != null)
              SliverToBoxAdapter(
                child: PremiumUpsell(
                  battlePass: _battlePass!,
                  onUpgrade: _togglePremium,
                  userCoins: widget.user?.coins ?? 0,
                ),
              ),
            
            // Rewards section title
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(
                  children: [
                    const Text(
                      'BATTLE PASS REWARDS',
                      style: TextStyle(
                        color: AppTheme.secondaryTextColor,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _showAllRewards = !_showAllRewards;
                        });
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.primaryColor,
                      ),
                      child: Text(_showAllRewards ? 'Show Current' : 'Show All'),
                    ),
                  ],
                ),
              ),
            ),
            
            // Rewards
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final rewards = _rewards.where((r) => r.tier == index + 1).toList();
                    if (rewards.isEmpty) return null;
                    
                    // If not showing all rewards, only show rewards near the current tier
                    if (!_showAllRewards && (index + 1 < _userBattlePass!.currentTier - 2 || index + 1 > _userBattlePass!.currentTier + 5)) {
                      return null;
                    }
                    
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: Text(
                            'TIER ${index + 1}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                              color: AppTheme.secondaryTextColor,
                            ),
                          ),
                        ),
                        ...rewards.map((reward) {
                          final bool isUnlocked = _userBattlePass!.isTierUnlocked(reward.tier);
                          final bool isClaimed = isUnlocked && 
                              _userBattlePass!.isTierClaimed(reward.tier, reward.isPremium);
                          final bool isPremiumLocked = reward.isPremium && !_userBattlePass!.isPremium;
                          
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16.0),
                            child: RewardCard(
                              tier: reward.tier,
                              name: reward.name,
                              description: reward.description,
                              type: reward.type,
                              amount: reward.amount,
                              isPremium: reward.isPremium,
                              isUnlocked: isUnlocked,
                              isClaimed: isClaimed,
                              isPremiumLocked: isPremiumLocked,
                              onClaim: () => _claimReward(reward),
                            ),
                          );
                        }).toList(),
                      ],
                    );
                  },
                  childCount: _battlePass!.maxTier,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}