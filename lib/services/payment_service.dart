import 'dart:async';
import 'dart:convert';
import 'dart:developer' as developer;
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutterwave_standard/flutterwave.dart';
import 'package:http/http.dart' as http;
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/services/auth_service.dart';
import 'package:uuid/uuid.dart';

class PaymentService {
  static final PaymentService _instance = PaymentService._internal();
  factory PaymentService() => _instance;
  PaymentService._internal();

  // Flutterwave Public Key
  final String _publicKey = dotenv.env['FLUTTERWAVE_PUBLIC_KEY'] ?? '';
  final String _currencyCode = 'USD';
  final String _paymentOptions = 'card, mobilemoney, ussd';
  final String _redirectUrl = 'https://mindarena.app/payment-callback';
  final bool _isTestMode = true; // Set to false for production

  // Server endpoint for payment verification
  final String _serverEndpoint = '/api/verify-payment';

  // Token packages
  final List<TokenPackage> tokenPackages = [
    TokenPackage(id: 'tokens_100', name: 'Starter Pack', tokens: 100, price: 0.99, currencyCode: 'USD'),
    TokenPackage(id: 'tokens_500', name: 'Value Pack', tokens: 500, price: 4.99, currencyCode: 'USD'),
    TokenPackage(id: 'tokens_1000', name: 'Premium Pack', tokens: 1000, price: 9.99, currencyCode: 'USD'),
    TokenPackage(id: 'tokens_2500', name: 'Pro Pack', tokens: 2500, price: 19.99, currencyCode: 'USD'),
    TokenPackage(id: 'tokens_5000', name: 'Ultimate Pack', tokens: 5000, price: 29.99, currencyCode: 'USD'),
  ];

  // Battle Pass Product
  final BattlePassProduct battlePassProduct = BattlePassProduct(
    id: 'battle_pass_premium',
    name: 'Premium Battle Pass',
    description: 'Unlock premium rewards and exclusive content',
    price: 9.99,
    currencyCode: 'USD',
    durationDays: 30,
  );

  // Process a token purchase
  Future<PaymentResult> purchaseTokens(
    BuildContext context, 
    User user, 
    TokenPackage package
  ) async {
    try {
      final txRef = 'mind_arena_tokens_${const Uuid().v4()}';
      final amount = package.price.toString();

      final Customer customer = Customer(
        name: user.username,
        phoneNumber: user.phoneNumber ?? '',
        email: user.email,
      );

      final Flutterwave flutterwave = Flutterwave(
        context: context,
        publicKey: _publicKey,
        txRef: txRef,
        amount: amount,
        customer: customer,
        paymentOptions: _paymentOptions,
        customization: Customization(title: 'MindArena Tokens'),
        isTestMode: _isTestMode,
        currency: _currencyCode,
        redirectUrl: _redirectUrl,
      );

      final ChargeResponse response = await flutterwave.charge();

      if (response.status == 'successful') {
        // Verify the payment on the server
        final verificationResult = await _verifyPayment(
          txRef, 
          response.transactionId ?? '',
          'token_purchase',
          package.id,
          package.price,
        );

        if (verificationResult) {
          // Add tokens to user account
          return PaymentResult(
            success: true,
            message: 'Payment successful! ${package.tokens} tokens added to your account.',
            data: {
              'tokens': package.tokens,
              'transactionId': response.transactionId,
            },
          );
        } else {
          return PaymentResult(
            success: false,
            message: 'Payment verification failed. Please contact support.',
          );
        }
      } else {
        return PaymentResult(
          success: false,
          message: 'Payment failed or was cancelled',
        );
      }
    } catch (e) {
      developer.log('Error processing token purchase: $e');
      return PaymentResult(
        success: false,
        message: 'An error occurred while processing your payment: $e',
      );
    }
  }

  // Process a battle pass purchase
  Future<PaymentResult> purchaseBattlePass(
    BuildContext context, 
    User user,
  ) async {
    try {
      final txRef = 'mind_arena_bp_${const Uuid().v4()}';
      final amount = battlePassProduct.price.toString();

      final Customer customer = Customer(
        name: user.username,
        phoneNumber: user.phoneNumber ?? '',
        email: user.email,
      );

      final Flutterwave flutterwave = Flutterwave(
        context: context,
        publicKey: _publicKey,
        txRef: txRef,
        amount: amount,
        customer: customer,
        paymentOptions: _paymentOptions,
        customization: Customization(title: 'MindArena Battle Pass'),
        isTestMode: _isTestMode,
        currency: _currencyCode,
        redirectUrl: _redirectUrl,
      );

      final ChargeResponse response = await flutterwave.charge();

      if (response.status == 'successful') {
        // Verify the payment on the server
        final verificationResult = await _verifyPayment(
          txRef, 
          response.transactionId ?? '',
          'battle_pass_purchase',
          battlePassProduct.id,
          battlePassProduct.price,
        );

        if (verificationResult) {
          // Activate battle pass for user
          return PaymentResult(
            success: true,
            message: 'Payment successful! Premium Battle Pass activated.',
            data: {
              'battlePassId': battlePassProduct.id,
              'transactionId': response.transactionId,
              'expiryDate': DateTime.now().add(Duration(days: battlePassProduct.durationDays)),
            },
          );
        } else {
          return PaymentResult(
            success: false,
            message: 'Payment verification failed. Please contact support.',
          );
        }
      } else {
        return PaymentResult(
          success: false,
          message: 'Payment failed or was cancelled',
        );
      }
    } catch (e) {
      developer.log('Error processing battle pass purchase: $e');
      return PaymentResult(
        success: false,
        message: 'An error occurred while processing your payment: $e',
      );
    }
  }

  // Verify payment with backend server
  Future<bool> _verifyPayment(
    String txRef,
    String transactionId,
    String purchaseType,
    String productId,
    double amount,
  ) async {
    try {
      final response = await http.post(
        Uri.parse(_serverEndpoint),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'txRef': txRef,
          'transactionId': transactionId,
          'purchaseType': purchaseType,
          'productId': productId,
          'amount': amount,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      } else {
        developer.log('Payment verification failed with status: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      developer.log('Error verifying payment: $e');
      return false;
    }
  }
}

// Models
class TokenPackage {
  final String id;
  final String name;
  final int tokens;
  final double price;
  final String currencyCode;
  final String? description;
  final String? imageUrl;
  final bool isPromoted;

  TokenPackage({
    required this.id,
    required this.name,
    required this.tokens,
    required this.price,
    required this.currencyCode,
    this.description,
    this.imageUrl,
    this.isPromoted = false,
  });
}

class BattlePassProduct {
  final String id;
  final String name;
  final String description;
  final double price;
  final String currencyCode;
  final int durationDays;
  final String? imageUrl;

  BattlePassProduct({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.currencyCode,
    required this.durationDays,
    this.imageUrl,
  });
}

class PaymentResult {
  final bool success;
  final String message;
  final Map<String, dynamic>? data;

  PaymentResult({
    required this.success,
    required this.message,
    this.data,
  });
}