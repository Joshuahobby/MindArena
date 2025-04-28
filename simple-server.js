const express = require('express');
const path = require('path');
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
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MindArena</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
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
        .features {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 16px;
          max-width: 600px;
          margin-top: 32px;
          margin-bottom: 40px;
        }
        .feature {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px;
          width: 160px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        .feature:hover {
          background-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-5px);
          border-color: #6C5CE7;
        }
        .feature h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #6C5CE7;
        }
        .feature p {
          margin: 0;
          font-size: 14px;
          color: #B2BEC3;
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
          box-shadow: 0 5px 15px rgba(108, 92, 231, 0.3);
        }
        .button.outline {
          background-color: transparent;
          border: 2px solid #6C5CE7;
        }
        .button.outline:hover {
          background-color: rgba(108, 92, 231, 0.1);
        }
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: center;
          padding: 16px 0;
        }
        .nav-links {
          display: flex;
          gap: 32px;
        }
        .nav-link {
          color: #B2BEC3;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .nav-link:hover {
          color: #6C5CE7;
        }
      </style>
    </head>
    <body>
      <div class="logo" onclick="window.location.reload()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
        </svg>
      </div>
      <h1>MindArena</h1>
      <p>Where Fast Minds Become Champions</p>
      
      <div class="auth-buttons">
        <button class="button" onclick="showLogin()">LOGIN</button>
        <button class="button outline" onclick="showRegister()">REGISTER</button>
      </div>
      
      <div class="features">
        <div class="feature" onclick="featureClick('quiz')">
          <h3>Quiz Battles</h3>
          <p>Compete in real-time quiz matches</p>
        </div>
        <div class="feature" onclick="featureClick('tournaments')">
          <h3>Tournaments</h3>
          <p>Join tournaments with token entry fees</p>
        </div>
        <div class="feature" onclick="featureClick('clans')">
          <h3>Clans</h3>
          <p>Form teams and compete together</p>
        </div>
      </div>
      
      <div id="success-message" style="display: none; position: fixed; bottom: 20px; right: 20px; background-color: #4CAF50; color: white; padding: 12px 20px; border-radius: 4px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); z-index: 9999;"></div>
      
      <div class="bottom-nav">
        <div class="nav-links">
          <a href="#" onclick="navClick('about')" class="nav-link">About</a>
          <a href="#" onclick="navClick('features')" class="nav-link">Features</a>
          <a href="#" onclick="navClick('contact')" class="nav-link">Contact</a>
          <a href="#" onclick="navClick('privacy')" class="nav-link">Privacy Policy</a>
        </div>
      </div>
      
      <script>
        function showSuccess(message) {
          const successElement = document.getElementById('success-message');
          successElement.textContent = message;
          successElement.style.display = 'block';
          
          setTimeout(() => {
            successElement.style.display = 'none';
          }, 3000);
        }
        
        function showLogin() {
          showSuccess('Login functionality will be implemented with Firebase');
        }
        
        function showRegister() {
          showSuccess('Registration functionality will be implemented with Firebase');
        }
        
        function featureClick(feature) {
          showSuccess('This would navigate to the ' + feature + ' screen in the real app');
        }
        
        function navClick(page) {
          showSuccess('This would navigate to the ' + page + ' page');
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