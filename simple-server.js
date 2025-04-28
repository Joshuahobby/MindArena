const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const firebase = require('firebase/app');
require('firebase/auth');

// Import clan routes
const clanRoutes = require('./server/clan-routes');

// Initialize express app and create HTTP server
const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize middleware
app.use(cors());
app.use(express.json());

// Register API routes
app.use('/api/clans', clanRoutes);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Common JavaScript for all pages to fix profile dropdown issues
const commonJsForHead = `
<script>
  // Improved toggleProfileDropdown function to be included in all pages
  function toggleProfileDropdown(event) {
    if (event) {
      event.stopPropagation();
    }
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
      dropdown.classList.toggle('show');
      
      // Close dropdown when clicking outside
      setTimeout(function() {
        const closeHandler = function(e) {
          if (!e.target.closest('.profile-menu')) {
            dropdown.classList.remove('show');
            document.removeEventListener('click', closeHandler);
          }
        };
        document.addEventListener('click', closeHandler);
      }, 10);
    }
  }
  
  // We don't override handleLogout since it's defined in each page
  // Instead, we'll ensure the click events are wired up correctly
  
  // Fix account settings link and logout functionality
  document.addEventListener('DOMContentLoaded', function() {
    // Find all account settings links and update them to go to dashboard
    const accountLinks = document.querySelectorAll('.dropdown-item[onclick*="account"]');
    accountLinks.forEach(link => {
      link.setAttribute('onclick', "window.location.href='/dashboard'");
    });
    
    // Fix logout buttons with direct event handler
    const logoutButtons = document.querySelectorAll('.dropdown-item[onclick*="handleLogout"]');
    logoutButtons.forEach(button => {
      // Remove the inline onclick
      button.removeAttribute('onclick');
      // Add direct event listener
      button.addEventListener('click', function() {
        // Simple logout that works everywhere
        window.location.href = '/';
      });
    });
    
    // Auto-fix for profile avatar click handlers
    const profileAvatar = document.getElementById('profileInitial');
    if (profileAvatar) {
      // Remove the inline onclick attribute to prevent multiple handlers
      profileAvatar.removeAttribute('onclick');
      
      // Add a proper event listener that handles the event correctly
      profileAvatar.addEventListener('click', function(event) {
        toggleProfileDropdown(event);
      });
    }
  });
</script>
`;

// Store connected clients
const clients = new Map();
// Store users in matchmaking queue
const matchmakingQueue = [];
// Store active games
const activeGames = new Map();
// Store single player games
const singlePlayerGames = new Map();
// Store online user count
let onlineUserCount = 0;

// Handle user logout
function handleLogout(userId) {
  if (!userId) return;
  
  // Find and update client connections for this user
  for (const [ws, clientInfo] of clients.entries()) {
    if (clientInfo.userId === userId) {
      // Update client status
      clientInfo.isAuthenticated = false;
      clientInfo.userId = null;
      clientInfo.username = null;
      
      // Remove from matchmaking if applicable
      if (clientInfo.inMatchmaking) {
        const index = matchmakingQueue.findIndex(entry => entry.userId === userId);
        if (index !== -1) {
          matchmakingQueue.splice(index, 1);
        }
        clientInfo.inMatchmaking = false;
      }
      
      // Handle game disconnection if applicable
      if (clientInfo.inGame && clientInfo.gameId) {
        handlePlayerDisconnect(clientInfo, clientInfo.gameId);
        clientInfo.inGame = false;
        clientInfo.gameId = null;
      }
      
      // Send logout confirmation to client
      ws.send(JSON.stringify({
        type: 'logout_success'
      }));
    }
  }
  
  // Update online user count
  updateOnlineUserCount();
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Generate a temporary client ID
  const clientId = Date.now().toString();
  clients.set(ws, {
    id: clientId,
    isAuthenticated: false,
    userId: null,
    username: null,
    inMatchmaking: false,
    inGame: false,
    gameId: null
  });
  
  // Update online user count
  updateOnlineUserCount();
  
  // Message handler
  ws.on('message', (messageBuffer) => {
    try {
      const message = JSON.parse(messageBuffer.toString());
      handleClientMessage(ws, message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  // Close handler
  ws.on('close', () => {
    const clientInfo = clients.get(ws);
    if (clientInfo) {
      console.log(`WebSocket client ${clientInfo.userId || clientInfo.id} disconnected`);
      
      // Remove from matchmaking queue if applicable
      if (clientInfo.inMatchmaking) {
        const index = matchmakingQueue.findIndex(item => item.userId === clientInfo.userId);
        if (index !== -1) {
          matchmakingQueue.splice(index, 1);
        }
      }
      
      // Handle game disconnect if in a game
      if (clientInfo.inGame && clientInfo.gameId) {
        handlePlayerDisconnect(clientInfo, clientInfo.gameId);
      }
      
      // Remove client
      clients.delete(ws);
      
      // Update online user count
      updateOnlineUserCount();
    }
  });
  
  // Error handler
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle client messages
function handleClientMessage(ws, message) {
  const clientInfo = clients.get(ws);
  if (!clientInfo) return;
  
  console.log('Received message:', message.type, 'from', clientInfo.username || clientInfo.id);
  
  switch (message.type) {
    case 'auth':
      // Authenticate the client
      handleAuthentication(ws, clientInfo, message);
      break;
      
    case 'get_online_users':
      // Send online user count
      sendOnlineUserCount(ws);
      break;
      
    case 'find_match':
      // Add to matchmaking queue
      handleMatchmaking(ws, clientInfo);
      break;
      
    case 'cancel_matchmaking':
      // Remove from matchmaking queue
      cancelMatchmaking(ws, clientInfo);
      break;
      
    case 'matchmaking_status':
      // Send matchmaking status
      sendMatchmakingStatus(ws, clientInfo);
      break;
      
    case 'submit_answer':
      // Handle answer submission
      handleAnswerSubmission(ws, clientInfo, message);
      break;
      
    case 'logout':
      // Handle user logout
      handleLogout(clientInfo.userId);
      break;
      
    case 'start_single_player':
      // Start a single player game against a bot
      handleSinglePlayerGame(ws, clientInfo);
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
}

// Handle client authentication
function handleAuthentication(ws, clientInfo, message) {
  if (!message.userId) return;
  
  clientInfo.isAuthenticated = true;
  clientInfo.userId = message.userId;
  clientInfo.username = message.username || 'Player';
  
  clients.set(ws, clientInfo);
  
  console.log(`Client authenticated: ${clientInfo.username} (${clientInfo.userId})`);
  
  // Send confirmation
  ws.send(JSON.stringify({
    type: 'auth_success',
    userId: clientInfo.userId,
    username: clientInfo.username
  }));
  
  // Send online user count
  sendOnlineUserCount(ws);
}

// Update online user count
function updateOnlineUserCount() {
  // Count authenticated users
  const authenticatedUsers = Array.from(clients.values()).filter(client => client.isAuthenticated);
  onlineUserCount = authenticatedUsers.length;
  
  // Broadcast to all authenticated clients
  broadcastMessage({
    type: 'online_users',
    count: onlineUserCount
  });
}

// Send online user count to a client
function sendOnlineUserCount(ws) {
  ws.send(JSON.stringify({
    type: 'online_users',
    count: onlineUserCount
  }));
}

// Handle matchmaking
function handleMatchmaking(ws, clientInfo) {
  if (!clientInfo.isAuthenticated) {
    sendErrorMessage(ws, 'You must be authenticated to find a match');
    return;
  }
  
  if (clientInfo.inGame) {
    sendErrorMessage(ws, 'You are already in a game');
    return;
  }
  
  if (clientInfo.inMatchmaking) {
    sendErrorMessage(ws, 'You are already in the matchmaking queue');
    return;
  }
  
  // Add to matchmaking queue
  clientInfo.inMatchmaking = true;
  clients.set(ws, clientInfo);
  
  matchmakingQueue.push({
    ws,
    userId: clientInfo.userId,
    username: clientInfo.username,
    timestamp: Date.now()
  });
  
  console.log(`Added ${clientInfo.username} to matchmaking queue. Queue size: ${matchmakingQueue.length}`);
  
  // Send matchmaking status
  sendMatchmakingStatus(ws, clientInfo);
  
  // Try to find a match immediately
  findMatches();
}

// Cancel matchmaking
function cancelMatchmaking(ws, clientInfo) {
  if (!clientInfo.inMatchmaking) return;
  
  // Remove from matchmaking queue
  const index = matchmakingQueue.findIndex(item => item.userId === clientInfo.userId);
  if (index !== -1) {
    matchmakingQueue.splice(index, 1);
  }
  
  // Update client info
  clientInfo.inMatchmaking = false;
  clients.set(ws, clientInfo);
  
  console.log(`Removed ${clientInfo.username} from matchmaking queue. Queue size: ${matchmakingQueue.length}`);
  
  // Send matchmaking status
  sendMatchmakingStatus(ws, clientInfo);
}

// Send matchmaking status to a client
function sendMatchmakingStatus(ws, clientInfo) {
  if (!clientInfo.inMatchmaking) {
    ws.send(JSON.stringify({
      type: 'matchmaking_status',
      status: 'idle'
    }));
    return;
  }
  
  const queuePosition = matchmakingQueue.findIndex(item => item.userId === clientInfo.userId) + 1;
  const waitTime = Math.floor((Date.now() - matchmakingQueue[queuePosition - 1].timestamp) / 1000);
  
  ws.send(JSON.stringify({
    type: 'matchmaking_status',
    status: 'searching',
    message: `Looking for opponents... (${queuePosition} in queue, ${waitTime}s)`
  }));
}

// Find matches among users in the matchmaking queue
function findMatches() {
  if (matchmakingQueue.length < 2) return;
  
  console.log('Finding matches for', matchmakingQueue.length, 'players in queue');
  
  // Sort queue by wait time (oldest first)
  matchmakingQueue.sort((a, b) => a.timestamp - b.timestamp);
  
  // Match pairs of players
  while (matchmakingQueue.length >= 2) {
    const player1 = matchmakingQueue.shift();
    const player2 = matchmakingQueue.shift();
    
    createGame(player1, player2);
  }
}

// Create a new game between two players
function createGame(player1, player2) {
  // Create game ID
  const gameId = `game_${Date.now()}`;
  
  console.log(`Creating game ${gameId} between ${player1.username} and ${player2.username}`);
  
  // Get client info for both players
  const client1 = Array.from(clients.entries()).find(([_, client]) => client.userId === player1.userId);
  const client2 = Array.from(clients.entries()).find(([_, client]) => client.userId === player2.userId);
  
  if (!client1 || !client2) {
    console.error('Could not find client info for one or both players');
    return;
  }
  
  const [ws1, clientInfo1] = client1;
  const [ws2, clientInfo2] = client2;
  
  // Update client info for both players
  clientInfo1.inMatchmaking = false;
  clientInfo1.inGame = true;
  clientInfo1.gameId = gameId;
  
  clientInfo2.inMatchmaking = false;
  clientInfo2.inGame = true;
  clientInfo2.gameId = gameId;
  
  clients.set(ws1, clientInfo1);
  clients.set(ws2, clientInfo2);
  
  // Prepare questions
  const questions = getRandomQuestions(5);
  
  // Create game state
  const gameState = {
    id: gameId,
    players: [
      {
        ws: ws1,
        userId: player1.userId,
        username: player1.username,
        score: 0,
        answers: [],
        ready: false
      },
      {
        ws: ws2,
        userId: player2.userId,
        username: player2.username,
        score: 0,
        answers: [],
        ready: false
      }
    ],
    questions,
    currentQuestion: 0,
    status: 'preparing',
    startTime: null,
    endTime: null
  };
  
  // Store game state
  activeGames.set(gameId, gameState);
  
  // Notify players
  ws1.send(JSON.stringify({
    type: 'match_found',
    opponent: {
      userId: player2.userId,
      username: player2.username
    }
  }));
  
  ws2.send(JSON.stringify({
    type: 'match_found',
    opponent: {
      userId: player1.userId,
      username: player1.username
    }
  }));
  
  // Start game after 3 seconds
  setTimeout(() => startGame(gameId), 3000);
}

// Start a game
function startGame(gameId) {
  const game = activeGames.get(gameId);
  if (!game) return;
  
  console.log(`Starting game ${gameId}`);
  
  // Update game status
  game.status = 'playing';
  game.startTime = Date.now();
  
  // Store updated game state
  activeGames.set(gameId, game);
  
  // Notify players
  game.players.forEach(player => {
    player.ws.send(JSON.stringify({
      type: 'game_start'
    }));
  });
  
  // Send first question
  sendQuestion(gameId);
}

// Send a question to both players
function sendQuestion(gameId) {
  const game = activeGames.get(gameId);
  if (!game || game.status !== 'playing') return;
  
  if (game.currentQuestion >= game.questions.length) {
    // All questions have been answered, end the game
    endGame(gameId);
    return;
  }
  
  const questionData = game.questions[game.currentQuestion];
  
  console.log(`Sending question ${game.currentQuestion + 1} to game ${gameId}`);
  
  // Prepare question data to send
  const questionToSend = {
    type: 'question',
    questionNumber: game.currentQuestion + 1,
    totalQuestions: game.questions.length,
    question: questionData.question,
    answers: questionData.answers,
    timeLimit: 15 // 15 seconds per question
  };
  
  // Send to both players
  game.players.forEach(player => {
    player.ws.send(JSON.stringify(questionToSend));
  });
  
  // Set a timer to move to the next question
  game.questionTimer = setTimeout(() => {
    processAnswers(gameId);
  }, 16000); // 15 seconds + 1 second buffer
}

// Process answers for the current question
function processAnswers(gameId) {
  const game = activeGames.get(gameId);
  if (!game || game.status !== 'playing') return;
  
  console.log(`Processing answers for question ${game.currentQuestion + 1} in game ${gameId}`);
  
  const question = game.questions[game.currentQuestion];
  const correctAnswer = question.correctAnswer;
  
  // Process each player's answer
  game.players.forEach(player => {
    // Get the player's answer for this question
    const playerAnswer = player.answers[game.currentQuestion];
    
    // If the player didn't answer, count as incorrect
    if (!playerAnswer) {
      player.answers[game.currentQuestion] = {
        answer: null,
        isCorrect: false,
        responseTime: 15 // Max time
      };
      return;
    }
    
    // Check if the answer is correct
    const isCorrect = playerAnswer.answer === correctAnswer;
    
    // Update the player's answer
    playerAnswer.isCorrect = isCorrect;
    
    // Update score if correct
    if (isCorrect) {
      // Score formula: max 1000 points, decreases with response time
      // A 1-second response = 1000 points, 15-second response = 100 points
      const timeBonus = Math.max(0, 15 - playerAnswer.responseTime);
      const score = 100 + Math.round(timeBonus * 60);
      player.score += score;
    }
  });
  
  // Send feedback to each player
  game.players.forEach(player => {
    const playerAnswer = player.answers[game.currentQuestion] || { answer: null, isCorrect: false, responseTime: 15 };
    
    player.ws.send(JSON.stringify({
      type: 'answer_feedback',
      questionNumber: game.currentQuestion + 1,
      correctAnswer,
      playerAnswer: playerAnswer.answer,
      isCorrect: playerAnswer.isCorrect,
      responseTime: playerAnswer.responseTime
    }));
  });
  
  // Send updated scores
  sendScoreUpdate(gameId);
  
  // Move to the next question
  game.currentQuestion++;
  activeGames.set(gameId, game);
  
  // Wait a moment before sending the next question
  setTimeout(() => {
    sendQuestion(gameId);
  }, 2000);
}

// Send score update to both players
function sendScoreUpdate(gameId) {
  const game = activeGames.get(gameId);
  if (!game) return;
  
  const scores = {
    [game.players[0].userId]: game.players[0].score,
    [game.players[1].userId]: game.players[1].score
  };
  
  game.players.forEach(player => {
    const opponentId = game.players.find(p => p.userId !== player.userId).userId;
    
    player.ws.send(JSON.stringify({
      type: 'update_scores',
      scores: {
        player: scores[player.userId],
        opponent: scores[opponentId]
      }
    }));
  });
}

// Handle answer submission from a player
function handleAnswerSubmission(ws, clientInfo, message) {
  if (!clientInfo.inGame || !clientInfo.gameId) {
    sendErrorMessage(ws, 'You are not in a game');
    return;
  }
  
  const gameId = clientInfo.gameId;
  
  // Check if it's a single player game
  if (gameId.startsWith('single_')) {
    handleSinglePlayerAnswerSubmission(ws, clientInfo, message);
    return;
  }
  
  // Handle multiplayer game
  const game = activeGames.get(gameId);
  
  if (!game || game.status !== 'playing') {
    sendErrorMessage(ws, 'Game not found or not in playing state');
    return;
  }
  
  const player = game.players.find(p => p.userId === clientInfo.userId);
  if (!player) {
    sendErrorMessage(ws, 'Player not found in game');
    return;
  }
  
  // Record the player's answer
  player.answers[game.currentQuestion] = {
    answer: message.answer,
    isCorrect: null, // Will be determined when processing
    responseTime: message.responseTime || 0
  };
  
  console.log(`Player ${player.username} submitted answer ${message.answer} for question ${game.currentQuestion + 1}`);
  
  // Check if both players have answered
  const allAnswered = game.players.every(p => p.answers[game.currentQuestion]);
  
  if (allAnswered) {
    // If both players answered, process the answers immediately
    clearTimeout(game.questionTimer);
    processAnswers(gameId);
  }
}

// Handle player disconnect during a game
function handlePlayerDisconnect(clientInfo, gameId) {
  const game = activeGames.get(gameId);
  if (!game) return;
  
  console.log(`Player ${clientInfo.username} disconnected from game ${gameId}`);
  
  // Find the opponent
  const opponent = game.players.find(p => p.userId !== clientInfo.userId);
  if (!opponent) {
    // No opponent found, remove the game
    activeGames.delete(gameId);
    return;
  }
  
  // Notify the opponent
  opponent.ws.send(JSON.stringify({
    type: 'game_error',
    message: 'Your opponent has disconnected from the game'
  }));
  
  // End the game
  endGame(gameId, clientInfo.userId);
}

// End a game
function endGame(gameId, disconnectedPlayerId = null) {
  const game = activeGames.get(gameId);
  if (!game) return;
  
  console.log(`Ending game ${gameId}`);
  
  // Update game status
  game.status = 'ended';
  game.endTime = Date.now();
  
  // Determine the winner
  let winner = null;
  if (disconnectedPlayerId) {
    // If a player disconnected, the other player wins
    winner = game.players.find(p => p.userId !== disconnectedPlayerId);
  } else {
    // Compare scores
    if (game.players[0].score > game.players[1].score) {
      winner = game.players[0];
    } else if (game.players[1].score > game.players[0].score) {
      winner = game.players[1];
    }
    // If scores are equal, it's a tie (winner remains null)
  }
  
  // Prepare results for each player
  game.players.forEach(player => {
    const opponent = game.players.find(p => p.userId !== player.userId);
    
    // Calculate stats
    const correctAnswers = player.answers.filter(a => a && a.isCorrect).length;
    const totalQuestions = game.questions.length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    // Calculate avg response time
    const responseTimesSum = player.answers.reduce((sum, a) => sum + (a ? a.responseTime : 15), 0);
    const avgResponseTime = player.answers.length > 0 ? responseTimesSum / player.answers.length : 0;
    
    // Determine winner status
    let winnerStatus = 'tie';
    if (winner) {
      winnerStatus = winner.userId === player.userId ? 'player' : 'opponent';
    }
    
    // Calculate rewards
    let tokenReward = 10; // Base token reward
    let xpReward = 50; // Base XP reward
    
    if (winnerStatus === 'player') {
      tokenReward += 15; // Winner bonus
      xpReward += 50; // Winner bonus
    }
    
    // Add accuracy bonus
    tokenReward += Math.floor(accuracy / 20); // Up to 5 bonus tokens for 100% accuracy
    xpReward += Math.floor(accuracy / 10); // Up to 10 bonus XP for 100% accuracy
    
    // Send results to player
    player.ws.send(JSON.stringify({
      type: 'game_end',
      results: {
        winner: winnerStatus,
        scores: {
          player: player.score,
          opponent: opponent.score
        },
        opponentName: opponent.username,
        stats: {
          correctAnswers,
          totalQuestions,
          accuracy,
          avgResponseTime
        },
        rewards: {
          tokens: tokenReward,
          xp: xpReward
        }
      }
    }));
    
    // Update client info
    const playerWs = Array.from(clients.entries()).find(([_, client]) => client.userId === player.userId);
    if (playerWs) {
      const [ws, clientInfo] = playerWs;
      clientInfo.inGame = false;
      clientInfo.gameId = null;
      clients.set(ws, clientInfo);
    }
    
    // Award tokens and XP to the player's account
    awardGameRewards(player.userId, tokenReward, xpReward, winnerStatus !== 'opponent');
  });
  
  // Remove game from active games
  activeGames.delete(gameId);
}

// Handle single player game against a bot
function handleSinglePlayerGame(ws, clientInfo) {
  if (!clientInfo.isAuthenticated) {
    sendErrorMessage(ws, 'You must be authenticated to play a game');
    return;
  }
  
  if (clientInfo.inGame) {
    sendErrorMessage(ws, 'You are already in a game');
    return;
  }
  
  if (clientInfo.inMatchmaking) {
    // If the user is in matchmaking, remove them from the queue
    cancelMatchmaking(ws, clientInfo);
  }
  
  // Create a game ID
  const gameId = `single_${Date.now()}`;
  
  // Generate a random bot name
  const botNames = [
    'MindBot', 'QuizMaster', 'BrainiacBot', 'GeniusAI', 'WizBot',
    'SmartBrain', 'ThinkTank', 'KnowledgeKeeper', 'QuizWhiz', 'MasterMind'
  ];
  const botName = `${botNames[Math.floor(Math.random() * botNames.length)]}#${Math.floor(Math.random() * 1000)}`;
  const botId = `bot_${Date.now()}`;
  
  console.log(`Creating single player game ${gameId} for ${clientInfo.username} against bot ${botName}`);
  
  // Update client info
  clientInfo.inGame = true;
  clientInfo.gameId = gameId;
  clients.set(ws, clientInfo);
  
  // Prepare questions
  const questions = getRandomQuestions(5);
  
  // Create game state
  const gameState = {
    id: gameId,
    isSinglePlayer: true,
    players: [
      {
        ws: ws,
        userId: clientInfo.userId,
        username: clientInfo.username,
        score: 0,
        answers: [],
        ready: false,
        isBot: false
      },
      {
        userId: botId,
        username: botName,
        score: 0,
        answers: [],
        ready: false,
        isBot: true
      }
    ],
    questions,
    currentQuestion: 0,
    status: 'preparing',
    startTime: null,
    endTime: null
  };
  
  // Store game state
  singlePlayerGames.set(gameId, gameState);
  
  // Notify the player
  ws.send(JSON.stringify({
    type: 'match_found',
    opponent: {
      userId: botId,
      username: botName,
      isBot: true
    },
    isSinglePlayer: true
  }));
  
  // Start game after 3 seconds
  setTimeout(() => startSinglePlayerGame(gameId), 3000);
}

// Start a single player game
function startSinglePlayerGame(gameId) {
  const game = singlePlayerGames.get(gameId);
  if (!game) return;
  
  console.log(`Starting single player game ${gameId}`);
  
  // Update game status
  game.status = 'playing';
  game.startTime = Date.now();
  
  // Store updated game state
  singlePlayerGames.set(gameId, game);
  
  // Notify player
  const player = game.players[0]; // The human player
  player.ws.send(JSON.stringify({
    type: 'game_start',
    isSinglePlayer: true
  }));
  
  // Send first question
  sendSinglePlayerQuestion(gameId);
}

// Send a question in a single player game
function sendSinglePlayerQuestion(gameId) {
  const game = singlePlayerGames.get(gameId);
  if (!game || game.status !== 'playing') return;
  
  if (game.currentQuestion >= game.questions.length) {
    // All questions have been answered, end the game
    endSinglePlayerGame(gameId);
    return;
  }
  
  const questionData = game.questions[game.currentQuestion];
  
  console.log(`Sending question ${game.currentQuestion + 1} to single player game ${gameId}`);
  
  // Prepare question data to send
  const questionToSend = {
    type: 'question',
    questionNumber: game.currentQuestion + 1,
    totalQuestions: game.questions.length,
    question: questionData.question,
    answers: questionData.answers,
    timeLimit: 15, // 15 seconds per question
    isSinglePlayer: true
  };
  
  // Send to the player
  const player = game.players[0]; // The human player
  player.ws.send(JSON.stringify(questionToSend));
  
  // Make the bot "think" about the answer
  const botThinkingTime = Math.random() * 12 + 1; // 1-13 seconds
  
  // Bot will submit an answer after its thinking time
  setTimeout(() => {
    // 70% chance the bot will get the correct answer
    const correctProbability = 0.7;
    let botAnswer;
    
    if (Math.random() < correctProbability) {
      // Bot gets it right
      botAnswer = questionData.correctAnswer;
    } else {
      // Bot gets it wrong - choose a random incorrect answer
      const incorrectAnswers = questionData.answers
        .map((_, index) => index)
        .filter(index => index !== questionData.correctAnswer);
      botAnswer = incorrectAnswers[Math.floor(Math.random() * incorrectAnswers.length)];
    }
    
    // Record the bot's answer
    const bot = game.players[1]; // The bot
    bot.answers[game.currentQuestion] = {
      answer: botAnswer,
      isCorrect: botAnswer === questionData.correctAnswer,
      responseTime: botThinkingTime
    };
    
    // Update the game state
    singlePlayerGames.set(gameId, game);
  }, botThinkingTime * 1000);
  
  // Set a timer to move to the next question
  game.questionTimer = setTimeout(() => {
    processSinglePlayerAnswers(gameId);
  }, 16000); // 15 seconds + 1 second buffer
}

// Process answers for the current question in a single player game
function processSinglePlayerAnswers(gameId) {
  const game = singlePlayerGames.get(gameId);
  if (!game || game.status !== 'playing') return;
  
  console.log(`Processing answers for question ${game.currentQuestion + 1} in single player game ${gameId}`);
  
  const question = game.questions[game.currentQuestion];
  const correctAnswer = question.correctAnswer;
  
  // Process the player's answer
  const player = game.players[0]; // The human player
  const bot = game.players[1]; // The bot
  
  // Get the player's answer for this question
  const playerAnswer = player.answers[game.currentQuestion];
  
  // If the player didn't answer, count as incorrect
  if (!playerAnswer) {
    player.answers[game.currentQuestion] = {
      answer: null,
      isCorrect: false,
      responseTime: 15 // Max time
    };
  } else {
    // Check if the answer is correct
    const isCorrect = playerAnswer.answer === correctAnswer;
    
    // Update the player's answer
    playerAnswer.isCorrect = isCorrect;
    
    // Update score if correct
    if (isCorrect) {
      // Score formula: max 1000 points, decreases with response time
      // A 1-second response = 1000 points, 15-second response = 100 points
      const timeBonus = Math.max(0, 15 - playerAnswer.responseTime);
      const score = 100 + Math.round(timeBonus * 60);
      player.score += score;
    }
  }
  
  // Update bot's score if correct
  const botAnswer = bot.answers[game.currentQuestion];
  if (botAnswer && botAnswer.isCorrect) {
    const timeBonus = Math.max(0, 15 - botAnswer.responseTime);
    const score = 100 + Math.round(timeBonus * 60);
    bot.score += score;
  }
  
  // Send feedback to the player
  const playerAnswerObj = player.answers[game.currentQuestion];
  
  player.ws.send(JSON.stringify({
    type: 'answer_feedback',
    questionNumber: game.currentQuestion + 1,
    correctAnswer,
    playerAnswer: playerAnswerObj.answer,
    isCorrect: playerAnswerObj.isCorrect,
    responseTime: playerAnswerObj.responseTime,
    isSinglePlayer: true,
    botAnswer: botAnswer ? botAnswer.answer : null,
    botCorrect: botAnswer ? botAnswer.isCorrect : false,
    botResponseTime: botAnswer ? botAnswer.responseTime : 15
  }));
  
  // Send updated scores
  sendSinglePlayerScoreUpdate(gameId);
  
  // Move to the next question
  game.currentQuestion++;
  singlePlayerGames.set(gameId, game);
  
  // Wait a moment before sending the next question
  setTimeout(() => {
    sendSinglePlayerQuestion(gameId);
  }, 2000);
}

// Send score update in a single player game
function sendSinglePlayerScoreUpdate(gameId) {
  const game = singlePlayerGames.get(gameId);
  if (!game) return;
  
  const player = game.players[0]; // The human player
  const bot = game.players[1]; // The bot
  
  player.ws.send(JSON.stringify({
    type: 'update_scores',
    scores: {
      player: player.score,
      opponent: bot.score
    },
    isSinglePlayer: true
  }));
}

// End a single player game
function endSinglePlayerGame(gameId) {
  const game = singlePlayerGames.get(gameId);
  if (!game) return;
  
  console.log(`Ending single player game ${gameId}`);
  
  // Update game status
  game.status = 'ended';
  game.endTime = Date.now();
  
  // Clear any timers
  if (game.questionTimer) {
    clearTimeout(game.questionTimer);
  }
  
  // Calculate final results
  const player = game.players[0]; // The human player
  const bot = game.players[1]; // The bot
  
  const playerScore = player.score;
  const botScore = bot.score;
  
  const isWinner = playerScore > botScore;
  const isDraw = playerScore === botScore;
  
  // Calculate token rewards
  let tokenReward = 5; // Base reward
  
  if (isWinner) {
    tokenReward += 10; // Bonus for winning
  }
  
  // Calculate XP rewards
  let xpReward = 20; // Base XP
  
  if (isWinner) {
    xpReward += 30; // Bonus XP for winning
  }
  
  // Award rewards to the player
  awardGameRewards(player.userId, tokenReward, xpReward, isWinner);
  
  // Send results to the player
  player.ws.send(JSON.stringify({
    type: 'game_over',
    results: {
      playerScore,
      opponentScore: botScore,
      isWinner,
      isDraw,
      rewards: {
        tokens: tokenReward,
        xp: xpReward
      }
    },
    isSinglePlayer: true
  }));
  
  // Update client info
  const clientEntry = Array.from(clients.entries()).find(([_, client]) => client.userId === player.userId);
  if (clientEntry) {
    const [ws, clientInfo] = clientEntry;
    clientInfo.inGame = false;
    clientInfo.gameId = null;
    clients.set(ws, clientInfo);
  }
  
  // Remove the game after a delay
  setTimeout(() => {
    singlePlayerGames.delete(gameId);
  }, 60000); // Keep the game data for 1 minute for stats
}

// Handle single player answer submission
function handleSinglePlayerAnswerSubmission(ws, clientInfo, message) {
  if (!clientInfo.inGame || !clientInfo.gameId) {
    sendErrorMessage(ws, 'You are not in a game');
    return;
  }
  
  const gameId = clientInfo.gameId;
  const game = singlePlayerGames.get(gameId);
  
  if (!game || game.status !== 'playing') {
    sendErrorMessage(ws, 'Game not found or not in playing state');
    return;
  }
  
  const player = game.players[0]; // In single player, human is always at index 0
  if (player.userId !== clientInfo.userId) {
    sendErrorMessage(ws, 'Player not found in game');
    return;
  }
  
  // Record the player's answer
  player.answers[game.currentQuestion] = {
    answer: message.answer,
    isCorrect: null, // Will be set when answers are processed
    responseTime: message.responseTime || 1
  };
  
  // Update the game state
  singlePlayerGames.set(gameId, game);
  
  console.log(`Received answer from ${player.username} for question ${game.currentQuestion + 1} in single player game ${gameId}`);
}

// Award tokens and Battle Pass XP to a player
function awardGameRewards(userId, tokens, xp, isWinner) {
  // Add tokens
  addTokens(userId, tokens);
  
  // Add Battle Pass XP
  const source = isWinner ? 'game_win' : 'game_participation';
  addBattlePassXP(userId, xp, source);
}

// Send error message to a client
function sendErrorMessage(ws, message) {
  ws.send(JSON.stringify({
    type: 'game_error',
    message
  }));
}

// Broadcast a message to all authenticated clients
function broadcastMessage(message) {
  clients.forEach((clientInfo, ws) => {
    if (clientInfo.isAuthenticated && ws.readyState === 1) { // 1 = WebSocket.OPEN
      ws.send(JSON.stringify(message));
    }
  });
}

// Get random questions for a game
function getRandomQuestions(count = 5) {
  const allQuestions = [
    {
      question: "What is the capital of France?",
      answers: ["Berlin", "Madrid", "Paris", "Rome"],
      correctAnswer: 2
    },
    {
      question: "Which planet is known as the Red Planet?",
      answers: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1
    },
    {
      question: "Who painted the Mona Lisa?",
      answers: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso", "Michelangelo"],
      correctAnswer: 1
    },
    {
      question: "What is the largest ocean on Earth?",
      answers: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      correctAnswer: 3
    },
    {
      question: "What is the chemical symbol for gold?",
      answers: ["Ag", "Au", "Fe", "Cu"],
      correctAnswer: 1
    },
    {
      question: "Which of these elements is a noble gas?",
      answers: ["Helium", "Hydrogen", "Oxygen", "Lithium"],
      correctAnswer: 0
    },
    {
      question: "In what year did the first manned moon landing occur?",
      answers: ["1965", "1969", "1973", "1981"],
      correctAnswer: 1
    },
    {
      question: "Which of the following is not a programming language?",
      answers: ["Python", "Java", "Docker", "Ruby"],
      correctAnswer: 2
    },
    {
      question: "What is the largest mammal on Earth?",
      answers: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
      correctAnswer: 1
    },
    {
      question: "Who wrote the theory of relativity?",
      answers: ["Isaac Newton", "Niels Bohr", "Albert Einstein", "Stephen Hawking"],
      correctAnswer: 2
    },
    {
      question: "What is the smallest prime number?",
      answers: ["0", "1", "2", "3"],
      correctAnswer: 2
    },
    {
      question: "Which country has the largest population in the world?",
      answers: ["India", "United States", "China", "Russia"],
      correctAnswer: 2
    },
    {
      question: "What is the main component of the Sun?",
      answers: ["Liquid Lava", "Molten Iron", "Hydrogen Gas", "Solid Rock"],
      correctAnswer: 2
    },
    {
      question: "Who discovered penicillin?",
      answers: ["Alexander Fleming", "Marie Curie", "Louis Pasteur", "Joseph Lister"],
      correctAnswer: 0
    },
    {
      question: "Which of these is not a primary color in painting?",
      answers: ["Red", "Blue", "Yellow", "Green"],
      correctAnswer: 3
    }
  ];
  
  // Shuffle the questions
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  
  // Return the requested number of questions
  return shuffled.slice(0, count);
}

// Run matchmaking finder every 5 seconds
setInterval(findMatches, 5000);

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project'}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project'}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID || 'demo-app-id'
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Flutterwave
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLUTTERWAVE_SECRET_KEY';
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || 'FLUTTERWAVE_PUBLIC_KEY';
const FLUTTERWAVE_API_URL = 'https://api.flutterwave.com/v3';

// Serve static files (if needed later)
// app.use(express.static(path.join(__dirname, 'public')));

// Landing page route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MindArena</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #2D3436 0%, #000000 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .logo {
          width: 120px;
          height: 120px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        .logo:hover {
          transform: scale(1.05);
        }
        .logo svg {
          width: 60px;
          height: 60px;
          fill: white;
        }
        h1 {
          font-size: 32px;
          margin: 0 0 8px 0;
        }
        p {
          font-size: 16px;
          color: #B2BEC3;
          margin: 0 0 32px 0;
          max-width: 500px;
        }
        .auth-buttons {
          display: flex;
          gap: 16px;
          margin-top: 32px;
        }
        .button {
          display: inline-block;
          background-color: #6C5CE7;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        .button:hover {
          background-color: #5541c7;
          transform: translateY(-2px);
        }
        .button.outline {
          background-color: transparent;
          border: 2px solid #6C5CE7;
        }
        .button.outline:hover {
          background-color: rgba(108, 92, 231, 0.1);
        }
      </style>
      <!-- Firebase App (the core Firebase SDK) -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
      <!-- Firebase Auth -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
    </head>
    <body>
      <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
        </svg>
      </div>
      <h1>MindArena</h1>
      <p>Where Fast Minds Become Champions</p>
      
      <div class="auth-buttons">
        <a href="/login" class="button">LOGIN</a>
        <a href="/register" class="button outline">REGISTER</a>
      </div>
      
      <script>
        // Initialize Firebase
        const firebaseConfig = {
          apiKey: '${process.env.VITE_FIREBASE_API_KEY || "demo-api-key"}',
          authDomain: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com',
          projectId: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}',
          storageBucket: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.appspot.com',
          appId: '${process.env.VITE_FIREBASE_APP_ID || "demo-app-id"}'
        };
        
        firebase.initializeApp(firebaseConfig);
        
        // Check if user is already signed in
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in, redirect to dashboard
            window.location.href = '/dashboard';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Login route
app.get('/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login - MindArena</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #2D3436 0%, #000000 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .login-container {
          background-color: rgba(0, 0, 0, 0.4);
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        h1 {
          text-align: center;
          margin-bottom: 24px;
        }
        input {
          width: 100%;
          padding: 12px;
          margin: 8px 0 16px;
          border-radius: 8px;
          border: 2px solid #444;
          background-color: #333;
          color: white;
          font-size: 16px;
          box-sizing: border-box;
        }
        input:focus {
          border-color: #6C5CE7;
          outline: none;
        }
        .button {
          display: inline-block;
          background-color: #6C5CE7;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          width: 100%;
          margin-top: 16px;
        }
        .button:hover {
          background-color: #5541c7;
          transform: translateY(-2px);
        }
        .error-message {
          background-color: rgba(255, 0, 0, 0.1);
          color: #ff5252;
          padding: 10px;
          border-radius: 4px;
          margin: 16px 0;
          border-left: 4px solid #ff5252;
          display: none;
        }
        .success-message {
          background-color: rgba(0, 255, 0, 0.1);
          color: #4caf50;
          padding: 10px;
          border-radius: 4px;
          margin: 16px 0;
          border-left: 4px solid #4caf50;
          display: none;
        }
        .alternative {
          text-align: center;
          margin-top: 16px;
        }
        .alternative a {
          color: #6C5CE7;
          text-decoration: none;
        }
        .alternative a:hover {
          text-decoration: underline;
        }
      </style>
      <!-- Firebase App (the core Firebase SDK) -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
      <!-- Firebase Auth -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
    </head>
    <body>
      <div class="login-container">
        <h1>MindArena Login</h1>
        
        <div id="errorMessage" class="error-message"></div>
        <div id="successMessage" class="success-message"></div>
        
        <form id="loginForm">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="Enter your email" required>
          
          <label for="password">Password</label>
          <input type="password" id="password" placeholder="Enter your password" required>
          
          <button type="button" onclick="handleLogin()" class="button">LOGIN</button>
        </form>
        
        <div class="alternative">
          Don't have an account? <a href="/register">Register</a>
        </div>
      </div>
      
      <script>
        // Initialize Firebase
        const firebaseConfig = {
          apiKey: '${process.env.VITE_FIREBASE_API_KEY || "demo-api-key"}',
          authDomain: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com',
          projectId: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}',
          storageBucket: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.appspot.com',
          appId: '${process.env.VITE_FIREBASE_APP_ID || "demo-app-id"}'
        };
        
        firebase.initializeApp(firebaseConfig);
        
        // Check if user is already signed in
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in, redirect to dashboard
            window.location.href = '/dashboard';
          }
        });
        
        // Show error message
        function showError(message) {
          const errorElement = document.getElementById('errorMessage');
          errorElement.textContent = message;
          errorElement.style.display = 'block';
        }
        
        // Show success message
        function showSuccess(message) {
          const successElement = document.getElementById('successMessage');
          successElement.textContent = message;
          successElement.style.display = 'block';
        }
        
        // Handle login
        function handleLogin() {
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          if (!email || !password) {
            showError('Please enter both email and password.');
            return;
          }
          
          const loginButton = document.querySelector('.button');
          const originalText = loginButton.textContent;
          loginButton.textContent = 'Logging in...';
          loginButton.disabled = true;
          
          firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
              // Signed in
              const user = userCredential.user;
              showSuccess('Login successful! Redirecting...');
              
              // Redirect to dashboard
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1500);
            })
            .catch((error) => {
              loginButton.textContent = originalText;
              loginButton.disabled = false;
              
              const errorCode = error.code;
              const errorMessage = error.message;
              
              if (errorCode === 'auth/user-not-found') {
                showError('No user found with this email address.');
              } else if (errorCode === 'auth/wrong-password') {
                showError('Incorrect password. Please try again.');
              } else {
                showError('Login failed: ' + errorMessage);
              }
            });
        }
      </script>
    </body>
    </html>
  `);
});

// Register route
app.get('/register', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Register - MindArena</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #2D3436 0%, #000000 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .register-container {
          background-color: rgba(0, 0, 0, 0.4);
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        h1 {
          text-align: center;
          margin-bottom: 24px;
        }
        input {
          width: 100%;
          padding: 12px;
          margin: 8px 0 16px;
          border-radius: 8px;
          border: 2px solid #444;
          background-color: #333;
          color: white;
          font-size: 16px;
          box-sizing: border-box;
        }
        input:focus {
          border-color: #6C5CE7;
          outline: none;
        }
        .button {
          display: inline-block;
          background-color: #6C5CE7;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          width: 100%;
          margin-top: 16px;
        }
        .button:hover {
          background-color: #5541c7;
          transform: translateY(-2px);
        }
        .error-message {
          background-color: rgba(255, 0, 0, 0.1);
          color: #ff5252;
          padding: 10px;
          border-radius: 4px;
          margin: 16px 0;
          border-left: 4px solid #ff5252;
          display: none;
        }
        .success-message {
          background-color: rgba(0, 255, 0, 0.1);
          color: #4caf50;
          padding: 10px;
          border-radius: 4px;
          margin: 16px 0;
          border-left: 4px solid #4caf50;
          display: none;
        }
        .alternative {
          text-align: center;
          margin-top: 16px;
        }
        .alternative a {
          color: #6C5CE7;
          text-decoration: none;
        }
        .alternative a:hover {
          text-decoration: underline;
        }
      </style>
      <!-- Firebase App (the core Firebase SDK) -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
      <!-- Firebase Auth -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
    </head>
    <body>
      <div class="register-container">
        <h1>Create Account</h1>
        
        <div id="errorMessage" class="error-message"></div>
        <div id="successMessage" class="success-message"></div>
        
        <form id="registerForm">
          <label for="username">Username</label>
          <input type="text" id="username" placeholder="Choose a username" required>
          
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="Enter your email" required>
          
          <label for="password">Password</label>
          <input type="password" id="password" placeholder="Create a password" required>
          
          <label for="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" placeholder="Confirm your password" required>
          
          <button type="button" onclick="handleRegister()" class="button">REGISTER</button>
        </form>
        
        <div class="alternative">
          Already have an account? <a href="/login">Login</a>
        </div>
      </div>
      
      <script>
        // Initialize Firebase
        const firebaseConfig = {
          apiKey: '${process.env.VITE_FIREBASE_API_KEY || "demo-api-key"}',
          authDomain: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com',
          projectId: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}',
          storageBucket: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.appspot.com',
          appId: '${process.env.VITE_FIREBASE_APP_ID || "demo-app-id"}'
        };
        
        firebase.initializeApp(firebaseConfig);
        
        // Check if user is already signed in
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in, redirect to dashboard
            window.location.href = '/dashboard';
          }
        });
        
        // Show error message
        function showError(message) {
          const errorElement = document.getElementById('errorMessage');
          errorElement.textContent = message;
          errorElement.style.display = 'block';
        }
        
        // Show success message
        function showSuccess(message) {
          const successElement = document.getElementById('successMessage');
          successElement.textContent = message;
          successElement.style.display = 'block';
        }
        
        // Handle registration
        function handleRegister() {
          const username = document.getElementById('username').value;
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          
          // Basic validation
          if (!username) {
            showError('Please enter a username.');
            return;
          }
          
          if (!email) {
            showError('Please enter an email address.');
            return;
          }
          
          if (!password) {
            showError('Please enter a password.');
            return;
          }
          
          if (password.length < 6) {
            showError('Password must be at least 6 characters long.');
            return;
          }
          
          if (password !== confirmPassword) {
            showError('Passwords do not match.');
            return;
          }
          
          // Inform user about Firebase domain setup requirement
          showError('To enable registration, please add your Replit domain to Firebase authorized domains list in the Firebase Console under Authentication → Settings → Authorized domains');
          
          const registerButton = document.querySelector('.button');
          const originalText = registerButton.textContent;
          registerButton.textContent = 'Creating account...';
          registerButton.disabled = true;
          
          firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
              // Signed in 
              const user = userCredential.user;
              
              // Set display name
              return user.updateProfile({
                displayName: username
              }).then(() => {
                showSuccess('Account created successfully! Redirecting...');
                
                // Redirect to dashboard
                setTimeout(() => {
                  window.location.href = '/dashboard';
                }, 1500);
              });
            })
            .catch((error) => {
              registerButton.textContent = originalText;
              registerButton.disabled = false;
              
              const errorCode = error.code;
              const errorMessage = error.message;
              
              if (errorCode === 'auth/email-already-in-use') {
                showError('This email address is already in use.');
              } else if (errorCode === 'auth/invalid-email') {
                showError('Please enter a valid email address.');
              } else if (errorCode === 'auth/weak-password') {
                showError('Please choose a stronger password.');
              } else {
                showError('Registration failed: ' + errorMessage);
              }
            });
        }
      </script>
    </body>
    </html>
  `);
});

// Tournaments page route
app.get('/cosmetics', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cosmetics - MindArena</title>
      <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
      <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
      <style>
        /* General styles */
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #2D3436 0%, #000000 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        a {
          text-decoration: none;
          color: inherit;
        }
        .container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .content {
          flex: 1;
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        .button {
          display: inline-block;
          background-color: #6C5CE7;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        .button:hover {
          background-color: #5A49DB;
          transform: translateY(-2px);
        }
        .button:disabled {
          background-color: #6C5CE7;
          opacity: 0.5;
          cursor: not-allowed;
        }
        .button-secondary {
          background-color: transparent;
          border: 1px solid #6C5CE7;
        }
        .button-secondary:hover {
          background-color: rgba(108, 92, 231, 0.1);
        }
        .button-success {
          background-color: #00b894;
        }
        .button-success:hover {
          background-color: #00a584;
        }
        
        /* Nav bar styles */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          background-color: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: white;
          display: flex;
          align-items: center;
        }
        .logo-icon {
          width: 36px;
          height: 36px;
          background-color: #6C5CE7;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
        }
        .nav-links {
          display: flex;
          gap: 16px;
        }
        .nav-link {
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .nav-link.active {
          background-color: rgba(108, 92, 231, 0.2);
          color: #6C5CE7;
        }
        .profile-menu {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .profile-avatar {
          width: 40px;
          height: 40px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .profile-name {
          font-weight: bold;
        }
        .logout-button {
          padding: 8px 16px;
          font-size: 14px;
        }

        /* Cosmetics page specific styles */
        .cosmetics-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }
        .page-title {
          margin: 0 0 8px 0;
          font-size: 32px;
        }
        .page-description {
          color: #B2BEC3;
          max-width: 600px;
          line-height: 1.5;
        }
        .token-balance {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding: 16px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .token-icon {
          display: flex;
          margin-right: 16px;
        }
        .token-details {
          flex: 1;
        }
        .token-balance-text {
          color: #B2BEC3;
          margin-bottom: 4px;
        }
        .token-amount {
          font-size: 24px;
          font-weight: bold;
        }
        .action-buttons {
          display: flex;
          gap: 16px;
        }
        
        /* Profile Preview section */
        .profile-preview {
          padding: 32px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .profile-preview-title {
          font-size: 20px;
          margin: 0 0 24px 0;
        }
        .preview-avatar-section {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto;
        }
        .preview-frame {
          position: absolute;
          top: -10px;
          left: -10px;
          width: 220px;
          height: 220px;
          z-index: 1;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
        }
        .preview-avatar {
          position: relative;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          overflow: hidden;
          z-index: 2;
          background-color: rgba(108, 92, 231, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60px;
          background-size: cover;
          background-position: center;
        }
        .preview-effect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 3;
          pointer-events: none;
          opacity: 0.7;
          background-size: contain;
          background-position: center;
        }
        .preview-title {
          margin-top: 16px;
          text-align: center;
          font-weight: bold;
          font-size: 24px;
          color: #6C5CE7;
        }
        
        /* Cosmetics sections */
        .cosmetics-nav {
          display: flex;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .cosmetics-nav-item {
          padding: 12px 24px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
        }
        .cosmetics-nav-item:hover {
          background-color: rgba(108, 92, 231, 0.1);
        }
        .cosmetics-nav-item.active {
          border-bottom: 2px solid #6C5CE7;
          color: #6C5CE7;
        }
        
        /* Cosmetics grids */
        .cosmetics-section {
          margin-bottom: 32px;
        }
        .cosmetics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .section-title {
          font-size: 24px;
          margin: 0 0 16px 0;
        }
        .cosmetic-card {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          position: relative;
        }
        .cosmetic-card:hover {
          transform: translateY(-2px);
          border-color: rgba(108, 92, 231, 0.5);
        }
        .cosmetic-card.equipped {
          border-color: #6C5CE7;
          background-color: rgba(108, 92, 231, 0.1);
        }
        .cosmetic-card.equipped:after {
          content: 'Equipped';
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 12px;
          font-weight: bold;
          color: white;
          background-color: #6C5CE7;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .cosmetic-image {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          border-radius: 8px;
          background-color: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cosmetic-image img {
          max-width: 100%;
          max-height: 100%;
        }
        .cosmetic-rarity {
          position: absolute;
          top: 8px;
          left: 8px;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: capitalize;
        }
        .rarity-common {
          background-color: #7f8c8d;
        }
        .rarity-uncommon {
          background-color: #2ecc71;
        }
        .rarity-rare {
          background-color: #3498db;
        }
        .rarity-epic {
          background-color: #9b59b6;
        }
        .rarity-legendary {
          background-color: #f1c40f;
          color: #2c3e50;
        }
        .cosmetic-name {
          font-weight: bold;
          margin-bottom: 4px;
          font-size: 16px;
        }
        .cosmetic-description {
          color: #B2BEC3;
          font-size: 14px;
          margin-bottom: 16px;
          height: 40px;
          overflow: hidden;
        }
        .cosmetic-price {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: bold;
          margin-bottom: 16px;
        }
        .cosmetic-price-icon {
          width: 16px;
          height: 16px;
          fill: #f1c40f;
        }
        .cosmetic-actions {
          display: flex;
          gap: 8px;
        }
        .cosmetic-button {
          flex: 1;
          padding: 8px;
          font-size: 14px;
        }
        
        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 32px;
        }
        .empty-state svg {
          width: 64px;
          height: 64px;
          margin-bottom: 16px;
          fill: #B2BEC3;
        }
        .empty-state-title {
          font-size: 20px;
          margin-bottom: 8px;
        }
        .empty-state-description {
          color: #B2BEC3;
          margin-bottom: 24px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        
        /* Toast notification */
        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 16px;
          background-color: #2D3436;
          border-left: 4px solid #6C5CE7;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          min-width: 300px;
          transform: translateY(100px);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          z-index: 1000;
        }
        .toast.show {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
        }
        .toast-success {
          border-color: #00b894;
        }
        .toast-error {
          border-color: #d63031;
        }
        .toast-icon {
          margin-right: 12px;
          width: 24px;
          height: 24px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toast-success .toast-icon {
          background-color: #00b894;
        }
        .toast-error .toast-icon {
          background-color: #d63031;
        }
        .toast-message {
          flex: 1;
        }
        .toast-close {
          background: none;
          border: none;
          color: #B2BEC3;
          cursor: pointer;
          font-size: 16px;
          margin-left: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="navbar">
          <a href="/" class="logo">
            <div class="logo-icon">M</div>
            MindArena
          </a>
          
          <div class="nav-links">
            <a href="/dashboard" class="nav-link">Dashboard</a>
            <a href="#" class="nav-link">Play Now</a>
            <a href="/tournaments" class="nav-link">Tournaments</a>
            <a href="/battle-pass" class="nav-link">Battle Pass</a>
            <a href="/cosmetics" class="nav-link active">Cosmetics</a>
            <a href="#" class="nav-link">Leaderboard</a>
          </div>
          
          <div class="profile-menu">
            <div class="profile-avatar" id="profileInitial" onclick="toggleProfileDropdown()">?</div>
            <div class="profile-dropdown" id="profileDropdown">
              <div class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <span id="profileName">...</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" onclick="window.location.href='/account'">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                Account Settings
              </div>
              <div class="dropdown-item" onclick="handleLogout()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                Logout
              </div>
            </div>
          </div>
        </div>
        
        <div class="content">
          <div class="cosmetics-header">
            <div>
              <h1 class="page-title">Cosmetics</h1>
              <p class="page-description">Customize your profile with unique avatars, frames, and special effects. Unlock cosmetics through the Battle Pass or purchase them with tokens.</p>
            </div>
            
            <div class="token-balance">
              <div class="token-info">
                <div class="token-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                    <path d="M0 0h24v24H0V0z" fill="none"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                  </svg>
                </div>
                <div class="token-details">
                  <div class="token-balance-text">Your Token Balance</div>
                  <div class="token-amount" id="tokenBalance">0</div>
                </div>
              </div>
              <div class="action-buttons">
                <button class="button" onclick="addTokens()">Add Tokens</button>
              </div>
            </div>
          </div>
          
          <div class="profile-preview">
            <h2 class="profile-preview-title">Your Profile Preview</h2>
            <div class="preview-avatar-section">
              <div class="preview-frame" id="previewFrame"></div>
              <div class="preview-avatar" id="previewAvatar">?</div>
              <div class="preview-effect" id="previewEffect"></div>
            </div>
            <div class="preview-title" id="previewTitle">Novice</div>
          </div>
          
          <div class="cosmetics-nav">
            <div class="cosmetics-nav-item active" data-tab="avatars">Avatars</div>
            <div class="cosmetics-nav-item" data-tab="frames">Frames</div>
            <div class="cosmetics-nav-item" data-tab="effects">Effects</div>
            <div class="cosmetics-nav-item" data-tab="titles">Titles</div>
          </div>
          
          <div class="cosmetics-section" id="avatarsSection">
            <h2 class="section-title">Avatars</h2>
            <div class="cosmetics-grid" id="avatarsGrid">
              <!-- Avatars will be dynamically inserted here -->
              <div class="cosmetic-card">
                <div class="cosmetic-rarity rarity-common">Common</div>
                <div class="cosmetic-image">
                  <div style="width: 40px; height: 40px; background-color: #6C5CE7; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">?</div>
                </div>
                <div class="cosmetic-name">Loading...</div>
                <div class="cosmetic-description">Loading cosmetics...</div>
                <div class="cosmetic-actions">
                  <button class="button cosmetic-button" disabled>Loading...</button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="cosmetics-section" id="framesSection" style="display: none;">
            <h2 class="section-title">Frames</h2>
            <div class="cosmetics-grid" id="framesGrid">
              <!-- Frames will be dynamically inserted here -->
            </div>
          </div>
          
          <div class="cosmetics-section" id="effectsSection" style="display: none;">
            <h2 class="section-title">Effects</h2>
            <div class="cosmetics-grid" id="effectsGrid">
              <!-- Effects will be dynamically inserted here -->
            </div>
          </div>
          
          <div class="cosmetics-section" id="titlesSection" style="display: none;">
            <h2 class="section-title">Titles</h2>
            <div class="cosmetics-grid" id="titlesGrid">
              <!-- Titles will be dynamically inserted here -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- Toast Notification -->
      <div id="toast" class="toast">
        <div class="toast-icon">✓</div>
        <div class="toast-message" id="toastMessage">Operation successful!</div>
        <button class="toast-close" onclick="hideToast()">&times;</button>
      </div>
      
      <script>
        // Initialize Firebase
        const firebaseConfig = {
          apiKey: '${process.env.VITE_FIREBASE_API_KEY || "demo-api-key"}',
          authDomain: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com',
          projectId: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}',
          storageBucket: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.appspot.com',
          appId: '${process.env.VITE_FIREBASE_APP_ID || "demo-app-id"}'
        };
        
        firebase.initializeApp(firebaseConfig);
        
        // Global variables
        let currentUser = null;
        let userCosmetics = null;
        let availableCosmetics = {
          avatars: [],
          frames: [],
          effects: [],
          titles: []
        };
        
        // Check if user is logged in, if not redirect to home page
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in
            console.log('Cosmetics: User is signed in:', user.displayName || user.email);
            currentUser = user;
            updateUserInterface(user);
            loadUserTokens(user.uid);
            loadUserCosmetics(user.uid);
            loadAvailableCosmetics();
          } else {
            // No user is signed in, redirect to home
            console.log('No user is signed in, redirecting to home');
            window.location.href = '/';
          }
        });
        
        // Update UI with user info
        function updateUserInterface(user) {
          // Show username in greeting
          const profileName = document.getElementById('profileName');
          const profileInitial = document.getElementById('profileInitial');
          
          const displayName = user.displayName || user.email || 'Player';
          profileName.textContent = displayName;
          
          // Show user initial in avatar
          if (displayName) {
            profileInitial.textContent = displayName.charAt(0).toUpperCase();
          }
        }
        
        // Handle logout
        function handleLogout() {
          firebase.auth().signOut()
            .then(() => {
              // Sign-out successful, redirect to home
              window.location.href = '/';
            })
            .catch((error) => {
              // An error happened
              console.error('Logout error:', error);
              showToast('error', 'Error during logout. Please try again.');
            });
        }
        
        // Load user token balance
        function loadUserTokens(userId) {
          fetch('/api/user/' + userId + '/tokens')
            .then(response => response.json())
            .then(data => {
              document.getElementById('tokenBalance').textContent = data.balance;
            })
            .catch(error => {
              console.error('Error fetching token balance:', error);
            });
        }
        
        // Add tokens to user (demo/testing functionality)
        function addTokens() {
          if (!currentUser) return;
          
          const amount = prompt('Enter amount of tokens to add:');
          
          if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
            showToast('error', 'Please enter a valid positive number.');
            return;
          }
          
          fetch('/api/user/' + currentUser.uid + '/tokens/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: parseInt(amount) })
          })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                document.getElementById('tokenBalance').textContent = data.newBalance;
                showToast('success', 'Successfully added ' + data.added + ' tokens!');
              } else {
                showToast('error', data.error || 'Failed to add tokens.');
              }
            })
            .catch(error => {
              console.error('Error adding tokens:', error);
              showToast('error', 'Failed to add tokens. Please try again.');
            });
        }
        
        // Load User Cosmetics
        function loadUserCosmetics(userId) {
          fetch('/api/user/' + userId + '/cosmetics')
            .then(response => response.json())
            .then(data => {
              userCosmetics = data;
              updateProfilePreview();
            })
            .catch(error => {
              console.error('Error fetching user cosmetics:', error);
              showToast('error', 'Failed to load your cosmetics. Please try again.');
            });
        }
        
        // Load Available Cosmetics
        function loadAvailableCosmetics() {
          // Load avatars
          fetch('/api/cosmetics/avatars')
            .then(response => response.json())
            .then(data => {
              availableCosmetics.avatars = data.items;
              renderAvatars();
            })
            .catch(error => {
              console.error('Error fetching avatars:', error);
            });
          
          // Load frames
          fetch('/api/cosmetics/frames')
            .then(response => response.json())
            .then(data => {
              availableCosmetics.frames = data.items;
              renderFrames();
            })
            .catch(error => {
              console.error('Error fetching frames:', error);
            });
          
          // Load effects
          fetch('/api/cosmetics/effects')
            .then(response => response.json())
            .then(data => {
              availableCosmetics.effects = data.items;
              renderEffects();
            })
            .catch(error => {
              console.error('Error fetching effects:', error);
            });
          
          // Load titles
          fetch('/api/cosmetics/titles')
            .then(response => response.json())
            .then(data => {
              availableCosmetics.titles = data.items;
              renderTitles();
            })
            .catch(error => {
              console.error('Error fetching titles:', error);
            });
        }
        
        // Update Profile Preview
        function updateProfilePreview() {
          if (!userCosmetics) return;
          
          const previewAvatar = document.getElementById('previewAvatar');
          const previewFrame = document.getElementById('previewFrame');
          const previewEffect = document.getElementById('previewEffect');
          const previewTitle = document.getElementById('previewTitle');
          
          // Set avatar
          if (userCosmetics.equipped.avatar) {
            // For demo purposes, we'll just use a colored div with the first letter
            const displayName = currentUser.displayName || currentUser.email || 'User';
            const initial = displayName.charAt(0).toUpperCase();
            previewAvatar.textContent = initial;
            
            // In a real app, you would set the background image to the avatar's imageUrl
            // previewAvatar.style.backgroundImage = "url(" + userCosmetics.equipped.avatar.imageUrl + ")";
            
            // Add some color based on rarity
            switch(userCosmetics.equipped.avatar.rarity) {
              case 'common':
                previewAvatar.style.backgroundColor = "#7f8c8d"; 
                break;
              case 'uncommon':
                previewAvatar.style.backgroundColor = "#2ecc71"; 
                break;
              case 'rare':
                previewAvatar.style.backgroundColor = "#3498db"; 
                break;
              case 'epic':
                previewAvatar.style.backgroundColor = "#9b59b6"; 
                break;
              case 'legendary':
                previewAvatar.style.backgroundColor = "#f1c40f"; 
                previewAvatar.style.color = "#2c3e50";
                break;
              default:
                previewAvatar.style.backgroundColor = "#6C5CE7";
            }
          }
          
          // Set frame
          if (userCosmetics.equipped.frame) {
            // For demo purposes, just add a border
            switch(userCosmetics.equipped.frame.rarity) {
              case 'common':
                previewFrame.style.border = "4px solid #7f8c8d"; 
                break;
              case 'uncommon':
                previewFrame.style.border = "4px solid #2ecc71"; 
                break;
              case 'rare':
                previewFrame.style.border = "4px solid #3498db"; 
                break;
              case 'epic':
                previewFrame.style.border = "4px solid #9b59b6"; 
                break;
              case 'legendary':
                previewFrame.style.border = "4px solid #f1c40f"; 
                break;
              default:
                previewFrame.style.border = "4px solid #6C5CE7";
            }
            previewFrame.style.borderRadius = "50%";
            // In a real app, you would set the background image
            // previewFrame.style.backgroundImage = "url(" + userCosmetics.equipped.frame.imageUrl + ")";
          }
          
          // Set effect (for demo, just add a box shadow)
          if (userCosmetics.equipped.effect && userCosmetics.equipped.effect.id !== 'default-effect') {
            switch(userCosmetics.equipped.effect.rarity) {
              case 'uncommon':
                previewAvatar.style.boxShadow = "0 0 20px #2ecc71"; 
                break;
              case 'rare':
                previewAvatar.style.boxShadow = "0 0 20px #3498db"; 
                break;
              case 'epic':
                previewAvatar.style.boxShadow = "0 0 20px #9b59b6"; 
                break;
              case 'legendary':
                previewAvatar.style.boxShadow = "0 0 30px #f1c40f"; 
                break;
              default:
                previewAvatar.style.boxShadow = "none";
            }
            // In a real app with actual effects
            // previewEffect.style.backgroundImage = "url(" + userCosmetics.equipped.effect.imageUrl + ")";
          }
          
          // Set title
          if (userCosmetics.equipped.title) {
            previewTitle.textContent = userCosmetics.equipped.title.name;
            
            // Set color based on rarity
            switch(userCosmetics.equipped.title.rarity) {
              case 'common':
                previewTitle.style.color = "#7f8c8d"; 
                break;
              case 'uncommon':
                previewTitle.style.color = "#2ecc71"; 
                break;
              case 'rare':
                previewTitle.style.color = "#3498db"; 
                break;
              case 'epic':
                previewTitle.style.color = "#9b59b6"; 
                break;
              case 'legendary':
                previewTitle.style.color = "#f1c40f"; 
                break;
              default:
                previewTitle.style.color = "#6C5CE7";
            }
          }
        }
        
        // Render Avatars
        function renderAvatars() {
          if (!availableCosmetics.avatars.length || !userCosmetics) return;
          
          const grid = document.getElementById('avatarsGrid');
          grid.innerHTML = '';
          
          availableCosmetics.avatars.forEach(avatar => {
            const isUnlocked = userCosmetics.unlocked.avatars.includes(avatar.id);
            const isEquipped = userCosmetics.equipped.avatar && userCosmetics.equipped.avatar.id === avatar.id;
            
            const card = document.createElement('div');
            card.className = 'cosmetic-card';
            if (isEquipped) {
              card.classList.add('equipped');
            }
            
            const purchaseAction = avatar.unlockType === 'tokens' 
              ? \`<button class="button cosmetic-button button-secondary" onclick="purchaseCosmetic('avatar', '\${avatar.id}')">\${avatar.price} Tokens</button>\` 
              : '';
              
            const equipAction = isUnlocked 
              ? \`<button class="button cosmetic-button" \${isEquipped ? 'disabled' : ''} onclick="equipCosmetic('avatar', '\${avatar.id}')">\${isEquipped ? 'Equipped' : 'Equip'}</button>\` 
              : '';
            
            card.innerHTML = \`
              <div class="cosmetic-rarity rarity-\${avatar.rarity}">\${avatar.rarity}</div>
              <div class="cosmetic-image">
                <div style="width: 40px; height: 40px; background-color: #6C5CE7; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">A</div>
              </div>
              <div class="cosmetic-name">\${avatar.name}</div>
              <div class="cosmetic-description">\${avatar.description}</div>
              <div class="cosmetic-actions">
                \${isUnlocked ? equipAction : purchaseAction}
              </div>
            \`;
            
            grid.appendChild(card);
          });
        }
        
        // Render Frames
        function renderFrames() {
          if (!availableCosmetics.frames.length || !userCosmetics) return;
          
          const grid = document.getElementById('framesGrid');
          grid.innerHTML = '';
          
          availableCosmetics.frames.forEach(frame => {
            const isUnlocked = userCosmetics.unlocked.frames.includes(frame.id);
            const isEquipped = userCosmetics.equipped.frame && userCosmetics.equipped.frame.id === frame.id;
            
            const card = document.createElement('div');
            card.className = 'cosmetic-card';
            if (isEquipped) {
              card.classList.add('equipped');
            }
            
            const purchaseAction = frame.unlockType === 'tokens' 
              ? \`<button class="button cosmetic-button button-secondary" onclick="purchaseCosmetic('frame', '\${frame.id}')">\${frame.price} Tokens</button>\` 
              : '';
              
            const equipAction = isUnlocked 
              ? \`<button class="button cosmetic-button" \${isEquipped ? 'disabled' : ''} onclick="equipCosmetic('frame', '\${frame.id}')">\${isEquipped ? 'Equipped' : 'Equip'}</button>\` 
              : '';
            
            card.innerHTML = \`
              <div class="cosmetic-rarity rarity-\${frame.rarity}">\${frame.rarity}</div>
              <div class="cosmetic-image">
                <div style="width: 60px; height: 60px; border: 3px solid #6C5CE7; border-radius: 50%;"></div>
              </div>
              <div class="cosmetic-name">\${frame.name}</div>
              <div class="cosmetic-description">\${frame.description}</div>
              <div class="cosmetic-actions">
                \${isUnlocked ? equipAction : purchaseAction}
              </div>
            \`;
            
            grid.appendChild(card);
          });
        }
        
        // Render Effects
        function renderEffects() {
          if (!availableCosmetics.effects.length || !userCosmetics) return;
          
          const grid = document.getElementById('effectsGrid');
          grid.innerHTML = '';
          
          availableCosmetics.effects.forEach(effect => {
            const isUnlocked = userCosmetics.unlocked.effects.includes(effect.id);
            const isEquipped = userCosmetics.equipped.effect && userCosmetics.equipped.effect.id === effect.id;
            
            const card = document.createElement('div');
            card.className = 'cosmetic-card';
            if (isEquipped) {
              card.classList.add('equipped');
            }
            
            const purchaseAction = effect.unlockType === 'tokens' 
              ? \`<button class="button cosmetic-button button-secondary" onclick="purchaseCosmetic('effect', '\${effect.id}')">\${effect.price} Tokens</button>\` 
              : '';
              
            const equipAction = isUnlocked 
              ? \`<button class="button cosmetic-button" \${isEquipped ? 'disabled' : ''} onclick="equipCosmetic('effect', '\${effect.id}')">\${isEquipped ? 'Equipped' : 'Equip'}</button>\` 
              : '';
            
            // Simulate effect with box shadow
            const effectStyle = effect.id !== 'default-effect' 
              ? 'box-shadow: 0 0 15px #6C5CE7; background-color: #6C5CE7;' 
              : 'background-color: #6C5CE7;';
            
            card.innerHTML = \`
              <div class="cosmetic-rarity rarity-\${effect.rarity}">\${effect.rarity}</div>
              <div class="cosmetic-image">
                <div style="width: 40px; height: 40px; border-radius: 50%; \${effectStyle}"></div>
              </div>
              <div class="cosmetic-name">\${effect.name}</div>
              <div class="cosmetic-description">\${effect.description}</div>
              <div class="cosmetic-actions">
                \${isUnlocked ? equipAction : purchaseAction}
              </div>
            \`;
            
            grid.appendChild(card);
          });
        }
        
        // Render Titles
        function renderTitles() {
          if (!availableCosmetics.titles.length || !userCosmetics) return;
          
          const grid = document.getElementById('titlesGrid');
          grid.innerHTML = '';
          
          availableCosmetics.titles.forEach(title => {
            const isUnlocked = userCosmetics.unlocked.titles.includes(title.id);
            const isEquipped = userCosmetics.equipped.title && userCosmetics.equipped.title.id === title.id;
            
            const card = document.createElement('div');
            card.className = 'cosmetic-card';
            if (isEquipped) {
              card.classList.add('equipped');
            }
            
            const purchaseAction = title.unlockType === 'tokens' 
              ? \`<button class="button cosmetic-button button-secondary" onclick="purchaseCosmetic('title', '\${title.id}')">\${title.price} Tokens</button>\` 
              : '';
              
            const equipAction = isUnlocked 
              ? \`<button class="button cosmetic-button" \${isEquipped ? 'disabled' : ''} onclick="equipCosmetic('title', '\${title.id}')">\${isEquipped ? 'Equipped' : 'Equip'}</button>\` 
              : '';
            
            // Set color based on rarity
            let titleColor;
            switch(title.rarity) {
              case 'common':
                titleColor = "#7f8c8d"; 
                break;
              case 'uncommon':
                titleColor = "#2ecc71"; 
                break;
              case 'rare':
                titleColor = "#3498db"; 
                break;
              case 'epic':
                titleColor = "#9b59b6"; 
                break;
              case 'legendary':
                titleColor = "#f1c40f"; 
                break;
              default:
                titleColor = "#6C5CE7";
            }
            
            card.innerHTML = \`
              <div class="cosmetic-rarity rarity-\${title.rarity}">\${title.rarity}</div>
              <div class="cosmetic-image">
                <div style="font-size: 20px; font-weight: bold; color: \${titleColor};">\${title.name}</div>
              </div>
              <div class="cosmetic-name">\${title.name}</div>
              <div class="cosmetic-description">\${title.description}</div>
              <div class="cosmetic-actions">
                \${isUnlocked ? equipAction : purchaseAction}
              </div>
            \`;
            
            grid.appendChild(card);
          });
        }
        
        // Purchase Cosmetic
        function purchaseCosmetic(type, itemId) {
          if (!currentUser) return;
          
          fetch('/api/user/' + currentUser.uid + '/cosmetics/purchase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type, itemId })
          })
            .then(response => {
              if (!response.ok) {
                return response.json().then(data => Promise.reject(data));
              }
              return response.json();
            })
            .then(data => {
              if (data.success) {
                showToast('success', data.message);
                document.getElementById('tokenBalance').textContent = data.newBalance;
                
                // Refresh cosmetics
                loadUserCosmetics(currentUser.uid);
              } else {
                showToast('error', data.message || 'Failed to purchase cosmetic.');
              }
            })
            .catch(error => {
              console.error('Error purchasing cosmetic:', error);
              showToast('error', error.error || 'Failed to purchase cosmetic. Please try again.');
            });
        }
        
        // Equip Cosmetic
        function equipCosmetic(type, itemId) {
          if (!currentUser) return;
          
          fetch('/api/user/' + currentUser.uid + '/cosmetics/equip', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type, itemId })
          })
            .then(response => {
              if (!response.ok) {
                return response.json().then(data => Promise.reject(data));
              }
              return response.json();
            })
            .then(data => {
              if (data.success) {
                showToast('success', data.message);
                
                // Refresh cosmetics
                loadUserCosmetics(currentUser.uid);
              } else {
                showToast('error', data.message || 'Failed to equip cosmetic.');
              }
            })
            .catch(error => {
              console.error('Error equipping cosmetic:', error);
              showToast('error', error.error || 'Failed to equip cosmetic. Please try again.');
            });
        }
        
        // Tab Navigation
        document.querySelectorAll('.cosmetics-nav-item').forEach(tab => {
          tab.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.cosmetics-nav-item').forEach(t => {
              t.classList.remove('active');
            });
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all sections
            document.getElementById('avatarsSection').style.display = 'none';
            document.getElementById('framesSection').style.display = 'none';
            document.getElementById('effectsSection').style.display = 'none';
            document.getElementById('titlesSection').style.display = 'none';
            
            // Show selected section
            const tabId = tab.dataset.tab;
            document.getElementById(tabId + 'Section').style.display = 'block';
          });
        });
        
        // Show toast notification
        function showToast(type, message) {
          const toast = document.getElementById('toast');
          const toastMessage = document.getElementById('toastMessage');
          
          // Set message
          toastMessage.textContent = message;
          
          // Set type
          toast.className = 'toast';
          toast.classList.add(\`toast-\${type}\`);
          
          // Show toast
          toast.classList.add('show');
          
          // Hide after 3 seconds
          setTimeout(() => {
            hideToast();
          }, 3000);
        }
        
        // Hide toast notification
        function hideToast() {
          const toast = document.getElementById('toast');
          toast.classList.remove('show');
        }
      </script>
    </body>
    </html>
  `);
});

app.get('/battle-pass', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Battle Pass - MindArena</title>
      <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
      <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
      <style>
        /* General styles */
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #2D3436 0%, #000000 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        a {
          text-decoration: none;
          color: inherit;
        }
        .container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .content {
          flex: 1;
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        .button {
          display: inline-block;
          background-color: #6C5CE7;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        .button:hover {
          background-color: #5A49DB;
          transform: translateY(-2px);
        }
        .button:disabled {
          background-color: #6C5CE7;
          opacity: 0.5;
          cursor: not-allowed;
        }
        .button-secondary {
          background-color: transparent;
          border: 1px solid #6C5CE7;
        }
        .button-secondary:hover {
          background-color: rgba(108, 92, 231, 0.1);
        }
        .button-success {
          background-color: #00b894;
        }
        .button-success:hover {
          background-color: #00a584;
        }
        
        /* Nav bar styles */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          background-color: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: white;
          display: flex;
          align-items: center;
        }
        .logo-icon {
          width: 36px;
          height: 36px;
          background-color: #6C5CE7;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
        }
        .nav-links {
          display: flex;
          gap: 16px;
        }
        .nav-link {
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .nav-link.active {
          background-color: rgba(108, 92, 231, 0.2);
          color: #6C5CE7;
        }
        .profile-menu {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .profile-avatar {
          width: 40px;
          height: 40px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .profile-name {
          font-weight: bold;
        }
        .logout-button {
          padding: 8px 16px;
          font-size: 14px;
        }
        
        /* Battle Pass specific styles */
        .battle-pass-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }
        .battle-pass-info {
          max-width: 600px;
        }
        .page-title {
          margin: 0 0 8px 0;
          font-size: 32px;
        }
        .season-name {
          color: #6C5CE7;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .season-dates {
          color: #B2BEC3;
          margin-bottom: 16px;
        }
        .season-description {
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .token-balance {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding: 16px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .token-icon {
          display: flex;
          margin-right: 16px;
        }
        .token-details {
          flex: 1;
        }
        .token-balance-text {
          color: #B2BEC3;
          margin-bottom: 4px;
        }
        .token-amount {
          font-size: 24px;
          font-weight: bold;
        }
        .action-buttons {
          display: flex;
          gap: 16px;
        }
        .premium-status {
          padding: 16px;
          background-color: rgba(108, 92, 231, 0.1);
          border-radius: 8px;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .premium-status-icon {
          width: 40px;
          height: 40px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
        }
        .premium-status-free {
          background-color: rgba(108, 92, 231, 0.2);
        }
        .premium-info-wrapper {
          flex: 1;
        }
        .premium-info {
          display: flex;
          align-items: center;
        }
        .premium-status-title {
          font-weight: bold;
          margin-bottom: 4px;
        }
        .premium-status-description {
          color: #B2BEC3;
          font-size: 14px;
          margin-right: 16px;
        }
        .progress-section {
          margin-bottom: 32px;
        }
        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .level-display {
          font-size: 24px;
          font-weight: bold;
        }
        .xp-info {
          color: #B2BEC3;
        }
        .progress-container {
          height: 24px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #6C5CE7 0%, #8E67E7 100%);
          border-radius: 12px;
          transition: width 0.3s ease;
        }
        .xp-actions {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }
        .rewards-section {
          margin-bottom: 32px;
        }
        .rewards-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        .rewards-toggle {
          display: flex;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          overflow: hidden;
        }
        .toggle-option {
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .toggle-option.active {
          background-color: #6C5CE7;
          color: white;
        }
        .rewards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .reward-card {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          position: relative;
        }
        .reward-card:hover {
          transform: translateY(-2px);
          border-color: rgba(108, 92, 231, 0.5);
        }
        .reward-locked {
          opacity: 0.5;
        }
        .reward-premium {
          border-color: #F1C40F;
        }
        .reward-claimed::after {
          content: '✓';
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          background-color: #00b894;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }
        .reward-level {
          background-color: #6C5CE7;
          color: white;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: bold;
          display: inline-block;
          margin-bottom: 8px;
        }
        .reward-premium .reward-level {
          background-color: #F1C40F;
          color: #2D3436;
        }
        .reward-name {
          font-weight: bold;
          margin-bottom: 8px;
        }
        .reward-icon {
          width: 60px;
          height: 60px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          margin: 8px auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .reward-icon svg {
          width: 32px;
          height: 32px;
          fill: #B2BEC3;
        }
        .reward-premium .reward-icon {
          background-color: rgba(241, 196, 15, 0.1);
        }
        .reward-premium .reward-icon svg {
          fill: #F1C40F;
        }
        .reward-button {
          width: 100%;
          padding: 8px;
          margin-top: 8px;
          font-size: 14px;
        }
        .empty-state {
          text-align: center;
          padding: 32px;
        }
        .empty-state svg {
          width: 64px;
          height: 64px;
          margin-bottom: 16px;
          fill: #B2BEC3;
        }
        .empty-state-title {
          font-size: 20px;
          margin-bottom: 8px;
        }
        .empty-state-description {
          color: #B2BEC3;
          margin-bottom: 24px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }
        
        /* Toast notification */
        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 16px;
          background-color: #2D3436;
          border-left: 4px solid #6C5CE7;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          min-width: 300px;
          transform: translateY(100px);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          z-index: 1000;
        }
        .toast.show {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
        }
        .toast-success {
          border-color: #00b894;
        }
        .toast-error {
          border-color: #d63031;
        }
        .toast-icon {
          margin-right: 12px;
          width: 24px;
          height: 24px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toast-success .toast-icon {
          background-color: #00b894;
        }
        .toast-error .toast-icon {
          background-color: #d63031;
        }
        .toast-message {
          flex: 1;
        }
        .toast-close {
          background: none;
          border: none;
          color: #B2BEC3;
          cursor: pointer;
          font-size: 16px;
          margin-left: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="navbar">
          <a href="/" class="logo">
            <div class="logo-icon">M</div>
            MindArena
          </a>
          
          <div class="nav-links">
            <a href="/dashboard" class="nav-link">Dashboard</a>
            <a href="#" class="nav-link">Play Now</a>
            <a href="/tournaments" class="nav-link">Tournaments</a>
            <a href="/battle-pass" class="nav-link active">Battle Pass</a>
            <a href="#" class="nav-link">Leaderboard</a>
          </div>
          
          <div class="profile-menu">
            <div class="profile-avatar" id="profileInitial" onclick="toggleProfileDropdown()">?</div>
            <div class="profile-dropdown" id="profileDropdown">
              <div class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <span id="profileName">...</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" onclick="window.location.href='/account'">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                Account Settings
              </div>
              <div class="dropdown-item" onclick="handleLogout()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                Logout
              </div>
            </div>
          </div>
        </div>
        
        <div class="content">
          <div class="battle-pass-header">
            <div class="battle-pass-info">
              <h1 class="page-title">Battle Pass</h1>
              <div class="season-name" id="seasonName">Season 1: Mind Mastery</div>
              <div class="season-dates" id="seasonDates">April 1 - April 30, 2025</div>
              <div class="season-description" id="seasonDescription">Begin your journey through the realms of knowledge and earn exclusive rewards.</div>
            </div>
            
            <div class="token-balance">
              <div class="token-info">
                <div class="token-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                    <path d="M0 0h24v24H0V0z" fill="none"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                  </svg>
                </div>
                <div class="token-details">
                  <div class="token-balance-text">Your Token Balance</div>
                  <div class="token-amount" id="tokenBalance">0</div>
                </div>
              </div>
              <div class="action-buttons">
                <button class="button" onclick="addTokens()">Add Tokens</button>
              </div>
            </div>
          </div>
          
          <div id="premiumStatusSection" class="premium-status">
            <div class="premium-info">
              <div class="premium-status-icon premium-status-free" id="premiumStatusIcon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24">
                  <path d="M0 0h24v24H0V0z" fill="none"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
                </svg>
              </div>
              <div class="premium-info-wrapper">
                <div class="premium-status-title" id="premiumStatusTitle">Free Battle Pass</div>
                <div class="premium-status-description" id="premiumStatusDescription">Upgrade to Premium to unlock exclusive rewards</div>
              </div>
            </div>
            <button class="button" id="upgradeButton" onclick="upgradeToPremium()">Upgrade to Premium (500 Tokens)</button>
          </div>
          
          <div class="progress-section">
            <div class="progress-info">
              <div class="level-display">Level <span id="currentLevel">1</span></div>
              <div class="xp-info"><span id="currentXP">0</span>/<span id="xpPerLevel">1000</span> XP to Level <span id="nextLevel">2</span></div>
            </div>
            <div class="progress-container">
              <div class="progress-bar" id="progressBar" style="width: 0%;"></div>
            </div>
            <div class="xp-actions">
              <button class="button button-secondary" onclick="simulateXP('dailyLogin')">Simulate Daily Login (+50 XP)</button>
              <button class="button button-secondary" onclick="simulateXP('matchWin')">Simulate Match Win (+100 XP)</button>
              <button class="button button-secondary" onclick="simulateXP('tournamentWin')">Simulate Tournament Win (+500 XP)</button>
            </div>
          </div>
          
          <div class="rewards-section">
            <div class="rewards-header">
              <h2 class="section-title">Battle Pass Rewards</h2>
              <div class="rewards-toggle">
                <div class="toggle-option active" onclick="filterRewards('all')">All Rewards</div>
                <div class="toggle-option" onclick="filterRewards('available')">Available</div>
                <div class="toggle-option" onclick="filterRewards('claimed')">Claimed</div>
              </div>
            </div>
            
            <div id="rewardsGrid" class="rewards-grid">
              <!-- Rewards will be dynamically inserted here -->
              <!-- Loading placeholder -->
              <div class="reward-card">
                <div class="reward-level">Loading...</div>
                <div class="reward-name">Loading...</div>
                <div class="reward-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M0 0h24v24H0V0z" fill="none"/>
                    <path d="M18 13h-5v5h-2v-5H6v-2h5V6h2v5h5v2z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div id="emptyState" class="empty-state" style="display: none;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-9-1h4v-4h-4v4zm0-6h4V8h-4v4z"/>
            </svg>
            <h3 class="empty-state-title">No Rewards Found</h3>
            <p class="empty-state-description">There are no rewards matching your current filter. Please try a different filter or level up to unlock more rewards.</p>
            <button class="button" onclick="filterRewards('all')">View All Rewards</button>
          </div>
        </div>
      </div>
      
      <!-- Toast Notification -->
      <div id="toast" class="toast">
        <div class="toast-icon">✓</div>
        <div class="toast-message" id="toastMessage">Operation successful!</div>
        <button class="toast-close" onclick="hideToast()">&times;</button>
      </div>
      
      <script>
        // Initialize Firebase
        const firebaseConfig = {
          apiKey: '${process.env.VITE_FIREBASE_API_KEY || "demo-api-key"}',
          authDomain: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com',
          projectId: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}',
          storageBucket: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.appspot.com',
          appId: '${process.env.VITE_FIREBASE_APP_ID || "demo-app-id"}'
        };
        
        firebase.initializeApp(firebaseConfig);
        
        // Global variables
        let currentUser = null;
        let userProgress = null;
        let battlePassInfo = null;
        let rewards = [];
        let filteredRewards = [];
        let currentFilter = 'all';
        
        // Check if user is logged in, if not redirect to home page
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in
            console.log('Battle Pass: User is signed in:', user.displayName || user.email);
            currentUser = user;
            updateUserInterface(user);
            loadUserTokens(user.uid);
            loadBattlePassInfo();
            loadUserProgress(user.uid);
          } else {
            // No user is signed in, redirect to home
            console.log('No user is signed in, redirecting to home');
            window.location.href = '/';
          }
        });
        
        // Update UI with user info
        function updateUserInterface(user) {
          // Show username in greeting
          const profileName = document.getElementById('profileName');
          const profileInitial = document.getElementById('profileInitial');
          
          const displayName = user.displayName || user.email || 'Player';
          profileName.textContent = displayName;
          
          // Show user initial in avatar
          if (displayName) {
            profileInitial.textContent = displayName.charAt(0).toUpperCase();
          }
        }
        
        // Toggle profile dropdown
        function toggleProfileDropdown() {
          const dropdown = document.getElementById('profileDropdown');
          dropdown.classList.toggle('show');
          
          // Close dropdown when clicking outside
          document.addEventListener('click', function closeDropdown(e) {
            if (!e.target.closest('.profile-menu')) {
              dropdown.classList.remove('show');
              document.removeEventListener('click', closeDropdown);
            }
          });
        }
        
        // Handle logout
        function handleLogout() {
          firebase.auth().signOut()
            .then(() => {
              // Sign-out successful, redirect to home
              window.location.href = '/';
            })
            .catch((error) => {
              // An error happened
              console.error('Logout error:', error);
              showToast('error', 'Error during logout. Please try again.');
            });
        }
        
        // Load user token balance
        function loadUserTokens(userId) {
          fetch('/api/user/' + userId + '/tokens')
            .then(response => response.json())
            .then(data => {
              document.getElementById('tokenBalance').textContent = data.balance;
            })
            .catch(error => {
              console.error('Error fetching token balance:', error);
            });
        }
        
        // Add tokens to user (demo/testing functionality)
        function addTokens() {
          if (!currentUser) return;
          
          const amount = prompt('Enter amount of tokens to add:');
          
          if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
            showToast('error', 'Please enter a valid positive number.');
            return;
          }
          
          fetch('/api/user/' + currentUser.uid + '/tokens/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: parseInt(amount) })
          })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                document.getElementById('tokenBalance').textContent = data.newBalance;
                showToast('success', 'Successfully added ' + data.added + ' tokens!');
              } else {
                showToast('error', data.error || 'Failed to add tokens.');
              }
            })
            .catch(error => {
              console.error('Error adding tokens:', error);
              showToast('error', 'Failed to add tokens. Please try again.');
            });
        }
        
        // Load battle pass information
        function loadBattlePassInfo() {
          fetch('/api/battle-pass')
            .then(response => response.json())
            .then(data => {
              battlePassInfo = data.currentSeason;
              
              // Update UI with season info
              document.getElementById('seasonName').textContent = battlePassInfo.name;
              
              // Format dates
              const startDate = new Date(battlePassInfo.startDate);
              const endDate = new Date(battlePassInfo.endDate);
              const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
              const formattedStartDate = startDate.toLocaleDateString('en-US', dateOptions);
              const formattedEndDate = endDate.toLocaleDateString('en-US', dateOptions);
              document.getElementById('seasonDates').textContent = \`\${formattedStartDate} - \${formattedEndDate}\`;
              
              document.getElementById('seasonDescription').textContent = battlePassInfo.description;
              document.getElementById('xpPerLevel').textContent = battlePassInfo.xpPerLevel;
              document.getElementById('upgradeButton').textContent = \`Upgrade to Premium (\${battlePassInfo.premiumPrice} Tokens)\`;
              
              // Load rewards
              loadRewards();
            })
            .catch(error => {
              console.error('Error fetching battle pass info:', error);
              showToast('error', 'Failed to load battle pass information. Please try again.');
            });
        }
        
        // Load user battle pass progress
        function loadUserProgress(userId) {
          fetch('/api/user/' + userId + '/battle-pass')
            .then(response => response.json())
            .then(data => {
              userProgress = data.progress;
              rewards = data.rewards;
              
              // Update progress UI
              updateProgressUI();
              
              // Update premium status UI
              updatePremiumStatusUI();
              
              // Render rewards
              renderRewards();
            })
            .catch(error => {
              console.error('Error fetching user progress:', error);
              showToast('error', 'Failed to load your battle pass progress. Please try again.');
            });
        }
        
        // Load rewards
        function loadRewards() {
          fetch('/api/battle-pass/rewards')
            .then(response => response.json())
            .then(data => {
              if (!userProgress) {
                // Save rewards but don't render until we have user progress
                rewards = data.rewards;
              }
            })
            .catch(error => {
              console.error('Error fetching rewards:', error);
              showToast('error', 'Failed to load rewards. Please try again.');
            });
        }
        
        // Update progress UI
        function updateProgressUI() {
          document.getElementById('currentLevel').textContent = userProgress.level;
          document.getElementById('nextLevel').textContent = Math.min(userProgress.level + 1, battlePassInfo.maxLevel);
          document.getElementById('currentXP').textContent = userProgress.xp;
          
          // Update progress bar
          const progressPercent = userProgress.percentToNextLevel;
          document.getElementById('progressBar').style.width = progressPercent + '%';
        }
        
        // Update premium status UI
        function updatePremiumStatusUI() {
          const premiumStatusSection = document.getElementById('premiumStatusSection');
          const premiumStatusIcon = document.getElementById('premiumStatusIcon');
          const premiumStatusTitle = document.getElementById('premiumStatusTitle');
          const premiumStatusDescription = document.getElementById('premiumStatusDescription');
          const upgradeButton = document.getElementById('upgradeButton');
          
          if (userProgress.isPremium) {
            premiumStatusSection.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';
            premiumStatusIcon.classList.remove('premium-status-free');
            premiumStatusIcon.innerHTML = \`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F1C40F" width="24" height="24">
                <path d="M0 0h24v24H0V0z" fill="none"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.17-9.41l-5.07 5.07-2.83-2.83 1.41-1.41 1.42 1.42L15.34 10l1.41 1.41-1.42 1.18z"/>
              </svg>
            \`;
            premiumStatusTitle.textContent = 'Premium Battle Pass';
            premiumStatusDescription.textContent = 'You have access to all premium rewards';
            upgradeButton.style.display = 'none';
          } else {
            premiumStatusSection.style.backgroundColor = 'rgba(108, 92, 231, 0.1)';
            premiumStatusIcon.classList.add('premium-status-free');
            premiumStatusIcon.innerHTML = \`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24">
                <path d="M0 0h24v24H0V0z" fill="none"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
              </svg>
            \`;
            premiumStatusTitle.textContent = 'Free Battle Pass';
            premiumStatusDescription.textContent = 'Upgrade to Premium to unlock exclusive rewards';
            upgradeButton.style.display = 'block';
          }
        }
        
        // Render rewards
        function renderRewards() {
          const rewardsGrid = document.getElementById('rewardsGrid');
          
          // Filter rewards based on current filter
          filterRewards(currentFilter);
          
          if (filteredRewards.length === 0) {
            document.getElementById('emptyState').style.display = 'block';
            rewardsGrid.style.display = 'none';
            return;
          }
          
          document.getElementById('emptyState').style.display = 'none';
          rewardsGrid.style.display = 'grid';
          
          // Clear grid
          rewardsGrid.innerHTML = '';
          
          // Add reward cards
          filteredRewards.forEach(reward => {
            const isFree = !reward.free.claimed;
            const isPremium = !reward.premium.claimed && userProgress.isPremium;
            
            // Free reward
            rewardsGrid.appendChild(createRewardCard(reward.level, reward.free, 'free', reward.free.available, reward.free.claimed));
            
            // Premium reward
            rewardsGrid.appendChild(createRewardCard(reward.level, reward.premium, 'premium', reward.premium.available, reward.premium.claimed));
          });
        }
        
        // Create reward card
        function createRewardCard(level, reward, type, available, claimed) {
          const card = document.createElement('div');
          card.className = 'reward-card';
          
          if (type === 'premium') {
            card.classList.add('reward-premium');
          }
          
          if (!available) {
            card.classList.add('reward-locked');
          }
          
          if (claimed) {
            card.classList.add('reward-claimed');
          }
          
          let iconSvg = '';
          
          // Choose icon based on reward type
          switch(reward.type) {
            case 'tokens':
              iconSvg = \`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0V0z" fill="none"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                </svg>
              \`;
              break;
            case 'avatar':
              iconSvg = \`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0V0z" fill="none"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 3c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm0 4.9c-2.97 0-5.1-1.55-5.9-2.9h11.8c-.8 1.35-2.93 2.9-5.9 2.9z"/>
                </svg>
              \`;
              break;
            case 'profile_frame':
              iconSvg = \`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0V0z" fill="none"/>
                  <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zm-5.5-7.5h-2v-3h-3V11h3v3h2v-3h3V8.5h-3z"/>
                </svg>
              \`;
              break;
            case 'title':
              iconSvg = \`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0V0z" fill="none"/>
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v4H6zm3 0h8v1h-8zm0 3h8v1h-8z"/>
                </svg>
              \`;
              break;
            case 'special_effect':
              iconSvg = \`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0V0z" fill="none"/>
                  <path d="M11.5 7v7.96c0 .14.1.19.15.1l1.54-2.77c.03-.07.08-.09.15-.09h1.81c.07 0 .12.02.15.09l1.54 2.77c.05.09.15.04.15-.1V7c0-.06.04-.1.1-.1h1.81c.06 0 .1.04.1.1v10c0 .06-.04.1-.1.1h-1.91c-.07 0-.12-.02-.15-.09l-2.14-3.86c-.03-.07-.1-.07-.15 0l-2.14 3.86c-.03.07-.08.09-.15.09H9.5c-.06 0-.1-.04-.1-.1V7.1c0-.06.04-.1.1-.1h1.91c.05 0 .09.04.09.1zm-5 2v6c0 .06-.04.1-.1.1H4.6c-.06 0-.1-.04-.1-.1v-6c0-.06.04-.1.1-.1h1.8c.06 0 .1.04.1.1zm0-4v1c0 .06-.04.1-.1.1H4.6c-.06 0-.1-.04-.1-.1v-1c0-.06.04-.1.1-.1h1.8c.06 0 .1.04.1.1z"/>
                </svg>
              \`;
              break;
            default:
              iconSvg = \`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M0 0h24v24H0V0z" fill="none"/>
                  <path d="M19 5h-2V3H7v2H5v14h14V5zm-2 12H7V7h10v10z"/>
                </svg>
              \`;
          }
          
          card.innerHTML = \`
            <div class="reward-level">Level \${level}</div>
            <div class="reward-name">\${reward.name}</div>
            <div class="reward-icon">
              \${iconSvg}
            </div>
            <button class="button reward-button" 
                  onclick="claimReward(\${level}, \${type === 'premium'})" 
                  \${!available || claimed ? 'disabled' : ''}>
              \${claimed ? 'Claimed' : available ? 'Claim' : 'Locked'}
            </button>
          \`;
          
          return card;
        }
        
        // Filter rewards
        function filterRewards(filter) {
          currentFilter = filter;
          
          // Update active filter in UI
          document.querySelectorAll('.toggle-option').forEach(option => {
            option.classList.remove('active');
          });
          document.querySelector(\`.toggle-option[onclick="filterRewards('\${filter}')"]\`).classList.add('active');
          
          if (!rewards || rewards.length === 0) {
            filteredRewards = [];
            return;
          }
          
          switch(filter) {
            case 'available':
              filteredRewards = rewards.filter(reward => 
                (reward.free.available && !reward.free.claimed) || 
                (reward.premium.available && !reward.premium.claimed)
              );
              break;
            case 'claimed':
              filteredRewards = rewards.filter(reward => 
                reward.free.claimed || reward.premium.claimed
              );
              break;
            case 'all':
            default:
              filteredRewards = [...rewards];
              break;
          }
          
          // Render if we already have rewards loaded
          if (document.getElementById('rewardsGrid').childElementCount > 0) {
            renderRewards();
          }
        }
        
        // Claim reward
        function claimReward(level, isPremium) {
          if (!currentUser) return;
          
          fetch('/api/user/' + currentUser.uid + '/battle-pass/claim-reward', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ level, isPremium })
          })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showToast('success', data.message);
                
                // If token reward, update balance
                if (data.reward && data.reward.newBalance !== undefined) {
                  document.getElementById('tokenBalance').textContent = data.reward.newBalance;
                }
                
                // Refresh user progress to update claimed rewards
                loadUserProgress(currentUser.uid);
              } else {
                showToast('error', data.error || 'Failed to claim reward.');
              }
            })
            .catch(error => {
              console.error('Error claiming reward:', error);
              showToast('error', 'Failed to claim reward. Please try again.');
            });
        }
        
        // Upgrade to premium battle pass
        function upgradeToPremium() {
          if (!currentUser) return;
          
          // Confirm upgrade
          if (!confirm('Are you sure you want to upgrade to Premium Battle Pass for ' + battlePassInfo.premiumPrice + ' tokens?')) {
            return;
          }
          
          fetch('/api/user/' + currentUser.uid + '/battle-pass/upgrade', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                showToast('success', data.message);
                document.getElementById('tokenBalance').textContent = data.newBalance;
                
                // Update premium status
                userProgress.isPremium = true;
                updatePremiumStatusUI();
                
                // Refresh rewards to show premium ones as available
                loadUserProgress(currentUser.uid);
              } else {
                showToast('error', data.error || 'Failed to upgrade to premium.');
              }
            })
            .catch(error => {
              console.error('Error upgrading to premium:', error);
              showToast('error', 'Failed to upgrade to premium. Please try again.');
            });
        }
        
        // Simulate earning XP (for demo purposes)
        function simulateXP(source) {
          if (!currentUser) return;
          
          // Get XP amount based on source
          let amount = 50; // default
          switch(source) {
            case 'matchWin':
              amount = 100;
              break;
            case 'tournamentWin':
              amount = 500;
              break;
            case 'dailyLogin':
            default:
              amount = 50;
              break;
          }
          
          fetch('/api/user/' + currentUser.uid + '/battle-pass/add-xp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, source })
          })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                if (data.levelUp) {
                  showToast('success', \`Congratulations! You leveled up from \${data.oldLevel} to \${data.newLevel}!\`);
                } else {
                  showToast('success', \`You earned \${data.xpAdded} XP from \${source}!\`);
                }
                
                // Refresh user progress
                loadUserProgress(currentUser.uid);
              } else {
                showToast('error', data.error || 'Failed to add XP.');
              }
            })
            .catch(error => {
              console.error('Error adding XP:', error);
              showToast('error', 'Failed to add XP. Please try again.');
            });
        }
        
        // Show toast notification
        function showToast(type, message) {
          const toast = document.getElementById('toast');
          const toastMessage = document.getElementById('toastMessage');
          
          // Set message
          toastMessage.textContent = message;
          
          // Set type
          toast.className = 'toast';
          toast.classList.add(\`toast-\${type}\`);
          
          // Show toast
          toast.classList.add('show');
          
          // Hide after 3 seconds
          setTimeout(() => {
            hideToast();
          }, 3000);
        }
        
        // Hide toast notification
        function hideToast() {
          const toast = document.getElementById('toast');
          toast.classList.remove('show');
        }
      </script>
    </body>
    </html>
  `);
});

app.get('/tournaments', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tournaments - MindArena</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #2D3436 0%, #000000 100%);
          color: white;
          min-height: 100vh;
        }
        .navbar {
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: bold;
          font-size: 20px;
          color: white;
          text-decoration: none;
        }
        .logo-icon {
          width: 40px;
          height: 40px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-icon svg {
          width: 24px;
          height: 24px;
          fill: white;
        }
        .nav-links {
          display: flex;
          gap: 24px;
          align-items: center;
        }
        .nav-link {
          color: #B2BEC3;
          text-decoration: none;
          transition: color 0.3s ease;
          font-weight: 500;
        }
        .nav-link:hover {
          color: #6C5CE7;
        }
        .nav-link.active {
          color: #6C5CE7;
          font-weight: 600;
        }
        .profile-menu {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          position: relative;
        }
        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #6C5CE7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          color: white;
        }
        .profile-name {
          font-weight: 500;
          color: white;
        }
        .content {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .token-balance {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .token-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .token-icon {
          width: 48px;
          height: 48px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .token-icon svg {
          width: 24px;
          height: 24px;
          fill: white;
        }
        .token-details {
          font-size: 18px;
          font-weight: 600;
        }
        .token-balance-text {
          color: #B2BEC3;
          margin-bottom: 4px;
        }
        .token-amount {
          font-size: 24px;
          color: #6C5CE7;
        }
        .action-buttons {
          display: flex;
          gap: 12px;
        }
        .button {
          display: inline-block;
          background-color: #6C5CE7;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        .button:hover {
          background-color: #5541c7;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(108, 92, 231, 0.3);
        }
        .button-secondary {
          background-color: transparent;
          border: 2px solid #6C5CE7;
          color: #6C5CE7;
        }
        .button-secondary:hover {
          background-color: rgba(108, 92, 231, 0.1);
        }
        .tournaments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .page-title {
          font-size: 32px;
          font-weight: 700;
        }
        .tournament-filter {
          display: flex;
          gap: 12px;
        }
        .filter-option {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .filter-option:hover, .filter-option.active {
          background-color: rgba(108, 92, 231, 0.3);
        }
        .tournament-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }
        .tournament-card {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        .tournament-card:hover {
          border-color: rgba(108, 92, 231, 0.5);
          transform: translateY(-5px);
        }
        .tournament-header {
          background-color: rgba(0, 0, 0, 0.3);
          padding: 20px;
          position: relative;
        }
        .tournament-difficulty {
          position: absolute;
          top: 20px;
          right: 20px;
          background-color: rgba(0, 0, 0, 0.5);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
          text-transform: uppercase;
        }
        .tournament-difficulty.easy {
          color: #00b894;
        }
        .tournament-difficulty.medium {
          color: #fdcb6e;
        }
        .tournament-difficulty.hard {
          color: #ff7675;
        }
        .tournament-title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .tournament-date {
          font-size: 14px;
          color: #B2BEC3;
          margin-bottom: 10px;
        }
        .tournament-body {
          padding: 20px;
        }
        .tournament-description {
          margin-bottom: 16px;
          color: #DFE6E9;
          font-size: 15px;
          line-height: 1.5;
        }
        .tournament-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .meta-item {
          font-size: 14px;
        }
        .meta-label {
          color: #B2BEC3;
          margin-bottom: 4px;
        }
        .meta-value {
          font-weight: 600;
        }
        .prize-pool {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
        }
        .prize-title {
          font-size: 16px;
          color: #6C5CE7;
          margin-bottom: 8px;
        }
        .prize-distribution {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 8px;
        }
        .prize-place {
          text-align: center;
          font-size: 14px;
        }
        .prize-position {
          color: #B2BEC3;
          margin-bottom: 4px;
        }
        .prize-amount {
          font-weight: 700;
        }
        .tournament-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background-color: rgba(0, 0, 0, 0.2);
        }
        .entry-fee {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .fee-icon {
          width: 20px;
          height: 20px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
        .fee-value {
          font-weight: 700;
          color: white;
        }
        .participants-info {
          font-size: 14px;
          color: #B2BEC3;
        }
        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.8);
          z-index: 1000;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(5px);
        }
        .modal-content {
          background-color: #2D3436;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 32px;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .modal-title {
          font-size: 24px;
          font-weight: 700;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #DFE6E9;
          cursor: pointer;
        }
        .modal-body {
          margin-bottom: 24px;
        }
        .modal-message {
          margin-bottom: 16px;
          line-height: 1.6;
        }
        .tournament-detail-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .tournament-rounds {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .rounds-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .round-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .round-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }
        .round-name {
          font-weight: 600;
        }
        .round-details {
          font-size: 14px;
          color: #B2BEC3;
        }
        #loadingIndicator {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(108, 92, 231, 0.3);
          border-radius: 50%;
          border-top-color: #6C5CE7;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .toast {
          position: fixed;
          bottom: 32px;
          right: 32px;
          background-color: #2D3436;
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 1001;
          transition: transform 0.3s ease, opacity 0.3s ease;
          transform: translateY(150%);
          opacity: 0;
        }
        .toast.success {
          border-left: 4px solid #00b894;
        }
        .toast.error {
          border-left: 4px solid #ff7675;
        }
        .toast.show {
          transform: translateY(0);
          opacity: 1;
        }
        .toast-icon {
          font-size: 24px;
        }
        .toast-message {
          flex: 1;
        }
        .toast-close {
          background: none;
          border: none;
          color: #B2BEC3;
          cursor: pointer;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          margin-top: 20px;
        }
        .empty-state svg {
          width: 80px;
          height: 80px;
          fill: #6C5CE7;
          margin-bottom: 24px;
          opacity: 0.5;
        }
        .empty-state-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .empty-state-description {
          color: #B2BEC3;
          margin-bottom: 24px;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        /* Responsive styles */
        @media (max-width: 768px) {
          .tournament-list {
            grid-template-columns: 1fr;
          }
          .tournament-meta {
            grid-template-columns: 1fr;
          }
          .navbar {
            flex-direction: column;
            padding: 16px;
          }
          .nav-links {
            margin: 16px 0;
            overflow-x: auto;
            width: 100%;
            padding-bottom: 8px;
          }
        }
        .logout-button {
          background-color: transparent;
          border: 2px solid #6C5CE7;
          color: #6C5CE7;
        }
        .logout-button:hover {
          background-color: rgba(108, 92, 231, 0.1);
        }
      </style>
      <!-- Firebase App (the core Firebase SDK) -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
      <!-- Firebase Auth -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
    </head>
    <body>
      <div class="navbar">
        <a href="/dashboard" class="logo">
          <div class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
            </svg>
          </div>
          MindArena
        </a>
        
        <div class="nav-links">
          <a href="/dashboard" class="nav-link">Dashboard</a>
          <a href="/play" class="nav-link">Play Now</a>
          <a href="/tournaments" class="nav-link active">Tournaments</a>
          <a href="/battle-pass" class="nav-link">Battle Pass</a>
          <a href="#" class="nav-link">Leaderboard</a>
        </div>
        
        <div class="profile-menu">
          <div class="profile-avatar" id="profileInitial" onclick="toggleProfileDropdown()">?</div>
          <div class="profile-dropdown" id="profileDropdown">
            <div class="dropdown-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              <span id="profileName">...</span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" onclick="window.location.href='/account'">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
              Account Settings
            </div>
            <div class="dropdown-item" onclick="handleLogout()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
              Logout
            </div>
          </div>
        </div>
      </div>
      
      <div class="content">
        <div class="token-balance">
          <div class="token-info">
            <div class="token-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                <path d="M0 0h24v24H0V0z" fill="none"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
              </svg>
            </div>
            <div class="token-details">
              <div class="token-balance-text">Your Token Balance</div>
              <div class="token-amount" id="tokenBalance">0</div>
            </div>
          </div>
          <div class="action-buttons">
            <button class="button" onclick="addTokens()">Add Tokens</button>
          </div>
        </div>
        
        <div class="tournaments-header">
          <h1 class="page-title">Tournaments</h1>
          <div class="tournament-filter">
            <div class="filter-option active" data-filter="all">All</div>
            <div class="filter-option" data-filter="upcoming">Upcoming</div>
            <div class="filter-option" data-filter="active">Active</div>
            <div class="filter-option" data-filter="completed">Completed</div>
          </div>
        </div>
        
        <div id="loadingIndicator">
          <div class="spinner"></div>
        </div>
        
        <div id="tournamentList" class="tournament-list" style="display: none;">
          <!-- Tournament cards will be dynamically inserted here -->
        </div>
        
        <div id="emptyState" class="empty-state" style="display: none;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <h3 class="empty-state-title">No Tournaments Found</h3>
          <p class="empty-state-description">There are currently no tournaments available with the selected filter. Please check back later or try a different filter.</p>
          <button class="button" onclick="loadTournaments('all')">View All Tournaments</button>
        </div>
      </div>
      
      <!-- Tournament Detail Modal -->
      <div id="tournamentModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Tournament Details</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
          </div>
          <div class="modal-body" id="tournamentModalBody">
            <!-- Tournament details will be dynamically inserted here -->
          </div>
          <div class="modal-footer">
            <button class="button" id="registerTournamentButton" onclick="registerForTournament()">Register Now</button>
            <button class="button button-secondary" onclick="closeModal()">Close</button>
          </div>
        </div>
      </div>
      
      <!-- Toast Notification -->
      <div id="toast" class="toast">
        <div class="toast-icon">✓</div>
        <div class="toast-message">Operation successful!</div>
        <button class="toast-close" onclick="hideToast()">&times;</button>
      </div>
      
      <script>
        // Initialize Firebase
        const firebaseConfig = {
          apiKey: '${process.env.VITE_FIREBASE_API_KEY || "demo-api-key"}',
          authDomain: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com',
          projectId: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}',
          storageBucket: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.appspot.com',
          appId: '${process.env.VITE_FIREBASE_APP_ID || "demo-app-id"}'
        };
        
        firebase.initializeApp(firebaseConfig);
        
        // Global variables
        let currentUser = null;
        let selectedTournament = null;
        let tournaments = [];
        
        // Check if user is logged in, if not redirect to home page
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in
            console.log('Tournaments: User is signed in:', user.displayName || user.email);
            currentUser = user;
            updateUserInterface(user);
            loadUserTokens(user.uid);
            loadTournaments('all');
          } else {
            // No user is signed in, redirect to home
            console.log('No user is signed in, redirecting to home');
            window.location.href = '/';
          }
        });
        
        // Update UI with user info
        function updateUserInterface(user) {
          // Show username in greeting
          const profileName = document.getElementById('profileName');
          const profileInitial = document.getElementById('profileInitial');
          
          const displayName = user.displayName || user.email || 'Player';
          profileName.textContent = displayName;
          
          // Show user initial in avatar
          if (displayName) {
            profileInitial.textContent = displayName.charAt(0).toUpperCase();
          }
        }
        
        // Toggle profile dropdown
        function toggleProfileDropdown() {
          const dropdown = document.getElementById('profileDropdown');
          dropdown.classList.toggle('show');
          
          // Close dropdown when clicking outside
          document.addEventListener('click', function closeDropdown(e) {
            if (!e.target.closest('.profile-menu')) {
              dropdown.classList.remove('show');
              document.removeEventListener('click', closeDropdown);
            }
          });
        }
        
        // Handle logout
        function handleLogout() {
          firebase.auth().signOut()
            .then(() => {
              // Sign-out successful, redirect to home
              window.location.href = '/';
            })
            .catch((error) => {
              // An error happened
              console.error('Logout error:', error);
              showToast('error', 'Error during logout. Please try again.');
            });
        }
        
        // Load user token balance
        function loadUserTokens(userId) {
          fetch('/api/user/' + userId + '/tokens')
            .then(response => response.json())
            .then(data => {
              document.getElementById('tokenBalance').textContent = data.balance;
            })
            .catch(error => {
              console.error('Error fetching token balance:', error);
            });
        }
        
        // Add tokens to user (demo/testing functionality)
        function addTokens() {
          if (!currentUser) return;
          
          const amount = prompt('Enter amount of tokens to add:');
          
          if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
            showToast('error', 'Please enter a valid positive number.');
            return;
          }
          
          fetch('/api/user/' + currentUser.uid + '/tokens/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: parseInt(amount) })
          })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                document.getElementById('tokenBalance').textContent = data.newBalance;
                showToast('success', 'Successfully added ' + data.added + ' tokens!');
              } else {
                showToast('error', data.error || 'Failed to add tokens.');
              }
            })
            .catch(error => {
              console.error('Error adding tokens:', error);
              showToast('error', 'Failed to add tokens. Please try again.');
            });
        }
        
        // Load tournaments
        function loadTournaments(filter = 'all') {
          document.getElementById('loadingIndicator').style.display = 'flex';
          document.getElementById('tournamentList').style.display = 'none';
          document.getElementById('emptyState').style.display = 'none';
          
          // Update active filter
          document.querySelectorAll('.filter-option').forEach(option => {
            option.classList.remove('active');
          });
          document.querySelector('.filter-option[data-filter="' + filter + '"]').classList.add('active');
          
          fetch('/api/tournaments')
            .then(response => response.json())
            .then(data => {
              tournaments = data.tournaments;
              
              // Filter tournaments based on selection
              let filteredTournaments = tournaments;
              if (filter !== 'all') {
                filteredTournaments = tournaments.filter(tournament => tournament.status === filter);
              }
              
              if (filteredTournaments.length === 0) {
                document.getElementById('loadingIndicator').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
                return;
              }
              
              renderTournamentList(filteredTournaments);
              
              document.getElementById('loadingIndicator').style.display = 'none';
              document.getElementById('tournamentList').style.display = 'grid';
            })
            .catch(error => {
              console.error('Error fetching tournaments:', error);
              document.getElementById('loadingIndicator').style.display = 'none';
              document.getElementById('emptyState').style.display = 'block';
              showToast('error', 'Failed to load tournaments. Please try again.');
            });
        }
        
        // Render tournament list
        function renderTournamentList(tournaments) {
          const tournamentList = document.getElementById('tournamentList');
          tournamentList.innerHTML = '';
          
          tournaments.forEach(tournament => {
            const tournamentCard = createTournamentCard(tournament);
            tournamentList.appendChild(tournamentCard);
          });
        }
        
        // Create tournament card element
        function createTournamentCard(tournament) {
          const card = document.createElement('div');
          card.className = 'tournament-card';
          
          // Calculate fill percentage for participants
          const fillPercentage = (tournament.participantCount / tournament.maxParticipants) * 100;
          
          // Determine if registration is possible (upcoming and not full)
          const canRegister = tournament.status === 'upcoming' && tournament.participantCount < tournament.maxParticipants;
          
          card.innerHTML = \`
            <div class="tournament-header">
              <div class="tournament-difficulty \${tournament.difficulty}">\${tournament.difficulty}</div>
              <h3 class="tournament-title">\${tournament.name}</h3>
              <div class="tournament-date">Starts: \${tournament.startsDisplay}</div>
            </div>
            <div class="tournament-body">
              <p class="tournament-description">\${tournament.description}</p>
              <div class="tournament-meta">
                <div class="meta-item">
                  <div class="meta-label">Categories</div>
                  <div class="meta-value">\${tournament.categories.length} Categories</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Rounds</div>
                  <div class="meta-value">\${tournament.roundCount} Rounds</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Status</div>
                  <div class="meta-value">\${tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Difficulty</div>
                  <div class="meta-value">\${tournament.difficulty.charAt(0).toUpperCase() + tournament.difficulty.slice(1)}</div>
                </div>
              </div>
              <div class="prize-pool">
                <div class="prize-title">Prize Pool</div>
                <div class="prize-distribution">
                  <div class="prize-place">
                    <div class="prize-position">1st</div>
                    <div class="prize-amount">\${tournament.prize.first}</div>
                  </div>
                  <div class="prize-place">
                    <div class="prize-position">2nd</div>
                    <div class="prize-amount">\${tournament.prize.second}</div>
                  </div>
                  <div class="prize-place">
                    <div class="prize-position">3rd</div>
                    <div class="prize-amount">\${tournament.prize.third}</div>
                  </div>
                </div>
              </div>
              <button class="button" onclick="openTournamentDetail('\${tournament.id}')">\${canRegister ? 'Register Now' : 'View Details'}</button>
            </div>
            <div class="tournament-footer">
              <div class="entry-fee">
                <div class="fee-icon">T</div>
                <div class="fee-value">\${tournament.entryFee}</div>
              </div>
              <div class="participants-info">
                \${tournament.participantCount}/\${tournament.maxParticipants} Participants
              </div>
            </div>
          \`;
          
          return card;
        }
        
        // Open tournament detail modal
        function openTournamentDetail(tournamentId) {
          // Fetch tournament details
          fetch('/api/tournaments/' + tournamentId)
            .then(response => response.json())
            .then(data => {
              selectedTournament = data.tournament;
              renderTournamentDetail(selectedTournament);
              document.getElementById('tournamentModal').style.display = 'flex';
            })
            .catch(error => {
              console.error('Error fetching tournament details:', error);
              showToast('error', 'Failed to load tournament details. Please try again.');
            });
        }
        
        // Render tournament detail in modal
        function renderTournamentDetail(tournament) {
          const modalBody = document.getElementById('tournamentModalBody');
          const registerButton = document.getElementById('registerTournamentButton');
          
          // Determine if registration is possible
          const canRegister = tournament.status === 'upcoming' && tournament.participantCount < tournament.maxParticipants;
          const isRegistered = tournament.participants.includes(currentUser?.uid);
          
          // Update register button text and state
          if (isRegistered) {
            registerButton.textContent = 'Already Registered';
            registerButton.disabled = true;
          } else if (!canRegister) {
            registerButton.textContent = tournament.status === 'upcoming' ? 'Tournament Full' : 'Registration Closed';
            registerButton.disabled = true;
          } else {
            registerButton.textContent = 'Register Now';
            registerButton.disabled = false;
          }
          
          // Create rounds HTML
          let roundsHTML = '';
          tournament.rounds.forEach((round, index) => {
            roundsHTML += \`
              <div class="round-item">
                <div class="round-name">\${round.name}</div>
                <div class="round-details">
                  \${round.questionCount} Questions, \${Math.floor(round.timeLimit / 60)}m \${round.timeLimit % 60}s
                </div>
              </div>
            \`;
          });
          
          // Create prize HTML
          let prizeHTML = '';
          Object.entries(tournament.prize).forEach(([place, amount]) => {
            let placeName;
            switch (place) {
              case 'first': placeName = '1st Place'; break;
              case 'second': placeName = '2nd Place'; break;
              case 'third': placeName = '3rd Place'; break;
              default: placeName = \`\${place.charAt(0).toUpperCase()}\${place.slice(1)} Place\`;
            }
            
            prizeHTML += \`
              <div class="round-item">
                <div class="round-name">\${placeName}</div>
                <div class="round-details">\${amount} Tokens</div>
              </div>
            \`;
          });
          
          modalBody.innerHTML = \`
            <div class="tournament-detail-header">
              <h3>\${tournament.name}</h3>
              <p>\${tournament.description}</p>
            </div>
            
            <div class="tournament-meta">
              <div class="meta-item">
                <div class="meta-label">Status</div>
                <div class="meta-value">\${tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Difficulty</div>
                <div class="meta-value">\${tournament.difficulty.charAt(0).toUpperCase() + tournament.difficulty.slice(1)}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Entry Fee</div>
                <div class="meta-value">\${tournament.entryFee} Tokens</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Participants</div>
                <div class="meta-value">\${tournament.participantCount}/\${tournament.maxParticipants}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Starts</div>
                <div class="meta-value">\${tournament.startsDisplay}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Ends</div>
                <div class="meta-value">\${tournament.endsDisplay}</div>
              </div>
            </div>
            
            <div class="tournament-rounds">
              <div class="rounds-title">Tournament Format</div>
              <div class="round-list">
                \${roundsHTML}
              </div>
            </div>
            
            <div class="tournament-rounds">
              <div class="rounds-title">Prize Distribution</div>
              <div class="round-list">
                \${prizeHTML}
              </div>
            </div>
          \`;
        }
        
        // Close tournament detail modal
        function closeModal() {
          document.getElementById('tournamentModal').style.display = 'none';
        }
        
        // Register for tournament
        function registerForTournament() {
          if (!currentUser || !selectedTournament) return;
          
          const userTokenBalance = parseInt(document.getElementById('tokenBalance').textContent);
          
          // Check if user has enough tokens
          if (userTokenBalance < selectedTournament.entryFee) {
            showToast('error', \`Insufficient tokens. You need \${selectedTournament.entryFee} tokens to register.\`);
            return;
          }
          
          // Confirm registration
          if (!confirm(\`Are you sure you want to register for \${selectedTournament.name}? This will cost \${selectedTournament.entryFee} tokens.\`)) {
            return;
          }
          
          fetch('/api/tournaments/' + selectedTournament.id + '/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser.uid })
          })
            .then(response => {
              if (response.ok) {
                return response.json();
              }
              return response.json().then(err => { throw new Error(err.error) });
            })
            .then(data => {
              // Update token balance
              document.getElementById('tokenBalance').textContent = data.newBalance;
              
              // Update tournament detail modal
              selectedTournament.participants.push(currentUser.uid);
              selectedTournament.participantCount++;
              renderTournamentDetail(selectedTournament);
              
              // Reload tournaments to update card
              loadTournaments(document.querySelector('.filter-option.active').dataset.filter);
              
              showToast('success', 'Successfully registered for tournament!');
            })
            .catch(error => {
              console.error('Error registering for tournament:', error);
              showToast('error', error.message || 'Failed to register for tournament.');
            });
        }
        
        // Show toast notification
        function showToast(type, message) {
          const toast = document.getElementById('toast');
          toast.className = 'toast ' + type;
          toast.querySelector('.toast-message').textContent = message;
          toast.querySelector('.toast-icon').textContent = type === 'success' ? '✓' : '✕';
          
          // Show toast
          setTimeout(() => {
            toast.classList.add('show');
          }, 100);
          
          // Auto hide after 5 seconds
          setTimeout(hideToast, 5000);
        }
        
        // Hide toast notification
        function hideToast() {
          const toast = document.getElementById('toast');
          toast.classList.remove('show');
        }
        
        // Set up event listeners for filter options
        document.addEventListener('DOMContentLoaded', () => {
          document.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', function() {
              const filter = this.dataset.filter;
              loadTournaments(filter);
            });
          });
          
          // Close modal when clicking outside
          window.addEventListener('click', function(event) {
            const modal = document.getElementById('tournamentModal');
            if (event.target === modal) {
              closeModal();
            }
          });
        });
      </script>
    </body>
    </html>
  `);
});

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard - MindArena</title>
      ${commonJsForHead}
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #2D3436 0%, #000000 100%);
          color: white;
          min-height: 100vh;
        }
        .navbar {
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: bold;
          font-size: 20px;
          color: white;
          text-decoration: none;
        }
        .logo-icon {
          width: 40px;
          height: 40px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-icon svg {
          width: 24px;
          height: 24px;
          fill: white;
        }
        .nav-links {
          display: flex;
          gap: 24px;
          align-items: center;
        }
        .nav-link {
          color: #B2BEC3;
          text-decoration: none;
          transition: color 0.3s ease;
          font-weight: 500;
        }
        .nav-link:hover {
          color: #6C5CE7;
        }
        .nav-link.active {
          color: #6C5CE7;
          font-weight: 600;
        }
        .profile-menu {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          position: relative;
        }
        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #6C5CE7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          color: white;
        }
        .profile-name {
          font-weight: 500;
          color: white;
        }
        .content {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .greeting {
          font-size: 24px;
          font-weight: 600;
        }
        .button {
          display: inline-block;
          background-color: #6C5CE7;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        .button:hover {
          background-color: #5541c7;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(108, 92, 231, 0.3);
        }
        .logout-button {
          background-color: transparent;
          border: 2px solid #6C5CE7;
          color: #6C5CE7;
        }
        .logout-button:hover {
          background-color: rgba(108, 92, 231, 0.1);
        }
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        .card {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        .card:hover {
          background-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-5px);
          border-color: rgba(108, 92, 231, 0.5);
        }
        .card-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #6C5CE7;
        }
        .card-value {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .card-footer {
          font-size: 14px;
          color: #B2BEC3;
        }
        .section-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 16px;
          color: white;
        }
        .upcoming-games {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }
        .game-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }
        .game-item {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .game-item:hover {
          background-color: rgba(108, 92, 231, 0.2);
        }
        .game-title {
          font-weight: 600;
          margin-bottom: 8px;
        }
        .game-time {
          font-size: 14px;
          color: #B2BEC3;
          margin-bottom: 12px;
        }
        .game-players {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #DFE6E9;
        }
        .player-count {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 4px 8px;
        }
        #userDisplay {
          font-weight: bold;
          color: #6C5CE7;
        }
        /* Game interface styles */
        .game-area {
          display: none;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          max-width: 800px;
          margin: 0 auto 30px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        
        /* Profile dropdown styles */
        .profile-menu {
          position: relative;
          display: flex;
          align-items: center;
        }
        .profile-avatar {
          width: 40px;
          height: 40px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .profile-avatar:hover {
          background-color: #5A49DB;
          transform: scale(1.05);
        }
        .profile-dropdown {
          position: absolute;
          top: 50px;
          right: 0;
          background-color: #2D3436;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 0;
          min-width: 180px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          display: none;
          z-index: 100;
        }
        .profile-dropdown.show {
          display: block;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown-item {
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          text-decoration: none;
          transition: background-color 0.2s ease;
          cursor: pointer;
        }
        .dropdown-item:hover {
          background-color: rgba(108, 92, 231, 0.2);
        }
        .dropdown-item svg {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }
        .dropdown-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.1);
          margin: 8px 0;
        }
      </style>
      <!-- Firebase App (the core Firebase SDK) -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
      <!-- Firebase Auth -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
    </head>
    <body>
      <div class="navbar">
        <a href="/dashboard" class="logo">
          <div class="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
            </svg>
          </div>
          MindArena
        </a>
        
        <div class="nav-links">
          <a href="/dashboard" class="nav-link active">Dashboard</a>
          <a href="/play" class="nav-link">Play Now</a>
          <a href="/tournaments" class="nav-link">Tournaments</a>
          <a href="/battle-pass" class="nav-link">Battle Pass</a>
          <a href="#" class="nav-link">Leaderboard</a>
        </div>
        
        <div class="profile-menu">
          <div class="profile-avatar" id="profileInitial" onclick="toggleProfileDropdown()">?</div>
          <div class="profile-dropdown" id="profileDropdown">
            <div class="dropdown-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              <span id="profileName">...</span>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" onclick="window.location.href='/account'">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
              Account Settings
            </div>
            <div class="dropdown-item" onclick="handleLogout()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
              Logout
            </div>
          </div>
        </div>
      </div>
      
      <div class="content">
        <div id="mainContent">
          <div class="dashboard-header">
            <div class="greeting">Welcome to MindArena, <span id="userDisplay">User</span>!</div>
            <div class="action-buttons">
              <div class="token-display">
                <span class="token-icon">T</span>
                <span id="tokenBalance">0</span>
                <button class="button button-small" onclick="addTokens()">+</button>
              </div>
              <a href="/play" class="button" id="playButton">Play Quick Match</a>
            </div>
          </div>
          
          <style>
            .action-buttons {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .token-display {
              display: flex;
              align-items: center;
              gap: 8px;
              background-color: rgba(0, 0, 0, 0.3);
              padding: 6px 12px;
              border-radius: 8px;
              font-weight: bold;
              color: #6C5CE7;
            }
            .token-icon {
              width: 24px;
              height: 24px;
              background-color: #6C5CE7;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 14px;
            }
            .button-small {
              padding: 4px 8px;
              font-size: 14px;
            }
          </style>
          
          <div class="cards">
            <div class="card">
              <div class="card-title">Total Matches</div>
              <div class="card-value">0</div>
              <div class="card-footer">Play your first match to get started</div>
            </div>
            
            <div class="card">
              <div class="card-title">Win Rate</div>
              <div class="card-value">0%</div>
              <div class="card-footer">Win matches to improve your stats</div>
            </div>
            
            <div class="card">
              <div class="card-title">MindArena Rank</div>
              <div class="card-value">Novice</div>
              <div class="card-footer">Complete matches to increase your rank</div>
            </div>
            
            <div class="card">
              <div class="card-title">Battle Pass Level</div>
              <div class="card-value">0</div>
              <div class="card-footer">Earn XP to level up your Battle Pass</div>
            </div>
          </div>
          
          <div class="upcoming-games">
            <div class="section-title">Upcoming Tournaments</div>
            <div class="game-list">
              <div class="game-item" onclick="window.location.href='/tournaments'">
                <div class="game-title">Weekly Challenge</div>
                <div class="game-time">Starts in 2 days</div>
                <div class="game-players">
                  <div class="player-count">0 players registered</div>
                </div>
              </div>
              
              <div class="game-item" onclick="window.location.href='/tournaments'">
                <div class="game-title">Science Showdown</div>
                <div class="game-time">Starts in 4 days</div>
                <div class="game-players">
                  <div class="player-count">0 players registered</div>
                </div>
              </div>
              
              <div class="game-item" onclick="window.location.href='/tournaments'">
                <div class="game-title">History Masters</div>
                <div class="game-time">Starts in 1 week</div>
                <div class="game-players">
                  <div class="player-count">0 players registered</div>
                </div>
              </div>
              
              <div class="game-item" onclick="window.location.href='/tournaments'">
                <div class="game-title">Ultimate Quiz Championship</div>
                <div class="game-time">Starts in 2 weeks</div>
                <div class="game-players">
                  <div class="player-count">0 players registered</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Game area will be dynamically inserted here -->
        <div id="gameArea" class="game-area"></div>
      </div>
      
      <script>
        // Initialize Firebase
        const firebaseConfig = {
          apiKey: '${process.env.VITE_FIREBASE_API_KEY || "demo-api-key"}',
          authDomain: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com',
          projectId: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}',
          storageBucket: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.appspot.com',
          appId: '${process.env.VITE_FIREBASE_APP_ID || "demo-app-id"}'
        };
        
        firebase.initializeApp(firebaseConfig);
        
        // Check if user is logged in, if not redirect to home page
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in
            console.log('Dashboard: User is signed in:', user.displayName || user.email);
            updateUserInterface(user);
            
            // Load user token balance
            loadUserTokens(user.uid);
            
            // Connect to WebSocket for game functionality
            connectWebSocket();
          } else {
            // No user is signed in, redirect to home
            console.log('No user is signed in, redirecting to home');
            window.location.href = '/';
          }
        });
        
        // Load user token balance
        function loadUserTokens(userId) {
          fetch('/api/user/' + userId + '/tokens')
            .then(response => response.json())
            .then(data => {
              document.getElementById('tokenBalance').textContent = data.balance;
            })
            .catch(error => {
              console.error('Error fetching token balance:', error);
            });
        }
        
        // Add tokens to user (demo/testing functionality)
        function addTokens() {
          const user = firebase.auth().currentUser;
          if (!user) return;
          
          const amount = prompt('Enter amount of tokens to add:');
          
          if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
            alert('Please enter a valid positive number.');
            return;
          }
          
          fetch('/api/user/' + user.uid + '/tokens/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: parseInt(amount) })
          })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                document.getElementById('tokenBalance').textContent = data.newBalance;
                alert('Successfully added ' + data.added + ' tokens!');
              } else {
                alert(data.error || 'Failed to add tokens.');
              }
            })
            .catch(error => {
              console.error('Error adding tokens:', error);
              alert('Failed to add tokens. Please try again.');
            });
        }
        
        // Update UI with user info
        function updateUserInterface(user) {
          // Show username in greeting
          const userDisplay = document.getElementById('userDisplay');
          const profileName = document.getElementById('profileName');
          const profileInitial = document.getElementById('profileInitial');
          
          const displayName = user.displayName || user.email || 'Player';
          userDisplay.textContent = displayName;
          profileName.textContent = displayName;
          
          // Show user initial in avatar
          if (displayName) {
            profileInitial.textContent = displayName.charAt(0).toUpperCase();
          }
        }
        
        // Toggle profile dropdown
        function toggleProfileDropdown() {
          const dropdown = document.getElementById('profileDropdown');
          dropdown.classList.toggle('show');
          
          // Close dropdown when clicking outside
          document.addEventListener('click', function closeDropdown(e) {
            if (!e.target.closest('.profile-menu')) {
              dropdown.classList.remove('show');
              document.removeEventListener('click', closeDropdown);
            }
          });
        }
        
        // Handle logout
        function handleLogout() {
          // Get current user
          const user = firebase.auth().currentUser;
          
          // Send logout message to WebSocket server if connected
          if (socket && socket.readyState === WebSocket.OPEN && user) {
            // Send logout message
            socket.send(JSON.stringify({
              type: 'logout',
              userId: user.uid
            }));
            
            // Close WebSocket connection
            socket.close();
          }
          
          firebase.auth().signOut()
            .then(() => {
              // Sign-out successful, redirect to home
              window.location.href = '/';
            })
            .catch((error) => {
              // An error happened
              console.error('Logout error:', error);
              alert('Error during logout. Please try again.');
            });
        }
        
        // Basic WebSocket connection setup
        let socket;
        let gameData = {
          gameId: null,
          opponent: null,
          gameState: 'idle' // idle, searching, waiting, playing, finished
        };
        
        // Connect to WebSocket server
        function connectWebSocket() {
          if (socket && socket.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
          }
          
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = protocol + '//' + window.location.host + '/ws';
          
          try {
            socket = new WebSocket(wsUrl);
            
            socket.onopen = function() {
              console.log('WebSocket connection established');
              
              // Authenticate with WebSocket server
              const user = firebase.auth().currentUser;
              if (user) {
                socket.send(JSON.stringify({
                  type: 'auth',
                  userId: user.uid,
                  displayName: user.displayName || user.email
                }));
              }
            };
            
            socket.onmessage = function(event) {
              const message = JSON.parse(event.data);
              console.log('Received WebSocket message:', message);
              
              // Handle message types here
            };
            
            socket.onclose = function() {
              console.log('WebSocket connection closed');
            };
            
            socket.onerror = function(error) {
              console.error('WebSocket error:', error);
            };
          } catch (error) {
            console.error('Error connecting to WebSocket:', error);
          }
        }
        
        // Quick match functionality
        function startQuickMatch() {
          alert('Quick Match feature is coming soon! Stay tuned for real-time multiplayer quiz battles.');
          
          // Example of what would happen:
          const gameArea = document.getElementById('gameArea');
          gameArea.style.display = 'block';
          gameArea.innerHTML = '<h2>Coming Soon!</h2><p>The multiplayer quiz game system is under development. Check back soon for exciting real-time quiz battles!</p><button class="button" onclick="document.getElementById(\'gameArea\').style.display=\'none\';">Close</button>';
          
          // Hide main content
          document.getElementById('mainContent').style.display = 'none';
        }
      </script>
    </body>
    </html>
  `);
});

// Tournament routes
app.get('/api/tournaments', (req, res) => {
  // Return list of tournaments with formatted display dates and participant counts
  const formattedTournaments = tournaments.map(tournament => ({
    id: tournament.id,
    name: tournament.name,
    description: tournament.description,
    entryFee: tournament.entryFee,
    prize: tournament.prize,
    startsAt: tournament.startsAt,
    endsAt: tournament.endsAt,
    startsDisplay: formatDateDisplay(tournament.startsAt),
    status: tournament.status,
    participantCount: tournament.participants.length,
    maxParticipants: tournament.maxParticipants,
    categories: tournament.categories,
    difficulty: tournament.difficulty,
    roundCount: tournament.rounds.length
  }));
  
  res.json({ tournaments: formattedTournaments });
});

app.get('/api/tournaments/:id', (req, res) => {
  const tournament = tournaments.find(t => t.id === req.params.id);
  
  if (!tournament) {
    return res.status(404).json({ error: 'Tournament not found' });
  }
  
  // Format the tournament data for the client
  const formattedTournament = {
    ...tournament,
    startsDisplay: formatDateDisplay(tournament.startsAt),
    endsDisplay: formatDateDisplay(tournament.endsAt),
    participantCount: tournament.participants.length
  };
  
  res.json({ tournament: formattedTournament });
});

app.post('/api/tournaments/:id/register', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const result = registerForTournament(userId, req.params.id);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json({ error: result.message });
  }
});

// API endpoint to get user token balance
app.get('/api/user/:userId/tokens', (req, res) => {
  const userId = req.params.userId;
  const balance = userTokens.get(userId) || 0;
  
  res.json({ userId, balance });
});

// API endpoint to add tokens to user (for demo/testing)
app.post('/api/user/:userId/tokens/add', (req, res) => {
  const userId = req.params.userId;
  const { amount } = req.body;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount required' });
  }
  
  const currentBalance = userTokens.get(userId) || 0;
  const newBalance = currentBalance + parseInt(amount, 10);
  
  userTokens.set(userId, newBalance);
  
  res.json({ 
    success: true, 
    userId, 
    previousBalance: currentBalance,
    added: parseInt(amount, 10),
    newBalance: newBalance
  });
});

// Play page route
app.get('/play', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Play Now - MindArena</title>
      <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
      <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
      ${commonJsForHead}
      <style>
        /* General styles */
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #2D3436 0%, #000000 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        a {
          text-decoration: none;
          color: inherit;
        }
        .container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .content {
          flex: 1;
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        .button {
          display: inline-block;
          background-color: #6C5CE7;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }
        .button:hover {
          background-color: #5A49DB;
          transform: translateY(-2px);
        }
        .button:disabled {
          background-color: #6C5CE7;
          opacity: 0.5;
          cursor: not-allowed;
        }
        .button-large {
          font-size: 18px;
          padding: 16px 32px;
        }
        .button-danger {
          background-color: #d63031;
        }
        .button-danger:hover {
          background-color: #b71c1c;
        }
        
        /* Nav bar styles */
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          background-color: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: white;
          display: flex;
          align-items: center;
        }
        .logo-icon {
          width: 36px;
          height: 36px;
          background-color: #6C5CE7;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
        }
        .nav-links {
          display: flex;
          gap: 16px;
        }
        .nav-link {
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .nav-link.active {
          background-color: rgba(108, 92, 231, 0.2);
          color: #6C5CE7;
        }
        .profile-menu {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .profile-avatar {
          width: 40px;
          height: 40px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .profile-name {
          font-weight: bold;
        }
        .logout-button {
          padding: 8px 16px;
          font-size: 14px;
        }
        
        /* Play page specific styles */
        .play-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          margin-top: 32px;
        }
        .matchmaking-box {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
          text-align: center;
          max-width: 600px;
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .matchmaking-title {
          font-size: 28px;
          margin: 0 0 16px 0;
        }
        .matchmaking-description {
          color: #B2BEC3;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .matchmaking-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        .user-count {
          margin-top: 16px;
          color: #B2BEC3;
          font-size: 14px;
        }
        .matchmaking-status {
          margin-top: 24px;
          font-size: 18px;
          font-weight: bold;
        }
        
        /* Game preparation */
        .game-preparation {
          display: none;
          text-align: center;
          margin-top: 32px;
        }
        .opponent-info {
          margin-bottom: 24px;
        }
        .opponent-name {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .vs-text {
          font-size: 36px;
          margin: 16px 0;
          font-weight: bold;
          color: #6C5CE7;
        }
        .preparation-timer {
          font-size: 48px;
          margin: 24px 0;
          font-weight: bold;
        }
        
        /* Game interface */
        .game-interface {
          display: none;
          max-width: 800px;
          margin: 0 auto;
        }
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .player-score {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .player-name {
          font-weight: bold;
        }
        .score {
          background-color: #6C5CE7;
          padding: 4px 12px;
          border-radius: 16px;
          font-weight: bold;
        }
        .game-timer {
          font-size: 24px;
          font-weight: bold;
          color: #6C5CE7;
        }
        .question-container {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .question-text {
          font-size: 20px;
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .answers-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .answer-option {
          background-color: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 16px;
          text-align: left;
        }
        .answer-option:hover {
          background-color: rgba(108, 92, 231, 0.1);
          border-color: #6C5CE7;
        }
        .answer-option.selected {
          background-color: rgba(108, 92, 231, 0.3);
          border-color: #6C5CE7;
        }
        .answer-option.correct {
          background-color: rgba(46, 204, 113, 0.3);
          border-color: #2ecc71;
        }
        .answer-option.incorrect {
          background-color: rgba(231, 76, 60, 0.3);
          border-color: #e74c3c;
        }
        
        /* Game results */
        .game-results {
          display: none;
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }
        .results-title {
          font-size: 32px;
          margin-bottom: 16px;
        }
        .results-subtitle {
          color: #B2BEC3;
          margin-bottom: 32px;
          font-size: 18px;
        }
        .results-container {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .results-header {
          display: flex;
          justify-content: space-around;
          margin-bottom: 24px;
          font-size: 20px;
          font-weight: bold;
        }
        .player-result {
          text-align: center;
        }
        .player-result-name {
          margin-bottom: 8px;
        }
        .player-result-score {
          font-size: 36px;
          color: #6C5CE7;
        }
        .versus-divider {
          font-size: 24px;
          color: #B2BEC3;
        }
        .winner-badge {
          display: inline-block;
          background-color: #f1c40f;
          color: #2c3e50;
          padding: 4px 12px;
          border-radius: 16px;
          font-weight: bold;
          margin-top: 8px;
          font-size: 14px;
        }
        .tie-badge {
          display: inline-block;
          background-color: #3498db;
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-weight: bold;
          margin-top: 8px;
          font-size: 14px;
        }
        .results-stats {
          display: flex;
          justify-content: space-around;
          margin-bottom: 24px;
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .stat-label {
          color: #B2BEC3;
          font-size: 14px;
        }
        .results-rewards {
          background-color: rgba(108, 92, 231, 0.1);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          border: 1px solid rgba(108, 92, 231, 0.3);
        }
        .rewards-title {
          font-size: 18px;
          margin-bottom: 16px;
          color: #6C5CE7;
        }
        .reward-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .reward-amount {
          font-weight: bold;
        }
        .results-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 32px;
        }
        
        /* Loading spinner */
        .spinner {
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: #6C5CE7;
          animation: spin 1s linear infinite;
          margin-right: 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Toast notification */
        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 16px;
          background-color: #2D3436;
          border-left: 4px solid #6C5CE7;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          min-width: 300px;
          transform: translateY(100px);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          z-index: 1000;
        }
        .toast.show {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
        }
        .toast-success {
          border-color: #00b894;
        }
        .toast-error {
          border-color: #d63031;
        }
        .toast-icon {
          margin-right: 12px;
          width: 24px;
          height: 24px;
          background-color: #6C5CE7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toast-success .toast-icon {
          background-color: #00b894;
        }
        .toast-error .toast-icon {
          background-color: #d63031;
        }
        .toast-message {
          flex: 1;
        }
        .toast-close {
          background: none;
          border: none;
          color: #B2BEC3;
          cursor: pointer;
          font-size: 16px;
          margin-left: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="navbar">
          <a href="/" class="logo">
            <div class="logo-icon">M</div>
            MindArena
          </a>
          
          <div class="nav-links">
            <a href="/dashboard" class="nav-link">Dashboard</a>
            <a href="/play" class="nav-link active">Play Now</a>
            <a href="/tournaments" class="nav-link">Tournaments</a>
            <a href="/battle-pass" class="nav-link">Battle Pass</a>
            <a href="/cosmetics" class="nav-link">Cosmetics</a>
            <a href="#" class="nav-link">Leaderboard</a>
          </div>
          
          <div class="profile-menu">
            <div class="profile-avatar" id="profileInitial" onclick="toggleProfileDropdown()">?</div>
            <div class="profile-dropdown" id="profileDropdown">
              <div class="dropdown-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <span id="profileName">...</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" onclick="window.location.href='/account'">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                Account Settings
              </div>
              <div class="dropdown-item" onclick="handleLogout()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                Logout
              </div>
            </div>
          </div>
        </div>
        
        <div class="content">
          <!-- Matchmaking Section -->
          <div class="play-container" id="matchmakingContainer">
            <div class="matchmaking-box">
              <h1 class="matchmaking-title">Quick Match</h1>
              <p class="matchmaking-description">Challenge your knowledge against other players in a fast-paced quiz battle. Get matched with an opponent of similar skill level.</p>
              
              <div class="matchmaking-actions">
                <button class="button button-large" id="findMatchButton" onclick="startQuickMatch()">Find Match</button>
              </div>
              
              <div class="user-count" id="onlineUsersCount">
                <span id="userCount">0</span> players online
              </div>
              
              <div class="matchmaking-status" id="matchmakingStatus" style="display: none;">
                <div class="spinner"></div>
                Looking for opponents...
                <button class="button button-danger" id="cancelButton" onclick="cancelMatchmaking()" style="margin-top: 16px;">Cancel</button>
              </div>
            </div>
            
            <div class="matchmaking-box">
              <h2 class="matchmaking-title">Play with Friends</h2>
              <p class="matchmaking-description">Create a private room and invite your friends to play together. Share the room code with them to start a match.</p>
              
              <div class="matchmaking-actions">
                <button class="button" onclick="createPrivateRoom()">Create Room</button>
                <button class="button" onclick="joinPrivateRoom()">Join Room</button>
              </div>
            </div>
          </div>
          
          <!-- Game Preparation -->
          <div class="game-preparation" id="gamePreparation">
            <h2>Get Ready!</h2>
            <div class="opponent-info">
              <p>You're playing against</p>
              <div class="opponent-name" id="opponentName">Player123</div>
            </div>
            
            <div class="vs-text">VS</div>
            
            <p>Game starts in</p>
            <div class="preparation-timer" id="preparationTimer">3</div>
          </div>
          
          <!-- Game Interface -->
          <div class="game-interface" id="gameInterface">
            <div class="game-header">
              <div class="player-score">
                <span class="player-name" id="playerName">You</span>
                <span class="score" id="playerScore">0</span>
              </div>
              
              <div class="game-timer" id="questionTimer">15</div>
              
              <div class="player-score">
                <span class="score" id="opponentScore">0</span>
                <span class="player-name" id="opponentNameInGame">Opponent</span>
              </div>
            </div>
            
            <div class="question-container">
              <div class="question-text" id="questionText">
                Loading question...
              </div>
              
              <div class="answers-grid" id="answersGrid">
                <button class="answer-option" data-index="0" onclick="selectAnswer(0)">Loading...</button>
                <button class="answer-option" data-index="1" onclick="selectAnswer(1)">Loading...</button>
                <button class="answer-option" data-index="2" onclick="selectAnswer(2)">Loading...</button>
                <button class="answer-option" data-index="3" onclick="selectAnswer(3)">Loading...</button>
              </div>
            </div>
          </div>
          
          <!-- Game Results -->
          <div class="game-results" id="gameResults">
            <h2 class="results-title">Game Over</h2>
            <p class="results-subtitle" id="resultSubtitle">You won the match!</p>
            
            <div class="results-container">
              <div class="results-header">
                <div class="player-result">
                  <div class="player-result-name">You</div>
                  <div class="player-result-score" id="finalPlayerScore">0</div>
                  <div class="winner-badge" id="playerWinnerBadge" style="display: none;">Winner</div>
                </div>
                
                <div class="versus-divider">vs</div>
                
                <div class="player-result">
                  <div class="player-result-name" id="resultOpponentName">Opponent</div>
                  <div class="player-result-score" id="finalOpponentScore">0</div>
                  <div class="winner-badge" id="opponentWinnerBadge" style="display: none;">Winner</div>
                </div>
              </div>
              
              <div class="tie-badge" id="tieBadge" style="display: none;">Tie Game</div>
              
              <div class="results-stats">
                <div class="stat-item">
                  <div class="stat-value" id="correctAnswers">0</div>
                  <div class="stat-label">Correct Answers</div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-value" id="avgTime">0.0s</div>
                  <div class="stat-label">Avg. Response Time</div>
                </div>
                
                <div class="stat-item">
                  <div class="stat-value" id="streakCount">0</div>
                  <div class="stat-label">Best Streak</div>
                </div>
              </div>
              
              <div class="results-rewards">
                <div class="rewards-title">Rewards Earned</div>
                
                <div class="reward-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#f1c40f">
                    <path d="M0 0h24v24H0V0z" fill="none"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                  </svg>
                  <span class="reward-amount" id="tokensEarned">25</span> Tokens
                </div>
                
                <div class="reward-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#6C5CE7">
                    <path d="M0 0h24v24H0V0z" fill="none"/>
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z"/>
                  </svg>
                  <span class="reward-amount" id="xpEarned">100</span> Battle Pass XP
                </div>
              </div>
            </div>
            
            <div class="results-actions">
              <button class="button" onclick="playAgain()">Play Again</button>
              <button class="button" onclick="returnToDashboard()">Return to Dashboard</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Toast Notification -->
      <div id="toast" class="toast">
        <div class="toast-icon">✓</div>
        <div class="toast-message" id="toastMessage">Operation successful!</div>
        <button class="toast-close" onclick="hideToast()">&times;</button>
      </div>
      
      <script>
        // Initialize Firebase
        const firebaseConfig = {
          apiKey: '${process.env.VITE_FIREBASE_API_KEY || "demo-api-key"}',
          authDomain: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.firebaseapp.com',
          projectId: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}',
          storageBucket: '${process.env.VITE_FIREBASE_PROJECT_ID || "demo-project"}.appspot.com',
          appId: '${process.env.VITE_FIREBASE_APP_ID || "demo-app-id"}'
        };
        
        firebase.initializeApp(firebaseConfig);
        
        // Global variables
        let currentUser = null;
        let socket = null;
        let matchmakingTimer = null;
        let gameInProgress = false;
        let gameData = {
          currentQuestion: 0,
          totalQuestions: 0,
          scores: {
            player: 0,
            opponent: 0
          },
          selectedAnswer: null,
          correctAnswers: 0,
          responseTimes: [],
          streakCount: 0,
          currentStreak: 0,
          questionStartTime: 0
        };
        
        // Check if user is logged in, if not redirect to home page
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in
            console.log('Play: User is signed in:', user.displayName || user.email);
            currentUser = user;
            updateUserInterface(user);
            connectWebSocket();
            updateOnlineUserCount();
          } else {
            // No user is signed in, redirect to home
            console.log('No user is signed in, redirecting to home');
            window.location.href = '/';
          }
        });
        
        // Update UI with user info
        function updateUserInterface(user) {
          // Show username in greeting
          const profileName = document.getElementById('profileName');
          const profileInitial = document.getElementById('profileInitial');
          const playerName = document.getElementById('playerName');
          
          const displayName = user.displayName || user.email || 'Player';
          profileName.textContent = displayName;
          playerName.textContent = "You";
          
          // Show user initial in avatar
          if (displayName) {
            profileInitial.textContent = displayName.charAt(0).toUpperCase();
          }
        }
        
        // Toggle profile dropdown
        function toggleProfileDropdown() {
          const dropdown = document.getElementById('profileDropdown');
          dropdown.classList.toggle('show');
          
          // Close dropdown when clicking outside
          document.addEventListener('click', function closeDropdown(e) {
            if (!e.target.closest('.profile-menu')) {
              dropdown.classList.remove('show');
              document.removeEventListener('click', closeDropdown);
            }
          });
        }
        
        // Handle logout
        function handleLogout() {
          if (gameInProgress) {
            if (!confirm("A game is in progress. Are you sure you want to logout? You'll forfeit the current match.")) {
              return;
            }
          }
          
          // Get current user
          const user = firebase.auth().currentUser;
          
          // Send logout message to WebSocket server if connected
          if (socket && socket.readyState === WebSocket.OPEN && user) {
            // Send logout message
            socket.send(JSON.stringify({
              type: 'logout',
              userId: user.uid
            }));
            
            // Close the WebSocket connection
            socket.close();
          }
          
          firebase.auth().signOut()
            .then(() => {
              // Sign-out successful, redirect to home
              window.location.href = '/';
            })
            .catch((error) => {
              // An error happened
              console.error('Logout error:', error);
              showToast('error', 'Error during logout. Please try again.');
            });
        }
        
        // Connect to WebSocket
        function connectWebSocket() {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;
          
          socket = new WebSocket(wsUrl);
          
          socket.onopen = function() {
            console.log('WebSocket connection established');
            authenticateWebSocket();
          };
          
          socket.onmessage = function(event) {
            handleWebSocketMessage(event);
          };
          
          socket.onclose = function() {
            console.log('WebSocket connection closed');
            // Try to reconnect after a delay
            setTimeout(connectWebSocket, 3000);
          };
          
          socket.onerror = function(error) {
            console.error('WebSocket error:', error);
            showToast('error', 'Connection error. Trying to reconnect...');
          };
        }
        
        // Authenticate WebSocket
        function authenticateWebSocket() {
          if (currentUser && socket && socket.readyState === WebSocket.OPEN) {
            // Send authentication message
            socket.send(JSON.stringify({
              type: 'auth',
              userId: currentUser.uid,
              username: currentUser.displayName || currentUser.email || 'User'
            }));
          }
        }
        
        // Handle WebSocket messages
        function handleWebSocketMessage(event) {
          try {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data);
            
            switch (data.type) {
              case 'online_users':
                updateOnlineUserCount(data.count);
                break;
                
              case 'matchmaking_status':
                updateMatchmakingStatus(data.status, data.message);
                break;
                
              case 'match_found':
                showGamePreparation(data.opponent.username);
                break;
                
              case 'game_start':
                showGameInterface();
                break;
                
              case 'question':
                showQuestion(data);
                break;
                
              case 'answer_feedback':
                showAnswerFeedback(data);
                break;
                
              case 'update_scores':
                updateScores(data.scores);
                break;
                
              case 'game_end':
                endGame(data.results);
                break;
                
              case 'game_error':
                showGameError(data.message);
                break;
                
              default:
                console.log('Unknown message type:', data.type);
            }
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
          }
        }
        
        // Update online user count
        function updateOnlineUserCount(count = null) {
          const userCountElement = document.getElementById('userCount');
          
          if (count !== null) {
            userCountElement.textContent = count;
          } else if (socket && socket.readyState === WebSocket.OPEN) {
            // Request updated count from server
            socket.send(JSON.stringify({ type: 'get_online_users' }));
          }
        }
        
        // Start Quick Match
        function startQuickMatch() {
          if (!currentUser) {
            showToast('error', 'You must be logged in to play');
            return;
          }
          
          if (socket && socket.readyState === WebSocket.OPEN) {
            // Reset game data
            resetGame();
            
            // Send matchmaking request
            socket.send(JSON.stringify({ type: 'find_match' }));
            
            // Show matchmaking status
            updateMatchmakingStatus('searching');
            
            // Start a timer to periodically refresh matchmaking status
            matchmakingTimer = setInterval(() => {
              if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'matchmaking_status' }));
              }
            }, 10000); // Check every 10 seconds
          } else {
            showToast('error', 'Connection error. Please try again.');
            connectWebSocket();
          }
        }
        
        // Cancel matchmaking
        function cancelMatchmaking() {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'cancel_matchmaking' }));
          }
          
          // Clear matchmaking timer
          if (matchmakingTimer) {
            clearInterval(matchmakingTimer);
            matchmakingTimer = null;
          }
          
          // Reset UI
          updateMatchmakingStatus('idle');
        }
        
        // Update matchmaking status
        function updateMatchmakingStatus(status, message = '') {
          const matchmakingStatus = document.getElementById('matchmakingStatus');
          const findMatchButton = document.getElementById('findMatchButton');
          
          switch (status) {
            case 'searching':
              matchmakingStatus.style.display = 'block';
              findMatchButton.disabled = true;
              break;
              
            case 'idle':
              matchmakingStatus.style.display = 'none';
              findMatchButton.disabled = false;
              break;
              
            default:
              if (message) {
                matchmakingStatus.innerHTML = \`
                  <div class="spinner"></div>
                  \${message}
                  <button class="button button-danger" onclick="cancelMatchmaking()" style="margin-top: 16px;">Cancel</button>
                \`;
                matchmakingStatus.style.display = 'block';
                findMatchButton.disabled = true;
              }
          }
        }
        
        // Show game preparation
        function showGamePreparation(opponentName) {
          // Clear matchmaking timer
          if (matchmakingTimer) {
            clearInterval(matchmakingTimer);
            matchmakingTimer = null;
          }
          
          const matchmakingContainer = document.getElementById('matchmakingContainer');
          const gamePreparation = document.getElementById('gamePreparation');
          const opponentNameElement = document.getElementById('opponentName');
          const preparationTimer = document.getElementById('preparationTimer');
          
          // Set opponent name
          opponentNameElement.textContent = opponentName;
          document.getElementById('opponentNameInGame').textContent = opponentName;
          
          // Hide matchmaking, show preparation
          matchmakingContainer.style.display = 'none';
          gamePreparation.style.display = 'block';
          
          // Start countdown
          let countdown = 3;
          preparationTimer.textContent = countdown;
          
          const timerInterval = setInterval(() => {
            countdown--;
            preparationTimer.textContent = countdown;
            
            if (countdown <= 0) {
              clearInterval(timerInterval);
            }
          }, 1000);
        }
        
        // Show game interface
        function showGameInterface() {
          gameInProgress = true;
          
          const gamePreparation = document.getElementById('gamePreparation');
          const gameInterface = document.getElementById('gameInterface');
          
          gamePreparation.style.display = 'none';
          gameInterface.style.display = 'block';
        }
        
        // Show question
        function showQuestion(questionData) {
          gameData.currentQuestion = questionData.questionNumber;
          gameData.totalQuestions = questionData.totalQuestions;
          gameData.selectedAnswer = null;
          gameData.questionStartTime = Date.now();
          
          const questionText = document.getElementById('questionText');
          const answersGrid = document.getElementById('answersGrid');
          const questionTimer = document.getElementById('questionTimer');
          
          // Set question text
          questionText.textContent = questionData.question;
          
          // Set answer options
          const answerButtons = answersGrid.querySelectorAll('.answer-option');
          for (let i = 0; i < answerButtons.length; i++) {
            const button = answerButtons[i];
            
            // Reset button state
            button.className = 'answer-option';
            button.disabled = false;
            
            if (i < questionData.answers.length) {
              button.textContent = questionData.answers[i];
              button.style.display = 'block';
            } else {
              button.style.display = 'none';
            }
          }
          
          // Start timer
          let timeLeft = questionData.timeLimit || 15;
          questionTimer.textContent = timeLeft;
          
          const timerInterval = setInterval(() => {
            timeLeft--;
            questionTimer.textContent = timeLeft;
            
            if (timeLeft <= 0 || gameData.selectedAnswer !== null) {
              clearInterval(timerInterval);
              
              if (gameData.selectedAnswer === null) {
                // Time's up, auto-submit
                submitAnswer(null);
              }
            }
          }, 1000);
        }
        
        // Select answer
        function selectAnswer(index) {
          if (gameData.selectedAnswer !== null) return; // Already selected
          
          gameData.selectedAnswer = index;
          
          // Highlight selected answer
          const answerButtons = document.getElementById('answersGrid').querySelectorAll('.answer-option');
          answerButtons.forEach(button => {
            button.classList.remove('selected');
            button.disabled = true;
          });
          
          answerButtons[index].classList.add('selected');
          
          // Submit answer to server
          submitAnswer(index);
        }
        
        // Submit answer
        function submitAnswer(answerIndex) {
          if (socket && socket.readyState === WebSocket.OPEN) {
            const responseTime = (Date.now() - gameData.questionStartTime) / 1000;
            gameData.responseTimes.push(responseTime);
            
            socket.send(JSON.stringify({
              type: 'submit_answer',
              answer: answerIndex,
              responseTime: responseTime
            }));
          }
        }
        
        // Show answer feedback
        function showAnswerFeedback(feedback) {
          const answersGrid = document.getElementById('answersGrid');
          const answerButtons = answersGrid.querySelectorAll('.answer-option');
          
          // Highlight correct answer
          highlightCorrectAnswer(feedback.correctAnswer);
          
          // Update stats
          if (feedback.isCorrect) {
            gameData.correctAnswers++;
            gameData.currentStreak++;
            
            if (gameData.currentStreak > gameData.streakCount) {
              gameData.streakCount = gameData.currentStreak;
            }
          } else {
            gameData.currentStreak = 0;
          }
          
          // Show feedback briefly before moving to next question
          setTimeout(() => {
            answerButtons.forEach(button => {
              button.classList.remove('selected', 'correct', 'incorrect');
            });
          }, 1500);
        }
        
        // Highlight correct answer
        function highlightCorrectAnswer(correctIndex) {
          const answersGrid = document.getElementById('answersGrid');
          const answerButtons = answersGrid.querySelectorAll('.answer-option');
          
          // Mark correct answer
          answerButtons[correctIndex].classList.add('correct');
          
          // If player selected wrong answer, mark it as incorrect
          if (gameData.selectedAnswer !== null && gameData.selectedAnswer !== correctIndex) {
            answerButtons[gameData.selectedAnswer].classList.add('incorrect');
          }
        }
        
        // Update scores
        function updateScores(scores) {
          const playerScore = document.getElementById('playerScore');
          const opponentScore = document.getElementById('opponentScore');
          
          gameData.scores.player = scores.player;
          gameData.scores.opponent = scores.opponent;
          
          playerScore.textContent = scores.player;
          opponentScore.textContent = scores.opponent;
        }
        
        // End game
        function endGame(results) {
          gameInProgress = false;
          
          const gameInterface = document.getElementById('gameInterface');
          const gameResults = document.getElementById('gameResults');
          
          const finalPlayerScore = document.getElementById('finalPlayerScore');
          const finalOpponentScore = document.getElementById('finalOpponentScore');
          const resultOpponentName = document.getElementById('resultOpponentName');
          const playerWinnerBadge = document.getElementById('playerWinnerBadge');
          const opponentWinnerBadge = document.getElementById('opponentWinnerBadge');
          const tieBadge = document.getElementById('tieBadge');
          const resultSubtitle = document.getElementById('resultSubtitle');
          
          // Set scores
          finalPlayerScore.textContent = results.scores.player;
          finalOpponentScore.textContent = results.scores.opponent;
          resultOpponentName.textContent = results.opponentName;
          
          // Set winner
          if (results.winner === 'player') {
            playerWinnerBadge.style.display = 'inline-block';
            opponentWinnerBadge.style.display = 'none';
            tieBadge.style.display = 'none';
            resultSubtitle.textContent = 'You won the match!';
          } else if (results.winner === 'opponent') {
            playerWinnerBadge.style.display = 'none';
            opponentWinnerBadge.style.display = 'inline-block';
            tieBadge.style.display = 'none';
            resultSubtitle.textContent = 'You lost the match!';
          } else {
            playerWinnerBadge.style.display = 'none';
            opponentWinnerBadge.style.display = 'none';
            tieBadge.style.display = 'block';
            resultSubtitle.textContent = 'It\'s a tie!';
          }
          
          // Set stats
          document.getElementById('correctAnswers').textContent = gameData.correctAnswers;
          
          const avgTime = gameData.responseTimes.length > 0 
            ? (gameData.responseTimes.reduce((a, b) => a + b, 0) / gameData.responseTimes.length).toFixed(1) 
            : 0;
          document.getElementById('avgTime').textContent = avgTime + 's';
          
          document.getElementById('streakCount').textContent = gameData.streakCount;
          
          // Set rewards
          document.getElementById('tokensEarned').textContent = results.rewards?.tokens || 0;
          document.getElementById('xpEarned').textContent = results.rewards?.xp || 0;
          
          // Hide game interface, show results
          gameInterface.style.display = 'none';
          gameResults.style.display = 'block';
        }
        
        // Play again
        function playAgain() {
          const gameResults = document.getElementById('gameResults');
          const matchmakingContainer = document.getElementById('matchmakingContainer');
          
          gameResults.style.display = 'none';
          matchmakingContainer.style.display = 'block';
          
          resetGame();
          startQuickMatch();
        }
        
        // Return to dashboard
        function returnToDashboard() {
          window.location.href = '/dashboard';
        }
        
        // Reset game
        function resetGame() {
          gameInProgress = false;
          gameData = {
            currentQuestion: 0,
            totalQuestions: 0,
            scores: {
              player: 0,
              opponent: 0
            },
            selectedAnswer: null,
            correctAnswers: 0,
            responseTimes: [],
            streakCount: 0,
            currentStreak: 0,
            questionStartTime: 0
          };
          
          // Reset UI elements
          document.getElementById('playerScore').textContent = '0';
          document.getElementById('opponentScore').textContent = '0';
        }
        
        // Create private room
        function createPrivateRoom() {
          showToast('info', 'Private rooms coming soon!');
        }
        
        // Join private room
        function joinPrivateRoom() {
          const roomCode = prompt('Enter the room code:');
          if (roomCode) {
            showToast('info', 'Private rooms coming soon!');
          }
        }
        
        // Show game error
        function showGameError(message) {
          cancelMatchmaking();
          showToast('error', message);
          
          // Reset to matchmaking container
          const gamePreparation = document.getElementById('gamePreparation');
          const gameInterface = document.getElementById('gameInterface');
          const gameResults = document.getElementById('gameResults');
          const matchmakingContainer = document.getElementById('matchmakingContainer');
          
          gamePreparation.style.display = 'none';
          gameInterface.style.display = 'none';
          gameResults.style.display = 'none';
          matchmakingContainer.style.display = 'block';
        }
        
        // Show toast notification
        function showToast(type, message) {
          const toast = document.getElementById('toast');
          const toastMessage = document.getElementById('toastMessage');
          
          // Set message
          toastMessage.textContent = message;
          
          // Set type
          toast.className = 'toast';
          if (type === 'error') {
            toast.classList.add('toast-error');
          } else if (type === 'success') {
            toast.classList.add('toast-success');
          }
          
          // Show toast
          toast.classList.add('show');
          
          // Hide after 3 seconds
          setTimeout(() => {
            hideToast();
          }, 3000);
        }
        
        // Hide toast notification
        function hideToast() {
          const toast = document.getElementById('toast');
          toast.classList.remove('show');
        }
      </script>
    </body>
    </html>
  `);
});

// Cosmetics routes
app.get('/api/cosmetics/avatars', (req, res) => {
  // Return available avatars
  res.json({
    items: [
      {
        id: "default-avatar",
        name: "Default Avatar",
        description: "The standard avatar for all players.",
        rarity: "common",
        imageUrl: "/avatars/default.png",
        unlockType: "default",
        unlockRequirement: null,
        price: 0
      },
      {
        id: "scholar",
        name: "Scholar",
        description: "For those who value wisdom and knowledge.",
        rarity: "uncommon",
        imageUrl: "/avatars/scholar.png",
        unlockType: "tokens",
        unlockRequirement: null,
        price: 200
      },
      {
        id: "champion",
        name: "Champion",
        description: "For the winners and the best of the best.",
        rarity: "rare",
        imageUrl: "/avatars/champion.png",
        unlockType: "tokens",
        unlockRequirement: null,
        price: 500
      },
      {
        id: "einstein",
        name: "Einstein",
        description: "The face of genius.",
        rarity: "epic",
        imageUrl: "/avatars/einstein.png",
        unlockType: "battlepass",
        unlockRequirement: "level-20-premium",
        price: 0
      },
      {
        id: "quantum-scholar",
        name: "Quantum Scholar",
        description: "For those who understand the universe at its deepest level.",
        rarity: "epic",
        imageUrl: "/avatars/quantum-scholar.png",
        unlockType: "battlepass",
        unlockRequirement: "level-1-premium",
        price: 0
      },
      {
        id: "novice-thinker",
        name: "Novice Thinker",
        description: "Every expert was once a beginner.",
        rarity: "uncommon",
        imageUrl: "/avatars/novice-thinker.png",
        unlockType: "battlepass",
        unlockRequirement: "level-15-free",
        price: 0
      },
      {
        id: "neural-network",
        name: "Neural Network",
        description: "A digital mind for the digital age.",
        rarity: "epic",
        imageUrl: "/avatars/neural-network.png",
        unlockType: "battlepass",
        unlockRequirement: "level-45-premium",
        price: 0
      },
      {
        id: "graduate",
        name: "Graduate",
        description: "You've earned your degree in quiz mastery.",
        rarity: "rare",
        imageUrl: "/avatars/graduate.png",
        unlockType: "battlepass",
        unlockRequirement: "level-50-free",
        price: 0
      },
      {
        id: "tournament-master",
        name: "Tournament Master",
        description: "For those who dominate the tournament circuit.",
        rarity: "legendary",
        imageUrl: "/avatars/tournament-master.png",
        unlockType: "achievement",
        unlockRequirement: "win-10-tournaments",
        price: 0
      },
      {
        id: "cosmic-brain",
        name: "Cosmic Brain",
        description: "Your knowledge spans the universe.",
        rarity: "legendary",
        imageUrl: "/avatars/cosmic-brain.png",
        unlockType: "tokens",
        unlockRequirement: null,
        price: 2000
      }
    ]
  });
});

app.get('/api/cosmetics/frames', (req, res) => {
  // Return available frames
  res.json({
    items: [
      {
        id: "default-frame",
        name: "Default Frame",
        description: "A simple frame for your avatar.",
        rarity: "common",
        imageUrl: "/frames/default.png",
        unlockType: "default",
        unlockRequirement: null,
        price: 0
      },
      {
        id: "gold-frame",
        name: "Gold Frame",
        description: "Show off your wealth and success.",
        rarity: "rare",
        imageUrl: "/frames/gold.png",
        unlockType: "tokens",
        unlockRequirement: null,
        price: 450
      },
      {
        id: "neon-frame",
        name: "Neon Frame",
        description: "A flashy frame that stands out in the crowd.",
        rarity: "epic",
        imageUrl: "/frames/neon.png",
        unlockType: "tokens",
        unlockRequirement: null,
        price: 800
      },
      {
        id: "diamond-frame",
        name: "Diamond Frame",
        description: "The most prestigious frame available.",
        rarity: "legendary",
        imageUrl: "/frames/diamond.png",
        unlockType: "battlepass",
        unlockRequirement: "level-50-premium",
        price: 0
      },
      {
        id: "platinum-frame",
        name: "Platinum Frame",
        description: "For the elite few who have proven their worth.",
        rarity: "epic",
        imageUrl: "/frames/platinum.png",
        unlockType: "battlepass",
        unlockRequirement: "level-30-premium",
        price: 0
      },
      {
        id: "silver-frame",
        name: "Silver Frame",
        description: "A sleek, professional frame.",
        rarity: "uncommon",
        imageUrl: "/frames/silver.png",
        unlockType: "battlepass",
        unlockRequirement: "level-10-free",
        price: 0
      }
    ]
  });
});

app.get('/api/cosmetics/effects', (req, res) => {
  // Return available effects
  res.json({
    items: [
      {
        id: "default-effect",
        name: "No Effect",
        description: "No special effects applied.",
        rarity: "common",
        imageUrl: "/effects/none.png",
        unlockType: "default",
        unlockRequirement: null,
        price: 0
      },
      {
        id: "glow-effect",
        name: "Glow Effect",
        description: "A subtle glow around your avatar.",
        rarity: "uncommon",
        imageUrl: "/effects/glow.png",
        unlockType: "tokens",
        unlockRequirement: null,
        price: 300
      },
      {
        id: "sparkle-effect",
        name: "Sparkle Effect",
        description: "Tiny sparkles float around your avatar.",
        rarity: "rare",
        imageUrl: "/effects/sparkle.png",
        unlockType: "tokens",
        unlockRequirement: null,
        price: 600
      },
      {
        id: "fire-effect",
        name: "Fire Effect",
        description: "Your avatar is on fire! (Not literally)",
        rarity: "epic",
        imageUrl: "/effects/fire.png",
        unlockType: "battlepass",
        unlockRequirement: "level-40-premium",
        price: 0
      },
      {
        id: "electric-effect",
        name: "Electric Effect",
        description: "Lightning crackles around your avatar.",
        rarity: "legendary",
        imageUrl: "/effects/electric.png",
        unlockType: "achievement",
        unlockRequirement: "perfect-score-5-games",
        price: 0
      }
    ]
  });
});

app.get('/api/cosmetics/titles', (req, res) => {
  // Return available titles
  res.json({
    items: [
      {
        id: "default-title",
        name: "Novice",
        description: "The starting title for all players.",
        rarity: "common",
        unlockType: "default",
        unlockRequirement: null,
        price: 0
      },
      {
        id: "quiz-master",
        name: "Quiz Master",
        description: "A title for those who excel at quizzes.",
        rarity: "uncommon",
        unlockType: "tokens",
        unlockRequirement: null,
        price: 250
      },
      {
        id: "genius",
        name: "Genius",
        description: "For those with exceptional intelligence.",
        rarity: "rare",
        unlockType: "tokens",
        unlockRequirement: null,
        price: 550
      },
      {
        id: "grandmaster",
        name: "Grandmaster",
        description: "The highest title of mastery.",
        rarity: "epic",
        unlockType: "battlepass",
        unlockRequirement: "level-35-premium",
        price: 0
      },
      {
        id: "doctor-of-knowledge",
        name: "Doctor of Knowledge",
        description: "An academic title for the truly dedicated.",
        rarity: "rare",
        unlockType: "battlepass",
        unlockRequirement: "level-25-free",
        price: 0
      },
      {
        id: "omniscient",
        name: "The Omniscient",
        description: "One who knows all there is to know.",
        rarity: "legendary",
        unlockType: "achievement",
        unlockRequirement: "win-100-matches",
        price: 0
      }
    ]
  });
});

// User tokens endpoint
app.get('/api/user/:userId/tokens', (req, res) => {
  const userId = req.params.userId;
  // In a real app, you would fetch this from the database
  const userTokens = getUserTokens(userId);
  res.json({ balance: userTokens });
});

// Add tokens endpoint (for testing)
app.post('/api/user/:userId/tokens/add', (req, res) => {
  const userId = req.params.userId;
  const amount = req.body.amount || 100;
  
  // Add tokens to user
  const newBalance = addTokens(userId, amount);
  
  res.json({ 
    success: true, 
    added: amount,
    newBalance: newBalance
  });
});

// User cosmetics endpoint
app.get('/api/user/:userId/cosmetics', (req, res) => {
  const userId = req.params.userId;
  // Get user's unlocked and equipped cosmetics
  const userCosmetics = getUserCosmetics(userId);
  res.json(userCosmetics);
});

// Purchase cosmetic endpoint
app.post('/api/user/:userId/cosmetics/purchase', (req, res) => {
  const userId = req.params.userId;
  const { type, itemId } = req.body;
  
  if (!type || !itemId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing type or itemId in request'
    });
  }
  
  try {
    // Check if user already has this cosmetic
    if (hasUnlockedCosmetic(userId, type, itemId)) {
      return res.status(400).json({
        success: false,
        error: 'You already own this item'
      });
    }
    
    // Get the cosmetic details
    let cosmetic;
    switch(type) {
      case 'avatar':
        cosmetic = getCosmetic('avatars', itemId);
        break;
      case 'frame':
        cosmetic = getCosmetic('frames', itemId);
        break;
      case 'effect':
        cosmetic = getCosmetic('effects', itemId);
        break;
      case 'title':
        cosmetic = getCosmetic('titles', itemId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid cosmetic type'
        });
    }
    
    if (!cosmetic) {
      return res.status(404).json({
        success: false,
        error: 'Cosmetic not found'
      });
    }
    
    // Check if cosmetic is purchasable with tokens
    if (cosmetic.unlockType !== 'tokens') {
      return res.status(400).json({
        success: false,
        error: 'This item cannot be purchased with tokens'
      });
    }
    
    // Check if user has enough tokens
    const userTokens = getUserTokens(userId);
    if (userTokens < cosmetic.price) {
      return res.status(400).json({
        success: false,
        error: 'Not enough tokens to purchase this item'
      });
    }
    
    // Purchase the cosmetic
    const newBalance = addTokens(userId, -cosmetic.price);
    unlockCosmetic(userId, type, itemId);
    
    res.json({
      success: true,
      message: `Successfully purchased ${cosmetic.name}!`,
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Error purchasing cosmetic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase cosmetic'
    });
  }
});

// Equip cosmetic endpoint
app.post('/api/user/:userId/cosmetics/equip', (req, res) => {
  const userId = req.params.userId;
  const { type, itemId } = req.body;
  
  if (!type || !itemId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing type or itemId in request'
    });
  }
  
  try {
    // Check if user has unlocked this cosmetic
    if (!hasUnlockedCosmetic(userId, type, itemId)) {
      return res.status(400).json({
        success: false,
        error: 'You do not own this item'
      });
    }
    
    // Equip the cosmetic
    equipCosmetic(userId, type, itemId);
    
    res.json({
      success: true,
      message: 'Cosmetic equipped successfully!'
    });
  } catch (error) {
    console.error('Error equipping cosmetic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to equip cosmetic'
    });
  }
});

// Helper function to get a specific cosmetic
function getCosmetic(type, id) {
  let items = [];
  
  switch(type) {
    case 'avatars':
      items = [
        {
          id: "default-avatar",
          name: "Default Avatar",
          description: "The standard avatar for all players.",
          rarity: "common",
          imageUrl: "/avatars/default.png",
          unlockType: "default",
          unlockRequirement: null,
          price: 0
        },
        {
          id: "scholar",
          name: "Scholar",
          description: "For those who value wisdom and knowledge.",
          rarity: "uncommon",
          imageUrl: "/avatars/scholar.png",
          unlockType: "tokens",
          unlockRequirement: null,
          price: 200
        },
        {
          id: "champion",
          name: "Champion",
          description: "For the winners and the best of the best.",
          rarity: "rare",
          imageUrl: "/avatars/champion.png",
          unlockType: "tokens",
          unlockRequirement: null,
          price: 500
        },
        {
          id: "einstein",
          name: "Einstein",
          description: "The face of genius.",
          rarity: "epic",
          imageUrl: "/avatars/einstein.png",
          unlockType: "battlepass",
          unlockRequirement: "level-20-premium",
          price: 0
        },
        {
          id: "quantum-scholar",
          name: "Quantum Scholar",
          description: "For those who understand the universe at its deepest level.",
          rarity: "epic",
          imageUrl: "/avatars/quantum-scholar.png",
          unlockType: "battlepass",
          unlockRequirement: "level-1-premium",
          price: 0
        },
        {
          id: "novice-thinker",
          name: "Novice Thinker",
          description: "Every expert was once a beginner.",
          rarity: "uncommon",
          imageUrl: "/avatars/novice-thinker.png",
          unlockType: "battlepass",
          unlockRequirement: "level-15-free",
          price: 0
        },
        {
          id: "neural-network",
          name: "Neural Network",
          description: "A digital mind for the digital age.",
          rarity: "epic",
          imageUrl: "/avatars/neural-network.png",
          unlockType: "battlepass",
          unlockRequirement: "level-45-premium",
          price: 0
        },
        {
          id: "graduate",
          name: "Graduate",
          description: "You've earned your degree in quiz mastery.",
          rarity: "rare",
          imageUrl: "/avatars/graduate.png",
          unlockType: "battlepass",
          unlockRequirement: "level-50-free",
          price: 0
        },
        {
          id: "tournament-master",
          name: "Tournament Master",
          description: "For those who dominate the tournament circuit.",
          rarity: "legendary",
          imageUrl: "/avatars/tournament-master.png",
          unlockType: "achievement",
          unlockRequirement: "win-10-tournaments",
          price: 0
        },
        {
          id: "cosmic-brain",
          name: "Cosmic Brain",
          description: "Your knowledge spans the universe.",
          rarity: "legendary",
          imageUrl: "/avatars/cosmic-brain.png",
          unlockType: "tokens",
          unlockRequirement: null,
          price: 2000
        }
      ];
      break;
    case 'frames':
      items = [
        {
          id: "default-frame",
          name: "Default Frame",
          description: "A simple frame for your avatar.",
          rarity: "common",
          imageUrl: "/frames/default.png",
          unlockType: "default",
          unlockRequirement: null,
          price: 0
        },
        {
          id: "gold-frame",
          name: "Gold Frame",
          description: "Show off your wealth and success.",
          rarity: "rare",
          imageUrl: "/frames/gold.png",
          unlockType: "tokens",
          unlockRequirement: null,
          price: 450
        },
        {
          id: "neon-frame",
          name: "Neon Frame",
          description: "A flashy frame that stands out in the crowd.",
          rarity: "epic",
          imageUrl: "/frames/neon.png",
          unlockType: "tokens",
          unlockRequirement: null,
          price: 800
        },
        {
          id: "diamond-frame",
          name: "Diamond Frame",
          description: "The most prestigious frame available.",
          rarity: "legendary",
          imageUrl: "/frames/diamond.png",
          unlockType: "battlepass",
          unlockRequirement: "level-50-premium",
          price: 0
        },
        {
          id: "platinum-frame",
          name: "Platinum Frame",
          description: "For the elite few who have proven their worth.",
          rarity: "epic",
          imageUrl: "/frames/platinum.png",
          unlockType: "battlepass",
          unlockRequirement: "level-30-premium",
          price: 0
        },
        {
          id: "silver-frame",
          name: "Silver Frame",
          description: "A sleek, professional frame.",
          rarity: "uncommon",
          imageUrl: "/frames/silver.png",
          unlockType: "battlepass",
          unlockRequirement: "level-10-free",
          price: 0
        }
      ];
      break;
    case 'effects':
      items = [
        {
          id: "default-effect",
          name: "No Effect",
          description: "No special effects applied.",
          rarity: "common",
          imageUrl: "/effects/none.png",
          unlockType: "default",
          unlockRequirement: null,
          price: 0
        },
        {
          id: "glow-effect",
          name: "Glow Effect",
          description: "A subtle glow around your avatar.",
          rarity: "uncommon",
          imageUrl: "/effects/glow.png",
          unlockType: "tokens",
          unlockRequirement: null,
          price: 300
        },
        {
          id: "sparkle-effect",
          name: "Sparkle Effect",
          description: "Tiny sparkles float around your avatar.",
          rarity: "rare",
          imageUrl: "/effects/sparkle.png",
          unlockType: "tokens",
          unlockRequirement: null,
          price: 600
        },
        {
          id: "fire-effect",
          name: "Fire Effect",
          description: "Your avatar is on fire! (Not literally)",
          rarity: "epic",
          imageUrl: "/effects/fire.png",
          unlockType: "battlepass",
          unlockRequirement: "level-40-premium",
          price: 0
        },
        {
          id: "electric-effect",
          name: "Electric Effect",
          description: "Lightning crackles around your avatar.",
          rarity: "legendary",
          imageUrl: "/effects/electric.png",
          unlockType: "achievement",
          unlockRequirement: "perfect-score-5-games",
          price: 0
        }
      ];
      break;
    case 'titles':
      items = [
        {
          id: "default-title",
          name: "Novice",
          description: "The starting title for all players.",
          rarity: "common",
          unlockType: "default",
          unlockRequirement: null,
          price: 0
        },
        {
          id: "quiz-master",
          name: "Quiz Master",
          description: "A title for those who excel at quizzes.",
          rarity: "uncommon",
          unlockType: "tokens",
          unlockRequirement: null,
          price: 250
        },
        {
          id: "genius",
          name: "Genius",
          description: "For those with exceptional intelligence.",
          rarity: "rare",
          unlockType: "tokens",
          unlockRequirement: null,
          price: 550
        },
        {
          id: "grandmaster",
          name: "Grandmaster",
          description: "The highest title of mastery.",
          rarity: "epic",
          unlockType: "battlepass",
          unlockRequirement: "level-35-premium",
          price: 0
        },
        {
          id: "doctor-of-knowledge",
          name: "Doctor of Knowledge",
          description: "An academic title for the truly dedicated.",
          rarity: "rare",
          unlockType: "battlepass",
          unlockRequirement: "level-25-free",
          price: 0
        },
        {
          id: "omniscient",
          name: "The Omniscient",
          description: "One who knows all there is to know.",
          rarity: "legendary",
          unlockType: "achievement",
          unlockRequirement: "win-100-matches",
          price: 0
        }
      ];
      break;
    default:
      break;
  }
  
  return items.find(item => item.id === id);
}

// Helper function to get user tokens
function getUserTokens(userId) {
  // In a real app, this would be stored in a database
  // For now, generate a random amount if not already initialized
  if (!userTokensMap.has(userId)) {
    userTokensMap.set(userId, 1000); // Start with 1000 tokens
  }
  
  return userTokensMap.get(userId);
}

// Helper function to add or remove tokens
function addTokens(userId, amount) {
  const currentBalance = getUserTokens(userId);
  const newBalance = Math.max(0, currentBalance + amount);
  userTokensMap.set(userId, newBalance);
  return newBalance;
}

// In-memory storage for cosmetics
const userCosmeticsMap = new Map();
const userTokensMap = new Map();

// Initialize cosmetics for a new user
function initializeUserCosmetics(userId) {
  return {
    unlocked: {
      avatars: ["default-avatar"],
      frames: ["default-frame"],
      effects: ["default-effect"],
      titles: ["default-title"]
    },
    equipped: {
      avatar: {
        id: "default-avatar",
        name: "Default Avatar",
        description: "The standard avatar for all players.",
        rarity: "common",
        imageUrl: "/avatars/default.png"
      },
      frame: {
        id: "default-frame",
        name: "Default Frame",
        description: "A simple frame for your avatar.",
        rarity: "common",
        imageUrl: "/frames/default.png"
      },
      effect: {
        id: "default-effect",
        name: "No Effect",
        description: "No special effects applied.",
        rarity: "common",
        imageUrl: "/effects/none.png"
      },
      title: {
        id: "default-title",
        name: "Novice",
        description: "The starting title for all players.",
        rarity: "common"
      }
    }
  };
}

// Get user cosmetics
function getUserCosmetics(userId) {
  if (!userCosmeticsMap.has(userId)) {
    userCosmeticsMap.set(userId, initializeUserCosmetics(userId));
  }
  
  return userCosmeticsMap.get(userId);
}

// Check if user has unlocked a specific cosmetic
function hasUnlockedCosmetic(userId, type, itemId) {
  const userCosmetics = getUserCosmetics(userId);
  
  switch(type) {
    case 'avatar':
      return userCosmetics.unlocked.avatars.includes(itemId);
    case 'frame':
      return userCosmetics.unlocked.frames.includes(itemId);
    case 'effect':
      return userCosmetics.unlocked.effects.includes(itemId);
    case 'title':
      return userCosmetics.unlocked.titles.includes(itemId);
    default:
      return false;
  }
}

// Unlock a cosmetic for a user
function unlockCosmetic(userId, type, itemId) {
  const userCosmetics = getUserCosmetics(userId);
  
  switch(type) {
    case 'avatar':
      if (!userCosmetics.unlocked.avatars.includes(itemId)) {
        userCosmetics.unlocked.avatars.push(itemId);
      }
      break;
    case 'frame':
      if (!userCosmetics.unlocked.frames.includes(itemId)) {
        userCosmetics.unlocked.frames.push(itemId);
      }
      break;
    case 'effect':
      if (!userCosmetics.unlocked.effects.includes(itemId)) {
        userCosmetics.unlocked.effects.push(itemId);
      }
      break;
    case 'title':
      if (!userCosmetics.unlocked.titles.includes(itemId)) {
        userCosmetics.unlocked.titles.push(itemId);
      }
      break;
  }
  
  userCosmeticsMap.set(userId, userCosmetics);
  return userCosmetics;
}

// Equip a cosmetic for a user
function equipCosmetic(userId, type, itemId) {
  const userCosmetics = getUserCosmetics(userId);
  
  // Check if user has the cosmetic unlocked
  if (!hasUnlockedCosmetic(userId, type, itemId)) {
    throw new Error('User does not have this cosmetic unlocked');
  }
  
  // Get the cosmetic details
  const cosmetic = getCosmetic(type + 's', itemId);
  if (!cosmetic) {
    throw new Error('Cosmetic not found');
  }
  
  // Equip the cosmetic based on its type
  switch(type) {
    case 'avatar':
      userCosmetics.equipped.avatar = cosmetic;
      break;
    case 'frame':
      userCosmetics.equipped.frame = cosmetic;
      break;
    case 'effect':
      userCosmetics.equipped.effect = cosmetic;
      break;
    case 'title':
      userCosmetics.equipped.title = cosmetic;
      break;
  }
  
  userCosmeticsMap.set(userId, userCosmetics);
  return userCosmetics;
}

// Battle Pass routes
app.get('/api/battle-pass', (req, res) => {
  // Return current battle pass season info
  res.json({ 
    currentSeason: {
      id: battlePass.currentSeason.id,
      name: battlePass.currentSeason.name,
      description: battlePass.currentSeason.description,
      startDate: battlePass.currentSeason.startDate,
      endDate: battlePass.currentSeason.endDate,
      premiumPrice: battlePass.currentSeason.premiumPrice,
      maxLevel: battlePass.currentSeason.maxLevel,
      xpPerLevel: battlePass.currentSeason.xpPerLevel
    }
  });
});

app.get('/api/battle-pass/rewards', (req, res) => {
  // Return battle pass rewards
  res.json({ rewards: battlePass.currentSeason.rewards });
});

app.get('/api/user/:userId/battle-pass', (req, res) => {
  const userId = req.params.userId;
  const progress = getUserBattlePassProgress(userId);
  
  // Calculate percentage to next level
  const percentToNextLevel = Math.min(
    Math.floor((progress.xp / battlePass.currentSeason.xpPerLevel) * 100),
    100
  );
  
  // Get available rewards
  const rewards = battlePass.currentSeason.rewards.map(reward => {
    const freeRewardId = `${reward.level}-free`;
    const premiumRewardId = `${reward.level}-premium`;
    
    return {
      level: reward.level,
      free: {
        ...reward.free,
        claimed: progress.claimedRewards.includes(freeRewardId),
        available: progress.level >= reward.level
      },
      premium: {
        ...reward.premium,
        claimed: progress.claimedRewards.includes(premiumRewardId),
        available: progress.isPremium && progress.level >= reward.level
      }
    };
  });
  
  res.json({
    progress: {
      level: progress.level,
      xp: progress.xp,
      xpToNextLevel: battlePass.currentSeason.xpPerLevel - progress.xp,
      percentToNextLevel,
      isPremium: progress.isPremium
    },
    rewards
  });
});

app.post('/api/user/:userId/battle-pass/upgrade', (req, res) => {
  const userId = req.params.userId;
  
  const result = upgradeToPremiumBattlePass(userId);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json({ error: result.message });
  }
});

app.post('/api/user/:userId/battle-pass/claim-reward', (req, res) => {
  const userId = req.params.userId;
  const { level, isPremium } = req.body;
  
  if (level === undefined || isPremium === undefined) {
    return res.status(400).json({ error: 'Level and isPremium are required' });
  }
  
  const result = claimBattlePassReward(userId, level, isPremium);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json({ error: result.message });
  }
});

// Simulate adding XP (for demo purposes)
app.post('/api/user/:userId/battle-pass/add-xp', (req, res) => {
  const userId = req.params.userId;
  const { amount, source } = req.body;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount required' });
  }
  
  const result = addBattlePassXP(userId, parseInt(amount, 10), source || 'manual');
  
  // Check for cosmetic unlocks from battle pass leveling
  const newUnlocks = checkBattlePassCosmeticUnlocks(userId);
  
  res.json({
    success: true,
    levelUp: result.leveledUp,
    oldLevel: result.oldLevel,
    newLevel: result.newLevel,
    xpAdded: result.xpGained,
    newUnlocks: newUnlocks.length > 0 ? newUnlocks : undefined
  });
});

// Cosmetics System Routes

// Get available cosmetics
app.get('/api/cosmetics/:type', (req, res) => {
  const { type } = req.params;
  
  let items;
  switch (type) {
    case 'avatars':
      items = cosmetics.avatars;
      break;
    case 'frames':
      items = cosmetics.frames;
      break;
    case 'effects':
      items = cosmetics.effects;
      break;
    case 'titles':
      items = cosmetics.titles;
      break;
    default:
      return res.status(400).json({ error: 'Invalid cosmetic type' });
  }
  
  res.json({ items });
});

// Get user cosmetics
app.get('/api/user/:userId/cosmetics', (req, res) => {
  const userId = req.params.userId;
  const userItems = getUserCosmetics(userId);
  
  // Get detailed information about equipped items
  const equippedAvatar = cosmetics.avatars.find(a => a.id === userItems.equippedAvatar);
  const equippedFrame = cosmetics.frames.find(f => f.id === userItems.equippedFrame);
  const equippedEffect = cosmetics.effects.find(e => e.id === userItems.equippedEffect);
  const equippedTitle = cosmetics.titles.find(t => t.id === userItems.equippedTitle);
  
  res.json({
    unlocked: {
      avatars: userItems.unlockedAvatars,
      frames: userItems.unlockedFrames,
      effects: userItems.unlockedEffects,
      titles: userItems.unlockedTitles
    },
    equipped: {
      avatar: equippedAvatar,
      frame: equippedFrame,
      effect: equippedEffect,
      title: equippedTitle
    }
  });
});

// Purchase cosmetic
app.post('/api/user/:userId/cosmetics/purchase', (req, res) => {
  const userId = req.params.userId;
  const { type, itemId } = req.body;
  
  if (!type || !itemId) {
    return res.status(400).json({ error: 'Type and itemId are required' });
  }
  
  const result = purchaseCosmetic(userId, type, itemId);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json({ error: result.message });
  }
});

// Equip cosmetic
app.post('/api/user/:userId/cosmetics/equip', (req, res) => {
  const userId = req.params.userId;
  const { type, itemId } = req.body;
  
  if (!type || !itemId) {
    return res.status(400).json({ error: 'Type and itemId are required' });
  }
  
  const result = equipCosmetic(userId, type, itemId);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json({ error: result.message });
  }
});

// API endpoint to check server health
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// WebSocket Server is already initialized

// Tournament System Data
const tournaments = [
  {
    id: 'weekly-challenge-1',
    name: 'Weekly Challenge',
    description: 'Test your knowledge across multiple categories in this weekly tournament.',
    entryFee: 50, // tokens
    prize: {
      first: 500,
      second: 250,
      third: 100
    },
    startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    endsAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days from now
    status: 'upcoming', // upcoming, active, completed
    participants: [],
    maxParticipants: 200,
    categories: ['General Knowledge', 'Science', 'History', 'Geography', 'Entertainment'],
    difficulty: 'medium',
    rounds: [
      {
        name: 'Qualification Round',
        questionCount: 15,
        timeLimit: 180, // seconds
        advancingCount: 64 // top 64 players advance
      },
      {
        name: 'Round of 64',
        questionCount: 10,
        timeLimit: 150,
        advancingCount: 32
      },
      {
        name: 'Round of 32',
        questionCount: 10,
        timeLimit: 150,
        advancingCount: 16
      },
      {
        name: 'Round of 16',
        questionCount: 10,
        timeLimit: 120,
        advancingCount: 8
      },
      {
        name: 'Quarter Finals',
        questionCount: 7,
        timeLimit: 90,
        advancingCount: 4
      },
      {
        name: 'Semi Finals',
        questionCount: 5,
        timeLimit: 60,
        advancingCount: 2
      },
      {
        name: 'Final',
        questionCount: 7,
        timeLimit: 90,
        advancingCount: 1
      }
    ]
  },
  {
    id: 'science-showdown-1',
    name: 'Science Showdown',
    description: 'Put your scientific knowledge to the test in this specialized tournament.',
    entryFee: 75,
    prize: {
      first: 750,
      second: 300,
      third: 150
    },
    startsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    endsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
    status: 'upcoming',
    participants: [],
    maxParticipants: 120,
    categories: ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Technology'],
    difficulty: 'hard',
    rounds: [
      {
        name: 'Qualification Round',
        questionCount: 15,
        timeLimit: 180,
        advancingCount: 32
      },
      {
        name: 'Round of 32',
        questionCount: 10,
        timeLimit: 150,
        advancingCount: 16
      },
      {
        name: 'Round of 16',
        questionCount: 10,
        timeLimit: 120,
        advancingCount: 8
      },
      {
        name: 'Quarter Finals',
        questionCount: 7,
        timeLimit: 90,
        advancingCount: 4
      },
      {
        name: 'Semi Finals',
        questionCount: 5,
        timeLimit: 60,
        advancingCount: 2
      },
      {
        name: 'Final',
        questionCount: 7,
        timeLimit: 90,
        advancingCount: 1
      }
    ]
  },
  {
    id: 'history-masters-1',
    name: 'History Masters',
    description: 'Travel through time with challenging history questions from ancient to modern times.',
    entryFee: 60,
    prize: {
      first: 600,
      second: 300,
      third: 120
    },
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    endsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    status: 'upcoming',
    participants: [],
    maxParticipants: 150,
    categories: ['Ancient History', 'Medieval History', 'Modern History', 'World Wars', 'Cultural History'],
    difficulty: 'medium',
    rounds: [
      {
        name: 'Qualification Round',
        questionCount: 15,
        timeLimit: 180,
        advancingCount: 32
      },
      {
        name: 'Round of 32',
        questionCount: 10,
        timeLimit: 150,
        advancingCount: 16
      },
      {
        name: 'Round of 16',
        questionCount: 10,
        timeLimit: 120,
        advancingCount: 8
      },
      {
        name: 'Quarter Finals',
        questionCount: 7,
        timeLimit: 90,
        advancingCount: 4
      },
      {
        name: 'Semi Finals',
        questionCount: 5,
        timeLimit: 60,
        advancingCount: 2
      },
      {
        name: 'Final',
        questionCount: 7,
        timeLimit: 90,
        advancingCount: 1
      }
    ]
  },
  {
    id: 'ultimate-quiz-championship-1',
    name: 'Ultimate Quiz Championship',
    description: 'The ultimate test of knowledge across all categories with the biggest prize pool.',
    entryFee: 100,
    prize: {
      first: 2000,
      second: 1000,
      third: 500,
      fourth: 200,
      fifth: 100
    },
    startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    endsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
    status: 'upcoming',
    participants: [],
    maxParticipants: 256,
    categories: ['General Knowledge', 'Science', 'History', 'Geography', 'Entertainment', 'Sports', 'Art', 'Literature'],
    difficulty: 'hard',
    rounds: [
      {
        name: 'Qualification Round',
        questionCount: 20,
        timeLimit: 240,
        advancingCount: 128
      },
      {
        name: 'Round of 128',
        questionCount: 15,
        timeLimit: 180,
        advancingCount: 64
      },
      {
        name: 'Round of 64',
        questionCount: 10,
        timeLimit: 150,
        advancingCount: 32
      },
      {
        name: 'Round of 32',
        questionCount: 10,
        timeLimit: 150,
        advancingCount: 16
      },
      {
        name: 'Round of 16',
        questionCount: 10,
        timeLimit: 120,
        advancingCount: 8
      },
      {
        name: 'Quarter Finals',
        questionCount: 7,
        timeLimit: 90,
        advancingCount: 4
      },
      {
        name: 'Semi Finals',
        questionCount: 5,
        timeLimit: 60,
        advancingCount: 2
      },
      {
        name: 'Final',
        questionCount: 10,
        timeLimit: 120,
        advancingCount: 1
      }
    ]
  }
];

// User data storage (in a real app, this would be in a database)
const userTokens = new Map();

// Battle Pass System
const battlePass = {
  currentSeason: {
    id: 'season-1',
    name: 'Season 1: Mind Mastery',
    description: 'Begin your journey through the realms of knowledge and earn exclusive rewards.',
    startDate: new Date('2025-04-01').toISOString(),
    endDate: new Date('2025-04-30').toISOString(),
    isPremium: false, // Free battle pass by default
    premiumPrice: 500, // Tokens to upgrade to premium
    maxLevel: 50,
    xpPerLevel: 1000, // XP needed to level up
    rewards: [
      // Free rewards
      {
        level: 1,
        free: { type: 'tokens', amount: 50, name: '50 Tokens' },
        premium: { type: 'avatar', id: 'quantum-scholar', name: 'Quantum Scholar Avatar' }
      },
      {
        level: 5,
        free: { type: 'tokens', amount: 100, name: '100 Tokens' },
        premium: { type: 'profile_frame', id: 'golden-genius', name: 'Golden Genius Frame' }
      },
      {
        level: 10,
        free: { type: 'tokens', amount: 150, name: '150 Tokens' },
        premium: { type: 'tokens', amount: 300, name: '300 Tokens' }
      },
      {
        level: 15,
        free: { type: 'avatar', id: 'novice-thinker', name: 'Novice Thinker Avatar' },
        premium: { type: 'title', id: 'mastermind', name: 'Mastermind Title' }
      },
      {
        level: 20,
        free: { type: 'tokens', amount: 200, name: '200 Tokens' },
        premium: { type: 'avatar', id: 'einstein', name: 'Einstein Avatar' }
      },
      {
        level: 25,
        free: { type: 'profile_frame', id: 'silver-scholar', name: 'Silver Scholar Frame' },
        premium: { type: 'tokens', amount: 500, name: '500 Tokens' }
      },
      {
        level: 30,
        free: { type: 'tokens', amount: 250, name: '250 Tokens' },
        premium: { type: 'title', id: 'grand-champion', name: 'Grand Champion Title' }
      },
      {
        level: 35,
        free: { type: 'tokens', amount: 300, name: '300 Tokens' },
        premium: { type: 'profile_frame', id: 'platinum-genius', name: 'Platinum Genius Frame' }
      },
      {
        level: 40,
        free: { type: 'title', id: 'quiz-wizard', name: 'Quiz Wizard Title' },
        premium: { type: 'tokens', amount: 750, name: '750 Tokens' }
      },
      {
        level: 45,
        free: { type: 'tokens', amount: 350, name: '350 Tokens' },
        premium: { type: 'avatar', id: 'neural-network', name: 'Neural Network Avatar' }
      },
      {
        level: 50,
        free: { type: 'avatar', id: 'graduate', name: 'Graduate Avatar' },
        premium: { type: 'special_effect', id: 'knowledge-aura', name: 'Knowledge Aura Effect' }
      }
    ],
    xpSources: {
      matchWin: 100,
      matchParticipation: 50,
      correctAnswer: 10,
      dailyLogin: 50,
      tournamentParticipation: 200,
      tournamentWin: 500
    }
  },
  // User battle pass progress
  userProgress: new Map() // Maps userId to their battle pass progress
};

// Function to get or initialize user battle pass progress
function getUserBattlePassProgress(userId) {
  if (!battlePass.userProgress.has(userId)) {
    battlePass.userProgress.set(userId, {
      level: 1,
      xp: 0,
      isPremium: false,
      claimedRewards: []
    });
  }
  return battlePass.userProgress.get(userId);
}

// Function to add XP to user's battle pass
function addBattlePassXP(userId, xpAmount, source) {
  const progress = getUserBattlePassProgress(userId);
  const oldLevel = progress.level;
  
  // Add XP
  progress.xp += xpAmount;
  
  // Check for level ups
  while (progress.xp >= battlePass.currentSeason.xpPerLevel && progress.level < battlePass.currentSeason.maxLevel) {
    progress.xp -= battlePass.currentSeason.xpPerLevel;
    progress.level++;
  }
  
  // Cap XP at max if needed
  if (progress.level >= battlePass.currentSeason.maxLevel) {
    progress.level = battlePass.currentSeason.maxLevel;
    progress.xp = Math.min(progress.xp, battlePass.currentSeason.xpPerLevel - 1);
  }
  
  // Return level up info
  return {
    oldLevel,
    newLevel: progress.level,
    leveledUp: progress.level > oldLevel,
    xpGained: xpAmount,
    source: source
  };
}

// Function to upgrade to premium battle pass
function upgradeToPremiumBattlePass(userId) {
  const progress = getUserBattlePassProgress(userId);
  const userBalance = userTokens.get(userId) || 0;
  
  if (progress.isPremium) {
    return { success: false, message: 'User already has premium battle pass' };
  }
  
  if (userBalance < battlePass.currentSeason.premiumPrice) {
    return { 
      success: false, 
      message: `Insufficient tokens. Required: ${battlePass.currentSeason.premiumPrice}, Available: ${userBalance}` 
    };
  }
  
  // Deduct tokens and upgrade
  userTokens.set(userId, userBalance - battlePass.currentSeason.premiumPrice);
  progress.isPremium = true;
  
  return { 
    success: true, 
    message: 'Successfully upgraded to premium battle pass',
    newBalance: userBalance - battlePass.currentSeason.premiumPrice
  };
}

// Function to claim battle pass reward
function claimBattlePassReward(userId, level, isPremium) {
  const progress = getUserBattlePassProgress(userId);
  
  // Check if eligible to claim
  if (progress.level < level) {
    return { success: false, message: `You haven't reached level ${level} yet` };
  }
  
  // Check if premium reward but user doesn't have premium pass
  if (isPremium && !progress.isPremium) {
    return { success: false, message: 'This is a premium reward. Upgrade to premium to claim it.' };
  }
  
  // Check if already claimed
  const rewardId = `${level}-${isPremium ? 'premium' : 'free'}`;
  if (progress.claimedRewards.includes(rewardId)) {
    return { success: false, message: 'You have already claimed this reward' };
  }
  
  // Find the reward
  const rewardLevel = battlePass.currentSeason.rewards.find(r => r.level === level);
  if (!rewardLevel) {
    return { success: false, message: 'Reward not found' };
  }
  
  const reward = isPremium ? rewardLevel.premium : rewardLevel.free;
  
  // Process reward
  let rewardResult = { received: reward.name };
  
  if (reward.type === 'tokens') {
    const currentBalance = userTokens.get(userId) || 0;
    userTokens.set(userId, currentBalance + reward.amount);
    rewardResult.newBalance = currentBalance + reward.amount;
  }
  
  // Mark as claimed
  progress.claimedRewards.push(rewardId);
  
  return { 
    success: true, 
    message: `Successfully claimed ${reward.name}`,
    reward: rewardResult
  };
}

// Continue using userTokens from above

// Cosmetics System for Avatars, Frames, and Effects
const cosmetics = {
  avatars: [
    {
      id: 'default-avatar',
      name: 'Default Avatar',
      description: 'The standard avatar for all players.',
      rarity: 'common',
      imageUrl: '/avatars/default.png',
      unlockType: 'default',
      unlockRequirement: null,
      price: 0
    },
    {
      id: 'scholar',
      name: 'Scholar',
      description: 'For those who value wisdom and knowledge.',
      rarity: 'uncommon',
      imageUrl: '/avatars/scholar.png',
      unlockType: 'tokens',
      unlockRequirement: null,
      price: 200
    },
    {
      id: 'champion',
      name: 'Champion',
      description: 'For the winners and the best of the best.',
      rarity: 'rare',
      imageUrl: '/avatars/champion.png',
      unlockType: 'tokens',
      unlockRequirement: null,
      price: 500
    },
    {
      id: 'einstein',
      name: 'Einstein',
      description: 'The face of genius.',
      rarity: 'epic',
      imageUrl: '/avatars/einstein.png',
      unlockType: 'battlepass',
      unlockRequirement: 'level-20-premium',
      price: 0
    },
    {
      id: 'quantum-scholar',
      name: 'Quantum Scholar',
      description: 'For those who understand the universe at its deepest level.',
      rarity: 'epic',
      imageUrl: '/avatars/quantum-scholar.png',
      unlockType: 'battlepass',
      unlockRequirement: 'level-1-premium',
      price: 0
    },
    {
      id: 'novice-thinker',
      name: 'Novice Thinker',
      description: 'Every expert was once a beginner.',
      rarity: 'uncommon',
      imageUrl: '/avatars/novice-thinker.png',
      unlockType: 'battlepass',
      unlockRequirement: 'level-15-free',
      price: 0
    },
    {
      id: 'neural-network',
      name: 'Neural Network',
      description: 'A digital mind for the digital age.',
      rarity: 'epic',
      imageUrl: '/avatars/neural-network.png',
      unlockType: 'battlepass',
      unlockRequirement: 'level-45-premium',
      price: 0
    },
    {
      id: 'graduate',
      name: 'Graduate',
      description: 'You\'ve earned your degree in quiz mastery.',
      rarity: 'rare',
      imageUrl: '/avatars/graduate.png',
      unlockType: 'battlepass',
      unlockRequirement: 'level-50-free',
      price: 0
    },
    {
      id: 'tournament-master',
      name: 'Tournament Master',
      description: 'For those who dominate the tournament circuit.',
      rarity: 'legendary',
      imageUrl: '/avatars/tournament-master.png',
      unlockType: 'achievement',
      unlockRequirement: 'win-10-tournaments',
      price: 0
    },
    {
      id: 'cosmic-brain',
      name: 'Cosmic Brain',
      description: 'Your knowledge spans the universe.',
      rarity: 'legendary',
      imageUrl: '/avatars/cosmic-brain.png',
      unlockType: 'tokens',
      unlockRequirement: null,
      price: 2000
    }
  ],
  frames: [
    {
      id: 'default-frame',
      name: 'Default Frame',
      description: 'The standard frame for all players.',
      rarity: 'common',
      imageUrl: '/frames/default.png',
      unlockType: 'default',
      unlockRequirement: null,
      price: 0
    },
    {
      id: 'bronze-frame',
      name: 'Bronze Frame',
      description: 'A frame for those starting their journey.',
      rarity: 'uncommon',
      imageUrl: '/frames/bronze.png',
      unlockType: 'tokens',
      unlockRequirement: null,
      price: 100
    },
    {
      id: 'silver-scholar',
      name: 'Silver Scholar Frame',
      description: 'A silvery frame for dedicated learners.',
      rarity: 'rare',
      imageUrl: '/frames/silver-scholar.png',
      unlockType: 'battlepass',
      unlockRequirement: 'level-25-free',
      price: 0
    },
    {
      id: 'golden-genius',
      name: 'Golden Genius Frame',
      description: 'A golden frame fit for a genius.',
      rarity: 'epic',
      imageUrl: '/frames/golden-genius.png',
      unlockType: 'battlepass',
      unlockRequirement: 'level-5-premium',
      price: 0
    },
    {
      id: 'platinum-genius',
      name: 'Platinum Genius Frame',
      description: 'A platinum frame for the elite minds.',
      rarity: 'epic',
      imageUrl: '/frames/platinum-genius.png',
      unlockType: 'battlepass',
      unlockRequirement: 'level-35-premium',
      price: 0
    },
    {
      id: 'diamond-frame',
      name: 'Diamond Frame',
      description: 'A brilliant frame that shines with the light of knowledge.',
      rarity: 'legendary',
      imageUrl: '/frames/diamond.png',
      unlockType: 'tokens',
      unlockRequirement: null,
      price: 1500
    },
    {
      id: 'championship-frame',
      name: 'Championship Frame',
      description: 'A frame reserved for champions of the MindArena.',
      rarity: 'legendary',
      imageUrl: '/frames/championship.png',
      unlockType: 'achievement',
      unlockRequirement: 'win-championship',
      price: 0
    }
  ],
  effects: [
    {
      id: 'default-effect',
      name: 'No Effect',
      description: 'No special effect.',
      rarity: 'common',
      imageUrl: '/effects/none.png',
      unlockType: 'default',
      unlockRequirement: null,
      price: 0
    },
    {
      id: 'sparkle-effect',
      name: 'Sparkle Effect',
      description: 'Adds a subtle sparkle to your profile.',
      rarity: 'uncommon',
      imageUrl: '/effects/sparkle.png',
      unlockType: 'tokens',
      unlockRequirement: null,
      price: 300
    },
    {
      id: 'flame-effect',
      name: 'Flame Effect',
      description: 'Your profile is on fire!',
      rarity: 'rare',
      imageUrl: '/effects/flame.png',
      unlockType: 'tokens',
      unlockRequirement: null,
      price: 800
    },
    {
      id: 'knowledge-aura',
      name: 'Knowledge Aura Effect',
      description: 'An ethereal aura of wisdom surrounds your profile.',
      rarity: 'epic',
      imageUrl: '/effects/knowledge-aura.png',
      unlockType: 'battlepass',
      unlockRequirement: 'level-50-premium',
      price: 0
    },
    {
      id: 'galaxy-brain',
      name: 'Galaxy Brain Effect',
      description: 'Your mind encompasses the stars and galaxies.',
      rarity: 'legendary',
      imageUrl: '/effects/galaxy-brain.png',
      unlockType: 'tokens',
      unlockRequirement: null,
      price: 2500
    }
  ],
  titles: [
    {
      id: 'novice',
      name: 'Novice',
      description: 'Just beginning the journey.',
      rarity: 'common',
      unlockType: 'default',
      unlockRequirement: null,
      price: 0
    },
    {
      id: 'quiz-wizard',
      name: 'Quiz Wizard',
      description: 'A master of the quizzing arts.',
      rarity: 'rare',
      unlockType: 'battlepass',
      unlockRequirement: 'level-40-free',
      price: 0
    },
    {
      id: 'mastermind',
      name: 'Mastermind',
      description: 'A strategic thinker of the highest order.',
      rarity: 'epic',
      unlockType: 'battlepass',
      unlockRequirement: 'level-15-premium',
      price: 0
    },
    {
      id: 'grand-champion',
      name: 'Grand Champion',
      description: 'The ultimate title for the ultimate player.',
      rarity: 'epic',
      unlockType: 'battlepass',
      unlockRequirement: 'level-30-premium',
      price: 0
    },
    {
      id: 'knowledge-keeper',
      name: 'Knowledge Keeper',
      description: 'Guardian of wisdom and lore.',
      rarity: 'rare',
      unlockType: 'tokens',
      unlockRequirement: null,
      price: 400
    },
    {
      id: 'mind-emperor',
      name: 'Mind Emperor',
      description: 'Ruler of the realm of knowledge.',
      rarity: 'legendary',
      unlockType: 'tokens',
      unlockRequirement: null,
      price: 3000
    }
  ]
};

// User cosmetics storage
const userCosmetics = new Map(); // Maps userId to their unlocked cosmetics

// Function to get or initialize user cosmetics
function getUserCosmetics(userId) {
  if (!userCosmetics.has(userId)) {
    userCosmetics.set(userId, {
      unlockedAvatars: ['default-avatar'],
      unlockedFrames: ['default-frame'],
      unlockedEffects: ['default-effect'],
      unlockedTitles: ['novice'],
      equippedAvatar: 'default-avatar',
      equippedFrame: 'default-frame',
      equippedEffect: 'default-effect',
      equippedTitle: 'novice'
    });
  }
  return userCosmetics.get(userId);
}

// Function to check if a user has unlocked a specific cosmetic
function hasUnlockedCosmetic(userId, type, itemId) {
  const userItems = getUserCosmetics(userId);
  
  switch (type) {
    case 'avatar':
      return userItems.unlockedAvatars.includes(itemId);
    case 'frame':
      return userItems.unlockedFrames.includes(itemId);
    case 'effect':
      return userItems.unlockedEffects.includes(itemId);
    case 'title':
      return userItems.unlockedTitles.includes(itemId);
    default:
      return false;
  }
}

// Function to unlock a cosmetic for a user
function unlockCosmetic(userId, type, itemId) {
  const userItems = getUserCosmetics(userId);
  let alreadyUnlocked = false;
  
  switch (type) {
    case 'avatar':
      alreadyUnlocked = userItems.unlockedAvatars.includes(itemId);
      if (!alreadyUnlocked) {
        userItems.unlockedAvatars.push(itemId);
      }
      break;
    case 'frame':
      alreadyUnlocked = userItems.unlockedFrames.includes(itemId);
      if (!alreadyUnlocked) {
        userItems.unlockedFrames.push(itemId);
      }
      break;
    case 'effect':
      alreadyUnlocked = userItems.unlockedEffects.includes(itemId);
      if (!alreadyUnlocked) {
        userItems.unlockedEffects.push(itemId);
      }
      break;
    case 'title':
      alreadyUnlocked = userItems.unlockedTitles.includes(itemId);
      if (!alreadyUnlocked) {
        userItems.unlockedTitles.push(itemId);
      }
      break;
    default:
      return { success: false, message: 'Invalid cosmetic type.' };
  }
  
  if (alreadyUnlocked) {
    return { success: false, message: 'You already own this item.' };
  }
  
  return { success: true, message: 'Cosmetic unlocked successfully!' };
}

// Function to equip a cosmetic for a user
function equipCosmetic(userId, type, itemId) {
  const userItems = getUserCosmetics(userId);
  
  // Check if the user has unlocked this cosmetic
  if (!hasUnlockedCosmetic(userId, type, itemId)) {
    return { success: false, message: 'You have not unlocked this item yet.' };
  }
  
  // Equip the cosmetic based on type
  switch (type) {
    case 'avatar':
      userItems.equippedAvatar = itemId;
      break;
    case 'frame':
      userItems.equippedFrame = itemId;
      break;
    case 'effect':
      userItems.equippedEffect = itemId;
      break;
    case 'title':
      userItems.equippedTitle = itemId;
      break;
    default:
      return { success: false, message: 'Invalid cosmetic type.' };
  }
  
  return { 
    success: true, 
    message: 'Cosmetic equipped successfully!',
    equipped: { type, itemId }
  };
}

// Function to purchase a cosmetic with tokens
function purchaseCosmetic(userId, type, itemId) {
  // Check if user already owns this cosmetic
  if (hasUnlockedCosmetic(userId, type, itemId)) {
    return { success: false, message: 'You already own this item.' };
  }
  
  // Get cosmetic details
  let item;
  switch (type) {
    case 'avatar':
      item = cosmetics.avatars.find(a => a.id === itemId);
      break;
    case 'frame':
      item = cosmetics.frames.find(f => f.id === itemId);
      break;
    case 'effect':
      item = cosmetics.effects.find(e => e.id === itemId);
      break;
    case 'title':
      item = cosmetics.titles.find(t => t.id === itemId);
      break;
    default:
      return { success: false, message: 'Invalid cosmetic type.' };
  }
  
  if (!item) {
    return { success: false, message: 'Item not found.' };
  }
  
  // Check if item is purchasable with tokens
  if (item.unlockType !== 'tokens') {
    return { success: false, message: 'This item cannot be purchased with tokens.' };
  }
  
  // Check if user has enough tokens
  const userBalance = userTokens.get(userId) || 0;
  if (userBalance < item.price) {
    return { 
      success: false, 
      message: `Insufficient tokens. Required: ${item.price}, Available: ${userBalance}` 
    };
  }
  
  // Deduct tokens and unlock the cosmetic
  userTokens.set(userId, userBalance - item.price);
  unlockCosmetic(userId, type, itemId);
  
  return { 
    success: true, 
    message: `Successfully purchased ${item.name}!`,
    newBalance: userBalance - item.price
  };
}

// Function to check for battle pass cosmetic unlocks
function checkBattlePassCosmeticUnlocks(userId) {
  const progress = getUserBattlePassProgress(userId);
  
  // Check for level-based unlocks
  let newUnlocks = [];
  
  // Check avatars
  cosmetics.avatars.forEach(avatar => {
    if (avatar.unlockType === 'battlepass' && !hasUnlockedCosmetic(userId, 'avatar', avatar.id)) {
      // Parse the unlock requirement (e.g., "level-20-premium")
      const [type, levelStr, passType] = avatar.unlockRequirement.split('-');
      const level = parseInt(levelStr, 10);
      
      // Check if user meets the requirements
      if (type === 'level' && progress.level >= level) {
        if ((passType === 'premium' && progress.isPremium) || (passType === 'free')) {
          const result = unlockCosmetic(userId, 'avatar', avatar.id);
          if (result.success) {
            newUnlocks.push({ type: 'avatar', item: avatar });
          }
        }
      }
    }
  });
  
  // Check frames
  cosmetics.frames.forEach(frame => {
    if (frame.unlockType === 'battlepass' && !hasUnlockedCosmetic(userId, 'frame', frame.id)) {
      const [type, levelStr, passType] = frame.unlockRequirement.split('-');
      const level = parseInt(levelStr, 10);
      
      if (type === 'level' && progress.level >= level) {
        if ((passType === 'premium' && progress.isPremium) || (passType === 'free')) {
          const result = unlockCosmetic(userId, 'frame', frame.id);
          if (result.success) {
            newUnlocks.push({ type: 'frame', item: frame });
          }
        }
      }
    }
  });
  
  // Check effects
  cosmetics.effects.forEach(effect => {
    if (effect.unlockType === 'battlepass' && !hasUnlockedCosmetic(userId, 'effect', effect.id)) {
      const [type, levelStr, passType] = effect.unlockRequirement.split('-');
      const level = parseInt(levelStr, 10);
      
      if (type === 'level' && progress.level >= level) {
        if ((passType === 'premium' && progress.isPremium) || (passType === 'free')) {
          const result = unlockCosmetic(userId, 'effect', effect.id);
          if (result.success) {
            newUnlocks.push({ type: 'effect', item: effect });
          }
        }
      }
    }
  });
  
  // Check titles
  cosmetics.titles.forEach(title => {
    if (title.unlockType === 'battlepass' && !hasUnlockedCosmetic(userId, 'title', title.id)) {
      const [type, levelStr, passType] = title.unlockRequirement.split('-');
      const level = parseInt(levelStr, 10);
      
      if (type === 'level' && progress.level >= level) {
        if ((passType === 'premium' && progress.isPremium) || (passType === 'free')) {
          const result = unlockCosmetic(userId, 'title', title.id);
          if (result.success) {
            newUnlocks.push({ type: 'title', item: title });
          }
        }
      }
    }
  });
  
  return newUnlocks;
}

// Tournament registration function
function registerForTournament(userId, tournamentId) {
  const tournament = tournaments.find(t => t.id === tournamentId);
  
  if (!tournament) {
    return { success: false, message: 'Tournament not found' };
  }
  
  if (tournament.status !== 'upcoming') {
    return { success: false, message: 'Tournament is not open for registration' };
  }
  
  if (tournament.participants.length >= tournament.maxParticipants) {
    return { success: false, message: 'Tournament is full' };
  }
  
  if (tournament.participants.includes(userId)) {
    return { success: false, message: 'You are already registered for this tournament' };
  }
  
  // Check if user has enough tokens
  const userBalance = userTokens.get(userId) || 0;
  if (userBalance < tournament.entryFee) {
    return { success: false, message: `Insufficient tokens. Required: ${tournament.entryFee}, Available: ${userBalance}` };
  }
  
  // Deduct tokens and register user
  userTokens.set(userId, userBalance - tournament.entryFee);
  tournament.participants.push(userId);
  
  return { 
    success: true, 
    message: 'Successfully registered for tournament',
    newBalance: userBalance - tournament.entryFee
  };
}

// Function to format date display
function formatDateDisplay(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  
  // Calculate difference in days
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays > 1 && diffDays < 7) {
    return `In ${diffDays} days`;
  } else if (diffDays >= 7 && diffDays < 14) {
    return 'In 1 week';
  } else if (diffDays >= 14 && diffDays < 21) {
    return 'In 2 weeks';
  } else if (diffDays >= 21 && diffDays < 28) {
    return 'In 3 weeks';
  } else {
    // Format the actual date
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// Quiz data
const quizQuestions = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2, // Paris (0-indexed)
    category: "Geography",
    difficulty: "easy",
    timeLimit: 10 // seconds
  },
  {
    id: 2,
    question: "Which element has the chemical symbol 'O'?",
    options: ["Gold", "Oxygen", "Iron", "Carbon"],
    correctAnswer: 1, // Oxygen
    category: "Science",
    difficulty: "easy",
    timeLimit: 10
  },
  {
    id: 3,
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: 2, // Leonardo da Vinci
    category: "Art",
    difficulty: "easy",
    timeLimit: 10
  },
  {
    id: 4,
    question: "What is the largest planet in our Solar System?",
    options: ["Earth", "Jupiter", "Saturn", "Mars"],
    correctAnswer: 1, // Jupiter
    category: "Science",
    difficulty: "easy",
    timeLimit: 10
  },
  {
    id: 5,
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2, // 1945
    category: "History",
    difficulty: "easy",
    timeLimit: 10
  }
];

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to MindArena WebSocket Server'
  }));
  
  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data.type);
      
      // Basic message handler
      if (data.type === 'auth') {
        ws.userId = data.userId;
        ws.displayName = data.displayName;
        
        ws.send(JSON.stringify({
          type: 'authSuccess',
          message: 'Authentication successful'
        }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Payment API Endpoints

// Verify Flutterwave payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { txRef, transactionId, purchaseType, productId, amount } = req.body;
    
    if (!txRef || !transactionId || !purchaseType || !productId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }
    
    // Verify transaction with Flutterwave API
    const verifyUrl = `${FLUTTERWAVE_API_URL}/transactions/${transactionId}/verify`;
    
    // Use Node.js built-in fetch
    const https = require('https');
    
    // Use a Promise-based approach with https
    const data = await new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`
        }
      };
      
      const req = https.request(verifyUrl, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (error) {
            reject(new Error('Failed to parse response: ' + error.message));
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.end();
    });
    
    if (data.status === 'success' && 
        data.data.tx_ref === txRef && 
        data.data.amount >= amount && 
        data.data.currency === 'USD') {
      
      // Transaction is verified, process based on purchase type
      if (purchaseType === 'token_purchase') {
        // Get token amount from product ID
        const tokenAmount = getTokenAmountFromPackage(productId);
        if (!tokenAmount) {
          return res.status(400).json({
            success: false,
            message: 'Invalid token package'
          });
        }
        
        // Add tokens to user account
        // Extract user ID from transaction reference or request
        const userId = getUserIdFromReference(txRef);
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Could not identify user'
          });
        }
        
        // Add tokens to user's account
        const success = await addTokens(userId, tokenAmount);
        
        return res.json({
          success: true,
          message: `Payment verified and ${tokenAmount} tokens added`,
          data: {
            tokens: tokenAmount,
            transactionId
          }
        });
      } 
      else if (purchaseType === 'battle_pass_purchase') {
        // Process battle pass purchase
        const userId = getUserIdFromReference(txRef);
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Could not identify user'
          });
        }
        
        // Upgrade user to premium battle pass
        const success = await upgradeToPremiumBattlePass(userId);
        
        return res.json({
          success: true,
          message: 'Payment verified and Battle Pass upgraded',
          data: {
            battlePassId: productId,
            transactionId
          }
        });
      }
      else {
        return res.status(400).json({
          success: false,
          message: 'Unknown purchase type'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        data: data
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during payment verification'
    });
  }
});

// Helper function to extract user ID from transaction reference
function getUserIdFromReference(txRef) {
  // Expected format: mind_arena_tokens_userId_uuid or mind_arena_bp_userId_uuid
  try {
    const parts = txRef.split('_');
    if (parts.length >= 4) {
      if (parts[0] === 'mind' && parts[1] === 'arena') {
        // The third part might be 'tokens' or 'bp', so we'll check the fourth part
        return parts[3]; // This assumes the user ID is the fourth part
      }
    }
    return null;
  } catch (e) {
    console.error('Error extracting user ID from reference:', e);
    return null;
  }
}

// Helper function to get token amount from package ID
function getTokenAmountFromPackage(packageId) {
  const tokenPackages = {
    'tokens_100': 100,
    'tokens_500': 500,
    'tokens_1000': 1000,
    'tokens_2500': 2500,
    'tokens_5000': 5000
  };
  
  return tokenPackages[packageId] || null;
}

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
  console.log(`WebSocket server running at ws://0.0.0.0:${port}/ws`);
});