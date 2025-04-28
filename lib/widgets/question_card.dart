import 'package:flutter/material.dart';
import 'package:mind_arena/config/theme.dart';

class QuestionCard extends StatefulWidget {
  final String question;
  final List<String> options;
  final Function(int) onAnswerSelected;
  final bool isAnswered;
  final int selectedAnswerIndex;
  final int? correctAnswerIndex;
  final bool isEnabled;

  const QuestionCard({
    Key? key,
    required this.question,
    required this.options,
    required this.onAnswerSelected,
    this.isAnswered = false,
    this.selectedAnswerIndex = -1,
    this.correctAnswerIndex,
    this.isEnabled = true,
  }) : super(key: key);

  @override
  State<QuestionCard> createState() => _QuestionCardState();
}

class _QuestionCardState extends State<QuestionCard> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  int _hoveredOptionIndex = -1;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _scaleAnimation = CurvedAnimation(
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

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Question text
              Expanded(
                flex: 2,
                child: Center(
                  child: SingleChildScrollView(
                    child: Text(
                      widget.question,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Options
              Expanded(
                flex: 4,
                child: ListView.builder(
                  itemCount: widget.options.length,
                  itemBuilder: (context, index) {
                    return _buildOptionButton(index);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptionButton(int index) {
    bool isSelected = widget.selectedAnswerIndex == index;
    bool isCorrect = widget.correctAnswerIndex == index;
    bool isWrong = widget.isAnswered && 
                   isSelected && 
                   widget.correctAnswerIndex != null && 
                   widget.correctAnswerIndex != index;
    
    // Determine option button color
    Color backgroundColor;
    Color textColor = Colors.black;
    
    if (widget.correctAnswerIndex != null) {
      // Show correct/wrong answers
      if (isCorrect) {
        backgroundColor = AppTheme.correctAnswer;
        textColor = Colors.white;
      } else if (isWrong) {
        backgroundColor = AppTheme.wrongAnswer;
        textColor = Colors.white;
      } else {
        backgroundColor = Colors.white;
      }
    } else {
      // Normal selection or hover state
      if (isSelected) {
        backgroundColor = AppTheme.primaryColor;
        textColor = Colors.white;
      } else if (_hoveredOptionIndex == index) {
        backgroundColor = AppTheme.primaryColorLight.withOpacity(0.3);
      } else {
        backgroundColor = Colors.white;
      }
    }
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
        elevation: isSelected ? 4 : 2,
        child: InkWell(
          onTap: widget.isEnabled ? () => widget.onAnswerSelected(index) : null,
          onHover: (isHovered) {
            if (widget.isEnabled && !widget.isAnswered) {
              setState(() {
                _hoveredOptionIndex = isHovered ? index : -1;
              });
            }
          },
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            child: Row(
              children: [
                // Option letter (A, B, C, D)
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSelected || isCorrect || isWrong 
                        ? Colors.white.withOpacity(0.3)
                        : AppTheme.primaryColor.withOpacity(0.1),
                  ),
                  child: Center(
                    child: Text(
                      String.fromCharCode(65 + index), // A, B, C, D...
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isSelected || isCorrect || isWrong
                            ? textColor
                            : AppTheme.primaryColor,
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Option text
                Expanded(
                  child: Text(
                    widget.options[index],
                    style: TextStyle(
                      fontSize: 16,
                      color: textColor,
                      fontWeight: isSelected || isCorrect ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ),
                
                // Correct/wrong indicator
                if (isCorrect)
                  const Icon(
                    Icons.check_circle,
                    color: Colors.white,
                  )
                else if (isWrong)
                  const Icon(
                    Icons.cancel,
                    color: Colors.white,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
