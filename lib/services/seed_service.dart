import 'package:mind_arena/models/question_model.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/services/quiz_service.dart';
import 'package:mind_arena/services/database_service.dart';

class SeedService {
  final DatabaseService _databaseService;
  final QuizService _quizService;
  
  SeedService(this._databaseService, this._quizService);
  
  Future<void> seedDatabase() async {
    print('Starting database seeding...');
    
    try {
      // Ensure database connection
      await _databaseService.initialize();
      
      // Seed categories
      await _seedCategories();
      
      // Seed sample questions
      await _seedQuestions();
      
      // Seed sample users
      await _seedUsers();
      
      print('Database seeding completed successfully');
    } catch (e) {
      print('Error seeding database: $e');
      rethrow;
    }
  }
  
  Future<void> _seedCategories() async {
    print('Seeding categories...');
    
    final categories = [
      QuestionCategory(
        name: 'Science',
        description: 'Questions about various scientific fields including physics, chemistry, and biology',
        iconUrl: 'assets/images/categories/science.png',
      ),
      QuestionCategory(
        name: 'History',
        description: 'Questions about historical events, figures, and time periods',
        iconUrl: 'assets/images/categories/history.png',
      ),
      QuestionCategory(
        name: 'Geography',
        description: 'Questions about countries, capitals, landmarks, and physical geography',
        iconUrl: 'assets/images/categories/geography.png',
      ),
      QuestionCategory(
        name: 'Entertainment',
        description: 'Questions about movies, TV shows, music, and pop culture',
        iconUrl: 'assets/images/categories/entertainment.png',
      ),
      QuestionCategory(
        name: 'Sports',
        description: 'Questions about various sports, athletes, teams, and competitions',
        iconUrl: 'assets/images/categories/sports.png',
      ),
    ];
    
    for (final category in categories) {
      try {
        await _quizService.createCategory(category);
        print('Created category: ${category.name}');
      } catch (e) {
        print('Error creating category ${category.name}: $e');
        // Continue with other categories if one fails
      }
    }
  }
  
  Future<void> _seedQuestions() async {
    print('Seeding questions...');
    
    // Get all categories
    final categories = await _quizService.getCategories();
    if (categories.isEmpty) {
      print('No categories found, skipping question seeding');
      return;
    }
    
    // Science questions
    final scienceCategory = categories.firstWhere(
      (c) => c.name == 'Science',
      orElse: () => categories.first,
    );
    
    final scienceQuestions = [
      _createQuestion(
        categoryId: scienceCategory.id!,
        questionText: 'What is the chemical symbol for gold?',
        difficulty: 1,
        answers: [
          _createAnswer('Au', true),
          _createAnswer('Ag', false),
          _createAnswer('Fe', false),
          _createAnswer('Gd', false),
        ],
      ),
      _createQuestion(
        categoryId: scienceCategory.id!,
        questionText: 'Which planet is known as the Red Planet?',
        difficulty: 1,
        answers: [
          _createAnswer('Mars', true),
          _createAnswer('Venus', false),
          _createAnswer('Jupiter', false),
          _createAnswer('Saturn', false),
        ],
      ),
    ];
    
    // History questions
    final historyCategory = categories.firstWhere(
      (c) => c.name == 'History',
      orElse: () => categories.first,
    );
    
    final historyQuestions = [
      _createQuestion(
        categoryId: historyCategory.id!,
        questionText: 'In which year did World War II end?',
        difficulty: 1,
        answers: [
          _createAnswer('1945', true),
          _createAnswer('1939', false),
          _createAnswer('1942', false),
          _createAnswer('1950', false),
        ],
      ),
      _createQuestion(
        categoryId: historyCategory.id!,
        questionText: 'Who was the first President of the United States?',
        difficulty: 1,
        answers: [
          _createAnswer('George Washington', true),
          _createAnswer('Thomas Jefferson', false),
          _createAnswer('Abraham Lincoln', false),
          _createAnswer('John Adams', false),
        ],
      ),
    ];
    
    // Geography questions
    final geographyCategory = categories.firstWhere(
      (c) => c.name == 'Geography',
      orElse: () => categories.first,
    );
    
    final geographyQuestions = [
      _createQuestion(
        categoryId: geographyCategory.id!,
        questionText: 'What is the capital of Japan?',
        difficulty: 1,
        answers: [
          _createAnswer('Tokyo', true),
          _createAnswer('Kyoto', false),
          _createAnswer('Osaka', false),
          _createAnswer('Hiroshima', false),
        ],
      ),
      _createQuestion(
        categoryId: geographyCategory.id!,
        questionText: 'Which is the largest ocean on Earth?',
        difficulty: 1,
        answers: [
          _createAnswer('Pacific Ocean', true),
          _createAnswer('Atlantic Ocean', false),
          _createAnswer('Indian Ocean', false),
          _createAnswer('Arctic Ocean', false),
        ],
      ),
    ];
    
    // Combine all questions
    final allQuestions = [
      ...scienceQuestions,
      ...historyQuestions,
      ...geographyQuestions,
    ];
    
    // Create questions in database
    for (final question in allQuestions) {
      try {
        await _quizService.createQuestion(question);
        print('Created question: ${question.questionText}');
      } catch (e) {
        print('Error creating question "${question.questionText}": $e');
        // Continue with other questions if one fails
      }
    }
  }
  
  Question _createQuestion({
    required int categoryId,
    required String questionText,
    required int difficulty,
    required List<QuestionAnswer> answers,
  }) {
    return Question(
      categoryId: categoryId,
      questionText: questionText,
      difficulty: difficulty,
      answers: answers,
    );
  }
  
  QuestionAnswer _createAnswer(String text, bool isCorrect) {
    return QuestionAnswer(
      answerText: text,
      isCorrect: isCorrect,
    );
  }
  
  Future<void> _seedUsers() async {
    print('Seeding users...');
    
    final connection = _databaseService.connection;
    if (connection == null) {
      throw Exception('Database connection not initialized');
    }
    
    // Sample user data (password hashes would be properly generated in a real app)
    final users = [
      {
        'username': 'player1',
        'email': 'player1@example.com',
        'password_hash': 'password_hash_1',
        'display_name': 'Quiz Master',
        'avatar_url': 'assets/images/avatars/player1.png',
      },
      {
        'username': 'player2',
        'email': 'player2@example.com',
        'password_hash': 'password_hash_2',
        'display_name': 'Trivia King',
        'avatar_url': 'assets/images/avatars/player2.png',
      },
    ];
    
    for (final userData in users) {
      try {
        // Check if user already exists
        final existingUser = await connection.query(
          'SELECT * FROM users WHERE username = @username OR email = @email',
          substitutionValues: {
            'username': userData['username'],
            'email': userData['email'],
          },
        );
        
        if (existingUser.isEmpty) {
          // Create new user
          await connection.query(
            '''
            INSERT INTO users (username, email, password_hash, display_name, avatar_url)
            VALUES (@username, @email, @passwordHash, @displayName, @avatarUrl)
            ''',
            substitutionValues: {
              'username': userData['username'],
              'email': userData['email'],
              'passwordHash': userData['password_hash'],
              'displayName': userData['display_name'],
              'avatarUrl': userData['avatar_url'],
            },
          );
          
          print('Created user: ${userData['username']}');
        } else {
          print('User ${userData['username']} already exists, skipping');
        }
      } catch (e) {
        print('Error creating user ${userData['username']}: $e');
        // Continue with other users if one fails
      }
    }
  }
}