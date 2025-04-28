import 'package:flutter/material.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/services/payment_service.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:mind_arena/widgets/animated_background.dart';
import 'package:mind_arena/widgets/custom_app_bar.dart';
import 'package:provider/provider.dart';

class BattlePassPurchaseScreen extends StatefulWidget {
  const BattlePassPurchaseScreen({Key? key}) : super(key: key);

  @override
  _BattlePassPurchaseScreenState createState() => _BattlePassPurchaseScreenState();
}

class _BattlePassPurchaseScreenState extends State<BattlePassPurchaseScreen>
    with SingleTickerProviderStateMixin {
  final PaymentService _paymentService = PaymentService();
  bool _isLoading = false;
  String? _errorMessage;
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _animation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _purchaseBattlePass(User user) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _paymentService.purchaseBattlePass(context, user);

      if (result.success) {
        // Show success snackbar
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.message),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );

        // Refresh user data
        await Provider.of<AuthService>(context, listen: false).refreshUserData();
        
        // Navigate back to battle pass screen
        Navigator.pop(context);
      } else {
        setState(() {
          _errorMessage = result.message;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'An unexpected error occurred: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CustomAppBar(
        title: 'Premium Battle Pass',
        showBackButton: true,
      ),
      body: AnimatedBackground(
        child: Consumer<AuthService>(
          builder: (context, authService, _) {
            final user = authService.currentUser;

            if (user == null) {
              return const Center(
                child: Text('Please log in to purchase Battle Pass'),
              );
            }

            final product = _paymentService.battlePassProduct;

            return FadeTransition(
              opacity: _animation,
              child: Container(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 80), // Space for AppBar

                    // Battle Pass Image
                    Image.asset(
                      product.imageUrl ?? 'assets/images/battle_pass.png',
                      height: 160,
                      fit: BoxFit.contain,
                    ),

                    const SizedBox(height: 24),

                    // Battle Pass Title
                    Text(
                      product.name,
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 8),

                    // Battle Pass Description
                    Text(
                      product.description,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Colors.white70,
                          ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 32),

                    // Features list
                    _buildFeaturesList(),

                    const SizedBox(height: 32),

                    // Error message
                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12.0),
                        margin: const EdgeInsets.only(bottom: 16.0),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8.0),
                          border: Border.all(
                            color: Colors.red.withOpacity(0.5),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(
                            color: Colors.red,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),

                    // Purchase button
                    ElevatedButton(
                      onPressed: _isLoading ? null : () => _purchaseBattlePass(user),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple[700],
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16.0),
                        textStyle: const TextStyle(
                          fontSize: 18.0,
                          fontWeight: FontWeight.bold,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12.0),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2.0,
                              ),
                            )
                          : Text('Unlock Premium for \$${product.price.toStringAsFixed(2)}'),
                    ),

                    const SizedBox(height: 16),

                    // Subscription note
                    Text(
                      'Season duration: ${product.durationDays} days',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white60,
                          ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildFeaturesList() {
    final features = [
      'Unlock premium Battle Pass rewards',
      'Gain 20% additional XP from matches',
      'Exclusive cosmetic items and effects',
      'Priority matchmaking for tournaments',
      'Tournament entry fee discounts',
      'Special clan/team perks',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Premium Benefits:',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 16),
        ...features.map((feature) => Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: Colors.purple[700],
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check,
                      size: 16,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      feature,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Colors.white,
                          ),
                    ),
                  ),
                ],
              ),
            )),
      ],
    );
  }
}