import 'package:flutter/material.dart';

class GradientButton extends StatelessWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final Gradient gradient;
  final double height;
  final double width;
  final BorderRadius? borderRadius;

  const GradientButton({
    Key? key,
    required this.child,
    required this.onPressed,
    required this.gradient,
    this.height = 50.0,
    this.width = double.infinity,
    this.borderRadius,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        gradient: onPressed != null ? gradient : const LinearGradient(
          colors: [Colors.grey, Colors.grey],
        ),
        borderRadius: borderRadius ?? BorderRadius.circular(8),
        boxShadow: onPressed != null ? [
          BoxShadow(
            color: gradient.colors.first.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ] : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: borderRadius ?? BorderRadius.circular(8),
          child: Center(
            child: child,
          ),
        ),
      ),
    );
  }
}