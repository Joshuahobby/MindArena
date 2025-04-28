import 'package:flutter/material.dart';
import 'package:mind_arena/config/theme.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/services/ad_service.dart';
import 'package:mind_arena/services/analytics_service.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/services/database_service.dart';
import 'package:provider/provider.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class ShopScreen extends StatefulWidget {
  static const String routeName = '/shop';

  const ShopScreen({Key? key}) : super(key: key);

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  UserModel? _user;
  bool _isLoading = true;
  String? _errorMessage;
  bool _isRewardInProgress = false;
  
  // Hardcoded shop items for MVP
  final List<ShopItem> _avatarItems = [
    ShopItem(
      id: 'avatar_1',
      name: 'Wizard',
      description: 'A mystical avatar with arcane powers',
      price: 100,
      imageUrl: 'https://via.placeholder.com/100',
      type: 'avatar',
    ),
    ShopItem(
      id: 'avatar_2',
      name: 'Ninja',
      description: 'Silent and deadly avatar',
      price: 150,
      imageUrl: 'https://via.placeholder.com/100',
      type: 'avatar',
    ),
    ShopItem(
      id: 'avatar_3',
      name: 'Astronaut',
      description: 'Space explorer avatar',
      price: 200,
      imageUrl: 'https://via.placeholder.com/100',
      type: 'avatar',
    ),
    ShopItem(
      id: 'avatar_4',
      name: 'Robot',
      description: 'Mechanical avatar with digital enhancements',
      price: 250,
      imageUrl: 'https://via.placeholder.com/100',
      type: 'avatar',
    ),
  ];
  
  final List<ShopItem> _powerupItems = [
    ShopItem(
      id: 'powerup_1',
      name: 'Extra Time',
      description: 'Get 5 more seconds for each question',
      price: 50,
      imageUrl: 'https://via.placeholder.com/100',
      type: 'powerup',
      count: 1,
    ),
    ShopItem(
      id: 'powerup_2',
      name: '50/50',
      description: 'Eliminates two wrong answers',
      price: 75,
      imageUrl: 'https://via.placeholder.com/100',
      type: 'powerup',
      count: 1,
    ),
    ShopItem(
      id: 'powerup_3',
      name: 'Skip Question',
      description: 'Skip a difficult question without penalty',
      price: 100,
      imageUrl: 'https://via.placeholder.com/100',
      type: 'powerup',
      count: 1,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadUserData();
    
    // Log screen view
    Provider.of<AnalyticsService>(context, listen: false)
        .logScreenView(screenName: 'shop_screen');
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final userId = authService.currentUser?.uid;
      
      if (userId != null) {
        final user = await authService.getUserData(userId);
        
        if (mounted) {
          setState(() {
            _user = user;
            _isLoading = false;
          });
        }
      } else {
        throw Exception('User not authenticated');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load user data: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _purchaseItem(ShopItem item) async {
    if (_user == null) return;
    
    // Check if user has enough coins
    if (_user!.coins < item.price) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Not enough coins!'),
          backgroundColor: AppTheme.error,
        ),
      );
      return;
    }
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      final databaseService = Provider.of<DatabaseService>(context, listen: false);
      final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
      final userId = _user!.id;
      
      // Deduct coins
      await databaseService.updateUserCoins(userId, -item.price);
      
      // TODO: Add item to user's inventory in a real app
      
      // Log transaction
      analyticsService.logCoinTransaction(
        transactionType: 'spend',
        amount: item.price,
        reason: 'shop_purchase_${item.type}',
      );
      
      // Reload user data
      await _loadUserData();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully purchased ${item.name}!'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to purchase item: $e';
          _isLoading = false;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to purchase item: $e'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  Future<void> _watchAdForCoins() async {
    if (_isRewardInProgress) return;
    
    setState(() {
      _isRewardInProgress = true;
    });
    
    final adService = Provider.of<AdService>(context, listen: false);
    final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
    final databaseService = Provider.of<DatabaseService>(context, listen: false);
    
    if (!adService.isRewardedReady) {
      setState(() {
        _isRewardInProgress = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Reward video not available. Please try again later.'),
          backgroundColor: AppTheme.warning,
        ),
      );
      return;
    }
    
    bool success = await adService.showRewardedAd((reward) async {
      // User watched the ad, reward them with coins
      if (_user != null) {
        const int coinsToReward = 25;
        
        try {
          // Update user coins
          await databaseService.updateUserCoins(_user!.id, coinsToReward);
          
          // Log transaction
          analyticsService.logCoinTransaction(
            transactionType: 'earn',
            amount: coinsToReward,
            reason: 'rewarded_ad',
          );
          
          // Log ad completion
          analyticsService.logRewardedAdCompleted(
            placement: 'shop_free_coins',
            rewardType: 'coins',
            rewardAmount: coinsToReward,
          );
          
          // Reload user data
          await _loadUserData();
          
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('You earned 25 coins!'),
                backgroundColor: AppTheme.success,
              ),
            );
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to reward coins: $e'),
                backgroundColor: AppTheme.error,
              ),
            );
          }
        }
      }
    });
    
    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to show reward video. Please try again later.'),
          backgroundColor: AppTheme.warning,
        ),
      );
    }
    
    if (mounted) {
      setState(() {
        _isRewardInProgress = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // User's coin balance
        _buildCoinBalance(),
        
        // Tab bar
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TabBar(
            controller: _tabController,
            labelColor: AppTheme.primaryColor,
            unselectedLabelColor: Colors.grey,
            indicatorColor: AppTheme.primaryColor,
            tabs: const [
              Tab(text: 'Avatars'),
              Tab(text: 'Power-Ups'),
              Tab(text: 'Free Coins'),
            ],
          ),
        ),
        
        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildItemsGrid(_avatarItems),
              _buildItemsGrid(_powerupItems),
              _buildFreeCoinsTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCoinBalance() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.account_balance_wallet,
            color: Colors.white,
          ),
          const SizedBox(width: 8),
          const Text(
            'Your Balance:',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 4,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.monetization_on,
                  color: AppTheme.coinColor,
                  size: 16,
                ),
                const SizedBox(width: 4),
                Text(
                  _isLoading ? '...' : '${_user?.coins ?? 0}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemsGrid(List<ShopItem> items) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }
    
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              color: AppTheme.error,
              size: 64,
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadUserData,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }
    
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.75,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        return _buildShopItem(items[index]);
      },
    );
  }

  Widget _buildShopItem(ShopItem item) {
    final bool canAfford = _user != null && _user!.coins >= item.price;
    
    return Card(
      elevation: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Item image
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(4),
                ),
              ),
              child: Center(
                child: Icon(
                  item.type == 'avatar'
                      ? Icons.person
                      : Icons.flash_on,
                  size: 64,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
          ),
          
          // Item details
          Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Name
                Text(
                  item.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                
                // Description
                Text(
                  item.description,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                
                const SizedBox(height: 8),
                
                // Price and buy button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Price
                    Row(
                      children: [
                        const Icon(
                          Icons.monetization_on,
                          color: AppTheme.coinColor,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${item.price}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    
                    // Buy button
                    ElevatedButton(
                      onPressed: canAfford
                          ? () => _purchaseItem(item)
                          : null,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        backgroundColor: canAfford
                            ? AppTheme.primaryColor
                            : Colors.grey,
                      ),
                      child: const Text('BUY'),
                    ),
                  ],
                ),
                
                // Item count if applicable
                if (item.count != null)
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      'Qty: ${item.count}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFreeCoinsTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Heading
          const Text(
            'Free Coins',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 24),
          
          // Watch ad card
          Card(
            elevation: 4,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Icon
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.videocam,
                      size: 40,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Title
                  const Text(
                    'Watch Video',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Description
                  const Text(
                    'Watch a short video to earn 25 free coins!',
                    textAlign: TextAlign.center,
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Reward display
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(
                          Icons.monetization_on,
                          color: AppTheme.coinColor,
                        ),
                        SizedBox(width: 8),
                        Text(
                          '+25 Coins',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Watch button
                  ElevatedButton.icon(
                    onPressed: _isRewardInProgress ? null : _watchAdForCoins,
                    icon: const Icon(Icons.play_arrow),
                    label: Text(_isRewardInProgress ? 'Loading...' : 'WATCH NOW'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 32),
          
          // More ways to earn (future expansion)
          const Text(
            'More ways to earn coming soon!',
            style: TextStyle(
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class ShopItem {
  final String id;
  final String name;
  final String description;
  final int price;
  final String imageUrl;
  final String type;
  final int? count;

  ShopItem({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.imageUrl,
    required this.type,
    this.count,
  });
}
