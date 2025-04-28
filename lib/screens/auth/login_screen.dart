import 'package:flutter/material.dart';
import 'package:mind_arena/services/firebase_service.dart';
import 'package:mind_arena/screens/auth/register_screen.dart';
import 'package:mind_arena/screens/auth/forgot_password_screen.dart';
import 'package:mind_arena/screens/home/home_screen.dart';
import 'package:mind_arena/theme/app_theme.dart';
import 'package:mind_arena/widgets/loading_overlay.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeIn,
      ),
    );
    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeOut,
      ),
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _signInWithEmailAndPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final firebaseService = FirebaseService();
      final user = await firebaseService.signInWithEmailAndPassword(
        _emailController.text.trim(),
        _passwordController.text,
      );

      if (!mounted) return;

      // Navigate to home screen
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => HomeScreen(user: user)),
      );
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = _getFirebaseErrorMessage(e.toString());
      });
    }
  }

  Future<void> _signInWithGoogle() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final firebaseService = FirebaseService();
      final user = await firebaseService.signInWithGoogle();

      if (!mounted) return;

      // Navigate to home screen
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => HomeScreen(user: user)),
      );
    } catch (e) {
      setState(() {
        _isLoading = false;
        if (e.toString().contains('Sign in cancelled by user')) {
          _errorMessage = null; // User cancelled the sign-in, no need to show error
        } else {
          _errorMessage = _getFirebaseErrorMessage(e.toString());
        }
      });
    }
  }

  String _getFirebaseErrorMessage(String error) {
    if (error.contains('user-not-found')) {
      return 'No user found with this email. Please check or register.';
    } else if (error.contains('wrong-password')) {
      return 'Wrong password. Please try again or reset your password.';
    } else if (error.contains('invalid-email')) {
      return 'Invalid email format.';
    } else if (error.contains('user-disabled')) {
      return 'This account has been disabled.';
    } else if (error.contains('too-many-requests')) {
      return 'Too many failed login attempts. Please try again later.';
    } else if (error.contains('operation-not-allowed')) {
      return 'This login method is not allowed.';
    } else if (error.contains('network-request-failed')) {
      return 'Network error. Please check your connection.';
    } else {
      return 'An error occurred during sign in. Please try again.';
    }
  }

  void _navigateToRegister() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const RegisterScreen()),
    );
  }

  void _navigateToForgotPassword() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const ForgotPasswordScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return LoadingOverlay(
      isLoading: _isLoading,
      child: Scaffold(
        body: Container(
          decoration: BoxDecoration(
            gradient: AppTheme.backgroundGradient,
          ),
          child: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: SlideTransition(
                    position: _slideAnimation,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Logo and App Name
                        _buildHeader(),
                        const SizedBox(height: 32),

                        // Login Form
                        _buildLoginForm(),
                        const SizedBox(height: 24),

                        // Error Message
                        if (_errorMessage != null) _buildErrorMessage(),

                        // Sign in with Google
                        _buildGoogleSignInButton(),
                        const SizedBox(height: 16),

                        // Register Link
                        _buildRegisterLink(),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        // Logo
        Container(
          height: 100,
          width: 100,
          decoration: BoxDecoration(
            color: AppTheme.primaryColor,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.psychology,
            size: 60,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 16),

        // App Name
        const Text(
          'MindArena',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),

        // Tagline
        const Text(
          'Test your knowledge, challenge your friends',
          style: TextStyle(
            fontSize: 16,
            color: AppTheme.secondaryTextColor,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildLoginForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Email Field
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Email',
              hintText: 'Enter your email',
              prefixIcon: const Icon(Icons.email),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your email';
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                return 'Please enter a valid email';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          // Password Field
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Password',
              hintText: 'Enter your password',
              prefixIcon: const Icon(Icons.lock),
              suffixIcon: IconButton(
                icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off),
                onPressed: () {
                  setState(() {
                    _obscurePassword = !_obscurePassword;
                  });
                },
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your password';
              }
              if (value.length < 6) {
                return 'Password must be at least 6 characters';
              }
              return null;
            },
          ),
          const SizedBox(height: 8),

          // Forgot Password Link
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: _navigateToForgotPassword,
              child: const Text('Forgot Password?'),
            ),
          ),
          const SizedBox(height: 24),

          // Login Button
          ElevatedButton(
            onPressed: _signInWithEmailAndPassword,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'LOGIN',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorMessage() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.red),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _errorMessage!,
              style: const TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGoogleSignInButton() {
    return Column(
      children: [
        const Row(
          children: [
            Expanded(child: Divider(color: AppTheme.secondaryTextColor)),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'OR',
                style: TextStyle(color: AppTheme.secondaryTextColor),
              ),
            ),
            Expanded(child: Divider(color: AppTheme.secondaryTextColor)),
          ],
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: _signInWithGoogle,
          icon: Image.network(
            'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
            height: 20,
            width: 20,
          ),
          label: const Text('Sign in with Google'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            side: const BorderSide(color: Colors.white),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRegisterLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text(
          'Don\'t have an account?',
          style: TextStyle(color: AppTheme.secondaryTextColor),
        ),
        TextButton(
          onPressed: _navigateToRegister,
          child: const Text('Register'),
        ),
      ],
    );
  }
}