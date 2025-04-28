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

// Tournaments page route
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
          <a href="#" class="nav-link">Play Now</a>
          <a href="/tournaments" class="nav-link active">Tournaments</a>
          <a href="/battle-pass" class="nav-link">Battle Pass</a>
          <a href="#" class="nav-link">Leaderboard</a>
        </div>
        
        <div class="profile-menu">
          <div class="profile-avatar" id="profileInitial">?</div>
          <div class="profile-name" id="profileName">...</div>
          <button class="button logout-button" onclick="handleLogout()">Logout</button>
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
          <a href="/tournaments" class="nav-link">Tournaments</a>
          <a href="/battle-pass" class="nav-link">Battle Pass</a>
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
            <div class="action-buttons">
              <div class="token-display">
                <span class="token-icon">T</span>
                <span id="tokenBalance">0</span>
                <button class="button button-small" onclick="addTokens()">+</button>
              </div>
              <button class="button" id="playButton" onclick="startQuickMatch()">Play Quick Match</button>
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
  
  res.json({
    success: true,
    levelUp: result.leveledUp,
    oldLevel: result.oldLevel,
    newLevel: result.newLevel,
    xpAdded: result.xpGained
  });
});

// API endpoint to check server health
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Setup WebSocket Server
const wss = new WebSocket.Server({ server, path: '/ws' });

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

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
  console.log(`WebSocket server running at ws://0.0.0.0:${port}/ws`);
});