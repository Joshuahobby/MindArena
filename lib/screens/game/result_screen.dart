import 'package:flutter/material.dart';
import 'package:mind_arena/config/theme.dart';
import 'package:mind_arena/screens/home_screen.dart';
import 'package:mind_arena/services/ad_service.dart';
import 'package:mind_arena/services/analytics_service.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/services/database_service.dart';
import 'package:mind_arena/utils/share_utils.dart';
import 'package:mind_arena/widgets/custom_button.dart';
import 'package:provider/provider.dart';
import 'package:lottie/lottie.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class ResultScreen extends StatefulWidget {
  static const String routeName = '/result';
  
  final String matchId;
  final bool isWinner;
  final int score;
  final int rank;
  final int coinEarned;
  
  const ResultScreen({
    Key? key,
    required this.matchId,
    required this.isWinner,
    required this.score,
    required this.rank,
    required this.coinEarned,
  }) : super(key: key);

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  bool _isDoubleRewardAvailable = true;
  bool _isRewardInProgress = false;
  bool _isShowingAd = false;
  int _totalCoins = 0;
  
  @override
  void initState() {
    super.initState();
    _loadUserData();
    _showInterstitialAfterDelay();
    
    // Log screen view
    Provider.of<AnalyticsService>(context, listen: false)
        .logScreenView(screenName: 'result_screen');
  }

  Future<void> _loadUserData() async {
    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final userId = authService.currentUser?.uid;
      
      if (userId != null) {
        final user = await authService.getUserData(userId);
        if (user != null && mounted) {
          setState(() {
            _totalCoins = user.coins;
          });
        }
      }
    } catch (e) {
      print('Error loading user data: $e');
    }
  }

  Future<void> _showInterstitialAfterDelay() async {
    // Wait a bit to let user see the results first
    await Future.delayed(const Duration(seconds: 2));
    
    if (!mounted) return;
    
    final adService = Provider.of<AdService>(context, listen: false);
    final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
    
    if (adService.isInterstitialReady) {
      setState(() {
        _isShowingAd = true;
      });
      
      bool shown = await adService.showInterstitial();
      
      if (shown) {
        analyticsService.logAdImpression(
          adType: 'interstitial',
          placement: 'result_screen',
        );
      }
      
      if (mounted) {
        setState(() {
          _isShowingAd = false;
        });
      }
    }
  }

  Future<void> _doubleReward() async {
    if (_isRewardInProgress || !_isDoubleRewardAvailable) return;
    
    setState(() {
      _isRewardInProgress = true;
    });
    
    final adService = Provider.of<AdService>(context, listen: false);
    final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
    final databaseService = Provider.of<DatabaseService>(context, listen: false);
    final authService = Provider.of<AuthService>(context, listen: false);
    
    // Check if rewarded ad is ready
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
    
    // Show rewarded ad
    bool success = await adService.showRewardedAd((reward) async {
      // Ad was watched successfully, give the reward
      final userId = authService.currentUser?.uid;
      
      if (userId != null) {
        // Double the coins earned
        final doubledCoins = widget.coinEarned * 2;
        
        try {
          // Update user coins
          await databaseService.updateUserCoins(userId, doubledCoins);
          
          // Log coin transaction
          analyticsService.logCoinTransaction(
            transactionType: 'earn',
            amount: doubledCoins,
            reason: 'double_win_reward',
          );
          
          // Log rewarded ad completion
          analyticsService.logRewardedAdCompleted(
            placement: 'double_win_reward',
            rewardType: 'coins',
            rewardAmount: doubledCoins,
          );
          
          // Update UI
          if (mounted) {
            setState(() {
              _isDoubleRewardAvailable = false;
              _totalCoins += doubledCoins;
            });
            
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('You earned $doubledCoins coins!'),
                backgroundColor: AppTheme.success,
              ),
            );
          }
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Error: $e'),
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

  void _shareResults() {
    final analyticsService = Provider.of<AnalyticsService>(context, listen: false);
    
    // Share results
    ShareUtils.shareMatchResults(
      isWinner: widget.isWinner,
      score: widget.score,
      rank: widget.rank,
    );
    
    // Log share event
    analyticsService.logShareAction(
      contentType: 'match_result',
      shareMethod: 'social',
    );
  }

  void _goHome() {
    Navigator.of(context).pushNamedAndRemoveUntil(
      HomeScreen.routeName, 
      (route) => false,
    );
  }

  String _getRankText(int rank) {
    switch (rank) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      default:
        return '${rank}th';
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        _goHome();
        return false;
      },
      child: Scaffold(
        body: SafeArea(
          child: _isShowingAd
              ? const Center(child: CircularProgressIndicator())
              : Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Result header
                        Text(
                          widget.isWinner ? 'Victory!' : 'Match Complete',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: widget.isWinner
                                ? AppTheme.success
                                : AppTheme.primaryColor,
                          ),
                        ),
                        
                        const SizedBox(height: 24),
                        
                        // Animation
                        widget.isWinner
                            ? Lottie.network(
                                'https://assets1.lottiefiles.com/packages/lf20_touohxv0.json',
                                width: 200,
                                height: 200,
                                fit: BoxFit.contain,
                                repeat: true,
                              )
                            : Lottie.network(
                                'https://assets1.lottiefiles.com/packages/lf20_jdqghcwg.json',
                                width: 200,
                                height: 200,
                                fit: BoxFit.contain,
                                repeat: true,
                              ),
                        
                        const SizedBox(height: 32),
                        
                        // Results
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              // Rank
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Rank:',
                                    style: TextStyle(
                                      fontSize: 18,
                                    ),
                                  ),
                                  Text(
                                    _getRankText(widget.rank),
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: widget.rank == 1
                                          ? AppTheme.success
                                          : null,
                                    ),
                                  ),
                                ],
                              ),
                              
                              const Divider(),
                              
                              // Score
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Points:',
                                    style: TextStyle(
                                      fontSize: 18,
                                    ),
                                  ),
                                  Text(
                                    widget.score.toString(),
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              
                              if (widget.coinEarned > 0) ...[
                                const Divider(),
                                
                                // Coins earned
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'Coins Earned:',
                                      style: TextStyle(
                                        fontSize: 18,
                                      ),
                                    ),
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.monetization_on,
                                          color: AppTheme.coinColor,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          '+${widget.coinEarned}',
                                          style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.success,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                              
                              const Divider(),
                              
                              // Total coins
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Total Coins:',
                                    style: TextStyle(
                                      fontSize: 18,
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.account_balance_wallet,
                                        color: AppTheme.coinColor,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        _totalCoins.toString(),
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 32),
                        
                        // Double reward button (for winners only)
                        if (widget.isWinner && _isDoubleRewardAvailable)
                          CustomButton(
                            onPressed: _isRewardInProgress ? null : _doubleReward,
                            text: 'DOUBLE YOUR COINS',
                            color: AppTheme.coinColor,
                            icon: Icons.videocam,
                            isLoading: _isRewardInProgress,
                          ),
                        
                        const SizedBox(height: 16),
                        
                        // Share button
                        CustomButton(
                          onPressed: _shareResults,
                          text: 'SHARE RESULTS',
                          color: AppTheme.secondaryColor,
                          icon: Icons.share,
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // Continue button
                        CustomButton(
                          onPressed: _goHome,
                          text: 'CONTINUE',
                          color: AppTheme.primaryColor,
                        ),
                      ],
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}
