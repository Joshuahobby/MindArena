import 'package:flutter/material.dart';

class AnimatedBackground extends StatefulWidget {
  final Widget child;
  final Color startColor;
  final Color endColor;
  final Duration duration;

  const AnimatedBackground({
    Key? key,
    required this.child,
    this.startColor = const Color(0xFF1A2151),  // Dark blue
    this.endColor = const Color(0xFF0D1137),    // Deep navy
    this.duration = const Duration(seconds: 20),
  }) : super(key: key);

  @override
  _AnimatedBackgroundState createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  
  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );
    
    _animation = Tween<double>(begin: 0, end: 1).animate(_controller);
    
    _controller.repeat(reverse: true);
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight.add(
                Alignment(_animation.value * 0.3, _animation.value * 0.3),
              ),
              colors: [
                widget.startColor,
                widget.endColor,
              ],
            ),
          ),
          child: Stack(
            children: [
              // Animated particles
              ...List.generate(
                20,
                (index) => Positioned(
                  left: MediaQuery.of(context).size.width * (index / 20) + 
                      ((_animation.value * 100) * (index % 2 == 0 ? 1 : -1)) % 
                      MediaQuery.of(context).size.width,
                  top: MediaQuery.of(context).size.height * ((index + 5) / 25) + 
                      ((_animation.value * 60) * (index % 3 == 0 ? 1 : -1)) % 
                      MediaQuery.of(context).size.height,
                  child: Opacity(
                    opacity: 0.1 + (index % 10) * 0.01,
                    child: Container(
                      width: 4 + (index % 4) * 2.0,
                      height: 4 + (index % 4) * 2.0,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ),
              // Child widget
              child!,
            ],
          ),
        );
      },
      child: widget.child,
    );
  }
}