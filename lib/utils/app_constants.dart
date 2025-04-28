// Application-wide constants

// Admin emails - users with these emails will be registered as admins
const List<String> kAdminEmails = [
  'admin@mindarena.com',
  'support@mindarena.com',
];

// App settings
const String kAppName = 'MindArena';
const String kAppVersion = '1.0.0';

// Battle Pass settings
const int kBattlePassLevels = 50;
const int kBattlePassPointsPerLevel = 1000;
const int kBattlePassDurationDays = 30;

// Game settings
const int kDefaultTokens = 100;
const int kDefaultQuestionTime = 15; // seconds
const int kQuestionsPerGame = 5;

// Routes
const String kHomeRoute = '/';
const String kLoginRoute = '/login';
const String kRegisterRoute = '/register';
const String kResetPasswordRoute = '/reset-password';
const String kPlayerDashboardRoute = '/player/dashboard';
const String kAdminDashboardRoute = '/admin/dashboard';