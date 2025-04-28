import 'package:flutter/material.dart';
import 'package:mind_arena/config/theme.dart';

class CustomButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String text;
  final Color color;
  final Color? textColor;
  final IconData? icon;
  final double height;
  final double? width;
  final double fontSize;
  final bool isLoading;
  final bool outline;

  const CustomButton({
    Key? key,
    required this.onPressed,
    required this.text,
    this.color = AppTheme.primaryColor,
    this.textColor,
    this.icon,
    this.height = 48,
    this.width,
    this.fontSize = 16,
    this.isLoading = false,
    this.outline = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Determine colors based on outline
    final Color backgroundColor = outline ? Colors.transparent : color;
    final Color foregroundColor = textColor ?? (outline ? color : Colors.white);
    
    // Determine shape
    final RoundedRectangleBorder shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
      side: outline ? BorderSide(color: color, width: 2) : BorderSide.none,
    );
    
    // Build button content
    Widget content;
    
    if (isLoading) {
      content = SizedBox(
        height: 24,
        width: 24,
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
          strokeWidth: 2,
        ),
      );
    } else if (icon != null) {
      content = Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      );
    } else {
      content = Text(
        text,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
        ),
      );
    }
    
    // Build the button
    if (outline) {
      return SizedBox(
        height: height,
        width: width,
        child: OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: foregroundColor,
            side: BorderSide(color: color, width: 2),
            shape: shape,
            padding: const EdgeInsets.symmetric(horizontal: 16),
          ),
          child: content,
        ),
      );
    } else {
      return SizedBox(
        height: height,
        width: width,
        child: ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            foregroundColor: foregroundColor,
            backgroundColor: backgroundColor,
            shape: shape,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            elevation: 3,
          ),
          child: content,
        ),
      );
    }
  }
}
