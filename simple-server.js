const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const firebase = require('firebase/app');
require('firebase/auth');

// Initialize express app and create HTTP server
const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);

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

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard - MindArena</title>
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
          <a href="#" class="nav-link">Play Now</a>
          <a href="#" class="nav-link">Tournaments</a>
          <a href="#" class="nav-link">Battle Pass</a>
          <a href="#" class="nav-link">Leaderboard</a>
        </div>
        
        <div class="profile-menu">
          <div class="profile-avatar" id="profileInitial">?</div>
          <div class="profile-name" id="profileName">...</div>
          <button class="button logout-button" onclick="handleLogout()">Logout</button>
        </div>
      </div>
      
      <div class="content">
        <div id="mainContent">
          <div class="dashboard-header">
            <div class="greeting">Welcome to MindArena, <span id="userDisplay">User</span>!</div>
            <button class="button" id="playButton" onclick="startQuickMatch()">Play Quick Match</button>
          </div>
          
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
              <div class="game-item">
                <div class="game-title">Weekly Challenge</div>
                <div class="game-time">Starts in 2 days</div>
                <div class="game-players">
                  <div class="player-count">125 players registered</div>
                </div>
              </div>
              
              <div class="game-item">
                <div class="game-title">Science Showdown</div>
                <div class="game-time">Starts in 4 days</div>
                <div class="game-players">
                  <div class="player-count">87 players registered</div>
                </div>
              </div>
              
              <div class="game-item">
                <div class="game-title">History Masters</div>
                <div class="game-time">Starts in 1 week</div>
                <div class="game-players">
                  <div class="player-count">62 players registered</div>
                </div>
              </div>
              
              <div class="game-item">
                <div class="game-title">Ultimate Quiz Championship</div>
                <div class="game-time">Starts in 2 weeks</div>
                <div class="game-players">
                  <div class="player-count">210 players registered</div>
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
            
            // Connect to WebSocket for game functionality
            connectWebSocket();
          } else {
            // No user is signed in, redirect to home
            console.log('No user is signed in, redirecting to home');
            window.location.href = '/';
          }
        });
        
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
        
        // Handle logout
        function handleLogout() {
          // Close WebSocket connection if open
          if (socket && socket.readyState === WebSocket.OPEN) {
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

// API endpoint to check server health
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Setup WebSocket Server
const wss = new WebSocket.Server({ server, path: '/ws' });

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

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
  console.log(`WebSocket server running at ws://0.0.0.0:${port}/ws`);
});