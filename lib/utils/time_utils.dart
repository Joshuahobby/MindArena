import 'package:intl/intl.dart';

class TimeUtils {
  // Format a DateTime to a readable string (e.g., "2 hours ago", "Yesterday", etc.)
  static String timeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays > 365) {
      return DateFormat('MMM d, yyyy').format(dateTime);
    } else if (difference.inDays > 30) {
      final months = (difference.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else if (difference.inDays > 0) {
      if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} days ago';
      } else {
        return DateFormat('MMM d').format(dateTime);
      }
    } else if (difference.inHours > 0) {
      return '${difference.inHours} ${difference.inHours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} ${difference.inMinutes == 1 ? 'minute' : 'minutes'} ago';
    } else {
      return 'Just now';
    }
  }

  // Format seconds to mm:ss format
  static String formatDuration(int seconds) {
    final minutes = (seconds / 60).floor();
    final remainingSeconds = seconds % 60;
    return '$minutes:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  // Format a DateTime to day of week and time
  static String formatDayAndTime(DateTime dateTime) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateToCheck = DateTime(dateTime.year, dateTime.month, dateTime.day);
    
    String prefix;
    
    if (dateToCheck == today) {
      prefix = 'Today';
    } else if (dateToCheck == yesterday) {
      prefix = 'Yesterday';
    } else {
      prefix = DateFormat('EEEE').format(dateTime); // Day of week
    }
    
    final timeStr = DateFormat('h:mm a').format(dateTime); // Time format
    
    return '$prefix at $timeStr';
  }

  // Get start and end dates for current week
  static Map<String, DateTime> getCurrentWeekDates() {
    final now = DateTime.now();
    final currentWeekday = now.weekday;
    
    // Calculate the start of the week (Monday)
    final startOfWeek = now.subtract(Duration(days: currentWeekday - 1));
    final startOfWeekDate = DateTime(startOfWeek.year, startOfWeek.month, startOfWeek.day);
    
    // Calculate the end of the week (Sunday)
    final endOfWeekDate = startOfWeekDate.add(const Duration(days: 6, hours: 23, minutes: 59, seconds: 59));
    
    return {
      'start': startOfWeekDate,
      'end': endOfWeekDate,
    };
  }

  // Get start and end dates for current month
  static Map<String, DateTime> getCurrentMonthDates() {
    final now = DateTime.now();
    
    // Start of month
    final startOfMonthDate = DateTime(now.year, now.month, 1);
    
    // End of month (start of next month minus 1 second)
    final endOfMonthDate = (now.month < 12)
        ? DateTime(now.year, now.month + 1, 1, 23, 59, 59)
            .subtract(const Duration(seconds: 1))
        : DateTime(now.year + 1, 1, 1, 23, 59, 59)
            .subtract(const Duration(seconds: 1));
    
    return {
      'start': startOfMonthDate,
      'end': endOfMonthDate,
    };
  }

  // Check if a date is today
  static bool isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year && date.month == now.month && date.day == now.day;
  }

  // Check if a date is yesterday
  static bool isYesterday(DateTime date) {
    final now = DateTime.now();
    final yesterday = now.subtract(const Duration(days: 1));
    return date.year == yesterday.year && date.month == yesterday.month && date.day == yesterday.day;
  }

  // Calculate streak days between two dates (considering only consecutive days)
  static int calculateStreakDays(DateTime lastDate, DateTime currentDate) {
    // Convert to date only (no time)
    final lastDateOnly = DateTime(lastDate.year, lastDate.month, lastDate.day);
    final currentDateOnly = DateTime(currentDate.year, currentDate.month, currentDate.day);
    
    // Check if it's the same day
    if (lastDateOnly == currentDateOnly) {
      return 0; // Same day doesn't increase streak
    }
    
    // Check if it's the next day
    final nextDay = lastDateOnly.add(const Duration(days: 1));
    if (nextDay == currentDateOnly) {
      return 1; // Streak continues
    }
    
    // Not consecutive
    return 0;
  }
}
