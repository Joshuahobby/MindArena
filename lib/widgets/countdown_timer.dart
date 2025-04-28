import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mind_arena/config/theme.dart';

class CountdownTimer extends StatefulWidget {
  final int durationInSeconds;
  final Function(int) onTimerUpdate;
  final VoidCallback onTimerComplete;
  final bool isDisabled;

  const CountdownTimer({
    Key? key,
    required this.durationInSeconds,
    required this.onTimerUpdate,
    required this.onTimerComplete,
    this.isDisabled = false,
  }) : super(key: key);

  @override
  State<CountdownTimer> createState() => _CountdownTimerState();
}

class _CountdownTimerState extends State<CountdownTimer> with SingleTickerProviderStateMixin {
  late Timer _timer;
  late int _remainingSeconds;
  bool _isRunning = false;
  late AnimationController _animationController;
  
  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.durationInSeconds;
    
    // Animation controller for progress
    _animationController = AnimationController(
      vsync: this,
      duration: Duration(seconds: widget.durationInSeconds),
    );
    
    // Begin countdown if not disabled
    if (!widget.isDisabled) {
      _startTimer();
    }
  }
  
  @override
  void didUpdateWidget(CountdownTimer oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Handle disabled state change
    if (widget.isDisabled && _isRunning) {
      _pauseTimer();
    } else if (!widget.isDisabled && !_isRunning && _remainingSeconds > 0) {
      _startTimer();
    }
  }
  
  @override
  void dispose() {
    if (_isRunning) {
      _timer.cancel();
    }
    _animationController.dispose();
    super.dispose();
  }
  
  void _startTimer() {
    _isRunning = true;
    _animationController.reverse(from: _remainingSeconds / widget.durationInSeconds);
    
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        if (_remainingSeconds > 0) {
          _remainingSeconds--;
          // Call the update callback
          widget.onTimerUpdate(widget.durationInSeconds - _remainingSeconds);
        } else {
          _pauseTimer();
          // Call the complete callback
          widget.onTimerComplete();
        }
      });
    });
  }
  
  void _pauseTimer() {
    if (_isRunning) {
      _timer.cancel();
      _isRunning = false;
      _animationController.stop();
    }
  }
  
  Color _getTimerColor() {
    if (widget.isDisabled) {
      return Colors.grey;
    }
    
    if (_remainingSeconds <= 3) {
      return AppTheme.error;
    } else if (_remainingSeconds <= widget.durationInSeconds / 2) {
      return AppTheme.warning;
    } else {
      return AppTheme.success;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final color = _getTimerColor();
    
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Time text
        Text(
          '$_remainingSeconds',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        
        const SizedBox(height: 4),
        
        // Progress bar
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: AnimatedBuilder(
            animation: _animationController,
            builder: (context, child) {
              return LinearProgressIndicator(
                value: widget.isDisabled
                    ? 0.0
                    : _remainingSeconds / widget.durationInSeconds,
                minHeight: 8,
                backgroundColor: Colors.white.withOpacity(0.3),
                valueColor: AlwaysStoppedAnimation<Color>(color),
              );
            },
          ),
        ),
      ],
    );
  }
}
