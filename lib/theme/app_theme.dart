import 'package:flutter/material.dart';

class AppTheme {
  // Private constructor to prevent instantiation
  AppTheme._();
  
  // Colors
  static const Color primaryColor = Color(0xFF5E35B1); // Deep Purple
  static const Color accentColor = Color(0xFFFF5722); // Deep Orange
  static const Color backgroundColor = Color(0xFF121212);
  static const Color cardColor = Color(0xFF1E1E1E);
  static const Color textColor = Color(0xFFF5F5F5);
  static const Color secondaryTextColor = Color(0xFFBDBDBD);
  static const Color correctAnswerColor = Color(0xFF4CAF50); // Green
  static const Color incorrectAnswerColor = Color(0xFFF44336); // Red
  static const Color timerWarningColor = Color(0xFFFFEB3B); // Yellow
  static const Color timerDangerColor = Color(0xFFFF5722); // Deep Orange
  
  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF7B1FA2), Color(0xFF5E35B1)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFFF7043), Color(0xFFFF5722)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient backgroundGradient = LinearGradient(
    colors: [Color(0xFF121212), Color(0xFF212121)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  
  // Theme data
  static final ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: primaryColor,
    colorScheme: ColorScheme.dark(
      primary: primaryColor,
      secondary: accentColor,
      background: backgroundColor,
      surface: cardColor,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onBackground: textColor,
      onSurface: textColor,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: backgroundColor,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        color: textColor,
        fontSize: 20,
        fontWeight: FontWeight.bold,
      ),
    ),
    scaffoldBackgroundColor: backgroundColor,
    cardTheme: CardTheme(
      color: cardColor,
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    buttonTheme: ButtonThemeData(
      buttonColor: primaryColor,
      textTheme: ButtonTextTheme.primary,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: BorderSide(color: primaryColor),
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: cardColor,
      hintStyle: TextStyle(color: secondaryTextColor),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: primaryColor, width: 2),
      ),
    ),
    textTheme: TextTheme(
      displayLarge: TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: textColor,
      ),
      displayMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: textColor,
      ),
      displaySmall: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: textColor,
      ),
      headlineMedium: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: textColor,
      ),
      headlineSmall: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: textColor,
      ),
      titleLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: textColor,
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        color: textColor,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        color: textColor,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        color: secondaryTextColor,
      ),
    ),
    dialogTheme: DialogTheme(
      backgroundColor: cardColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: cardColor,
      contentTextStyle: TextStyle(color: textColor),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
      ),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: primaryColor,
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: backgroundColor,
      selectedItemColor: primaryColor,
      unselectedItemColor: secondaryTextColor,
      type: BottomNavigationBarType.fixed,
    ),
  );
}