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
            <div class="profile-avatar" id="profileInitial">?</div>
            <div class="profile-name" id="profileName">...</div>
            <button class="button logout-button" onclick="handleLogout()">Logout</button>
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
            <div class="profile-avatar" id="profileInitial">?</div>
            <div class="profile-name" id="profileName">...</div>
            <button class="button logout-button" onclick="handleLogout()">Logout</button>
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

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
  console.log(`WebSocket server running at ws://0.0.0.0:${port}/ws`);
});