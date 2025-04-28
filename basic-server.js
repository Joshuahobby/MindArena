const express = require('express');
const cors = require('cors');

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve a simple landing page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>MindArena</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #2D3436;
      color: white;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .logo {
      width: 100px;
      height: 100px;
      background-color: #6C5CE7;
      border-radius: 50%;
      margin: 20px auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .button {
      background-color: #6C5CE7;
      color: white;
      border: none;
      padding: 10px 20px;
      margin: 10px;
      border-radius: 5px;
      cursor: pointer;
    }
    .feature {
      background-color: rgba(255,255,255,0.1);
      padding: 15px;
      margin: 10px;
      border-radius: 5px;
      display: inline-block;
      width: 200px;
      cursor: pointer;
    }
    .message {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #4CAF50;
      color: white;
      padding: 15px;
      border-radius: 5px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">M</div>
    <h1>MindArena</h1>
    <p>Where Fast Minds Become Champions</p>
    
    <div>
      <button class="button" onclick="showMessage('Login functionality coming soon!')">LOGIN</button>
      <button class="button" onclick="showMessage('Registration functionality coming soon!')">REGISTER</button>
    </div>
    
    <div style="margin-top: 30px;">
      <div class="feature" onclick="showMessage('Quiz Battles feature coming soon!')">
        <h3>Quiz Battles</h3>
        <p>Compete in real-time quiz matches</p>
      </div>
      <div class="feature" onclick="showMessage('Tournaments feature coming soon!')">
        <h3>Tournaments</h3>
        <p>Join tournaments with token entry fees</p>
      </div>
      <div class="feature" onclick="showMessage('Clans feature coming soon!')">
        <h3>Clans</h3>
        <p>Form teams and compete together</p>
      </div>
    </div>
  </div>
  
  <div id="message" class="message"></div>
  
  <script>
    function showMessage(text) {
      const messageEl = document.getElementById('message');
      messageEl.textContent = text;
      messageEl.style.display = 'block';
      
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 3000);
    }
  </script>
</body>
</html>
  `);
});

// API endpoint to check server health
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});