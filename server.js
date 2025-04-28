const express = require('express');
const path = require('path');
const cors = require('cors');
const firebase = require('firebase/app');
require('firebase/auth');

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Middleware
app.use(cors());
app.use(express.json());

// Serve a landing page with Firebase authentication
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
        .auth-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.8);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 100;
        }
        .auth-modal.show {
          display: flex;
        }
        .modal-content {
          background-color: #2D3436;
          padding: 32px;
          border-radius: 16px;
          max-width: 400px;
          width: 100%;
          position: relative;
          border: 2px solid #6C5CE7;
        }
        .close-modal {
          position: absolute;
          top: 16px;
          right: 16px;
          font-size: 24px;
          cursor: pointer;
          color: #B2BEC3;
        }
        .close-modal:hover {
          color: white;
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
      <!-- Firebase App (the core Firebase SDK) -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
      <!-- Firebase Auth -->
      <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
    </head>
    <body>
      <div id="loginModal" class="auth-modal">
        <div class="modal-content">
          <span class="close-modal" onclick="closeModal('loginModal')">&times;</span>
          <h2>Login to MindArena</h2>
          <p>Enter your credentials to continue</p>
          <form id="loginForm">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="Enter your email" required>
            
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password" required>
            
            <button type="button" onclick="handleLogin()" class="button" style="width: 100%; margin-bottom: 16px;">LOGIN</button>
            
            <div style="text-align: center; margin-bottom: 16px;">
              <p style="margin-bottom: 10px; color: #B2BEC3;">OR</p>
              <button type="button" onclick="signInWithGoogle()" class="button" style="width: 100%; background-color: #DB4437; display: flex; align-items: center; justify-content: center; gap: 10px;">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#ffffff" d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"></path>
                  <path fill="#ffffff" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"></path>
                  <path fill="#ffffff" d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"></path>
                  <path fill="#ffffff" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"></path>
                  <path fill="none" d="M0 0h18v18H0z"></path>
                </svg>
                Sign in with Google
              </button>
            </div>
          </form>
          <p style="margin-top: 16px; text-align: center;">
            Don't have an account? <a href="#" onclick="showModal('registerModal'); closeModal('loginModal');" style="color: #6C5CE7;">Register</a>
          </p>
        </div>
      </div>
      
      <div id="registerModal" class="auth-modal">
        <div class="modal-content">
          <span class="close-modal" onclick="closeModal('registerModal')">&times;</span>
          <h2>Create an Account</h2>
          <p>Join MindArena and start competing</p>
          <form id="registerForm">
            <label for="username">Username</label>
            <input type="text" id="username" placeholder="Choose a username" required>
            
            <label for="regEmail">Email</label>
            <input type="email" id="regEmail" placeholder="Enter your email" required>
            
            <label for="regPassword">Password</label>
            <input type="password" id="regPassword" placeholder="Create a password" required>
            
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" placeholder="Confirm your password" required>
            
            <button type="button" onclick="handleRegister()" class="button" style="width: 100%; margin-bottom: 16px;">REGISTER</button>
            
            <div style="text-align: center; margin-bottom: 16px;">
              <p style="margin-bottom: 10px; color: #B2BEC3;">OR</p>
              <button type="button" onclick="signInWithGoogle()" class="button" style="width: 100%; background-color: #DB4437; display: flex; align-items: center; justify-content: center; gap: 10px;">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#ffffff" d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"></path>
                  <path fill="#ffffff" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"></path>
                  <path fill="#ffffff" d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"></path>
                  <path fill="#ffffff" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"></path>
                  <path fill="none" d="M0 0h18v18H0z"></path>
                </svg>
                Sign up with Google
              </button>
            </div>
          </form>
          <p style="margin-top: 16px; text-align: center;">
            Already have an account? <a href="#" onclick="showModal('loginModal'); closeModal('registerModal');" style="color: #6C5CE7;">Login</a>
          </p>
        </div>
      </div>
      
      <div class="logo" onclick="window.location.reload()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
        </svg>
      </div>
      <h1>MindArena</h1>
      <p>Where Fast Minds Become Champions</p>
      
      <div class="auth-buttons">
        <button class="button" onclick="showModal('loginModal')">LOGIN</button>
        <button class="button outline" onclick="showModal('registerModal')">REGISTER</button>
      </div>
      
      <div class="features">
        <div class="feature" onclick="navigateTo('quiz')">
          <h3>Quiz Battles</h3>
          <p>Compete in real-time quiz matches</p>
        </div>
        <div class="feature" onclick="navigateTo('tournaments')">
          <h3>Tournaments</h3>
          <p>Join tournaments with token entry fees</p>
        </div>
        <div class="feature" onclick="navigateTo('clans')">
          <h3>Clans</h3>
          <p>Form teams and compete together</p>
        </div>
      </div>
      
      <div class="bottom-nav">
        <div class="nav-links">
          <a href="#" onclick="navLinkClick('about')" class="nav-link">About</a>
          <a href="#" onclick="navLinkClick('features')" class="nav-link">Features</a>
          <a href="#" onclick="navLinkClick('contact')" class="nav-link">Contact</a>
          <a href="#" onclick="navLinkClick('privacy')" class="nav-link">Privacy Policy</a>
        </div>
      </div>
      
      <script>
        // Initialize Firebase
        const firebaseConfig = {
          apiKey: "${process.env.VITE_FIREBASE_API_KEY}",
          authDomain: "${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com",
          projectId: "${process.env.VITE_FIREBASE_PROJECT_ID}",
          storageBucket: "${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com",
          appId: "${process.env.VITE_FIREBASE_APP_ID}"
        };
        
        firebase.initializeApp(firebaseConfig);
        
        // UI functions
        function showModal(modalId) {
          document.getElementById(modalId).classList.add('show');
        }
        
        function closeModal(modalId) {
          document.getElementById(modalId).classList.remove('show');
        }
        
        function navigateTo(page) {
          alert('This would navigate to the ' + page + ' screen in the real app. For now, please login or register to continue.');
          showModal('loginModal');
        }
        
        function navLinkClick(page) {
          showSuccess('This would navigate to the ' + page + ' page in the full app');
        }
        
        // Close modals when clicking outside
        window.onclick = function(event) {
          const loginModal = document.getElementById('loginModal');
          const registerModal = document.getElementById('registerModal');
          
          if (event.target === loginModal) {
            closeModal('loginModal');
          }
          
          if (event.target === registerModal) {
            closeModal('registerModal');
          }
        };
        
        // Show an error message in the form
        function showFormError(formId, message) {
          // Check if an error element already exists, if not create one
          let errorElement = document.getElementById(formId + '-error');
          
          if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = formId + '-error';
            errorElement.className = 'error-message';
            errorElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            errorElement.style.color = '#ff5252';
            errorElement.style.padding = '10px';
            errorElement.style.borderRadius = '4px';
            errorElement.style.marginBottom = '16px';
            errorElement.style.borderLeft = '4px solid #ff5252';
            
            // Insert at the top of the form
            const form = document.getElementById(formId);
            form.insertBefore(errorElement, form.firstChild);
          }
          
          errorElement.innerHTML = '<strong>Error:</strong> ' + message;
          errorElement.style.display = 'block';
        }
        
        // Clear any form errors
        function clearFormError(formId) {
          const errorElement = document.getElementById(formId + '-error');
          if (errorElement) {
            errorElement.style.display = 'none';
          }
        }
        
        // Show a success message
        function showSuccess(message) {
          // Create a success toast
          const toast = document.createElement('div');
          toast.className = 'success-toast';
          toast.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span>' + message + '</span></div>';
          
          // Style the toast
          Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: '9999',
            opacity: '0',
            transition: 'opacity 0.3s ease-in-out'
          });
          
          // Add to DOM
          document.body.appendChild(toast);
          
          // Show and auto-hide
          setTimeout(() => {
            toast.style.opacity = '1';
          }, 10);
          
          setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
              document.body.removeChild(toast);
            }, 300);
          }, 3000);
        }
        
        // Google Sign-In function
        function signInWithGoogle() {
          clearFormError('loginForm');
          clearFormError('registerForm');
          
          const googleProvider = new firebase.auth.GoogleAuthProvider();
          
          firebase.auth().signInWithPopup(googleProvider)
            .then((result) => {
              // This gives you a Google Access Token
              const credential = result.credential;
              const token = credential.accessToken;
              // The signed-in user info
              const user = result.user;
              
              console.log('Successfully signed in with Google:', user.displayName);
              showSuccess('Welcome ' + user.displayName + '! Successfully signed in with Google!');
              
              // Close both modals
              closeModal('loginModal');
              closeModal('registerModal');
            })
            .catch((error) => {
              // Handle Errors here
              const errorCode = error.code;
              const errorMessage = error.message;
              console.error('Google Sign-In error:', errorCode, errorMessage);
              
              showFormError('loginForm', 'Failed to sign in with Google: ' + errorMessage);
            });
        }
        
        // Handle login form submission
        function handleLogin() {
          // Clear previous errors
          clearFormError('loginForm');
          
          try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Validate inputs
            if (!email) {
              showFormError('loginForm', 'Please enter your email address.');
              return;
            }
            
            if (!password) {
              showFormError('loginForm', 'Please enter your password.');
              return;
            }
            
            // Get the login button
            const loginButton = document.querySelector('#loginForm button[type="button"]');
            const originalText = loginButton.innerHTML;
            loginButton.innerHTML = 'Logging in...';
            loginButton.disabled = true;
            
            // Authenticate with Firebase
            firebase.auth().signInWithEmailAndPassword(email, password)
              .then((userCredential) => {
                // User signed in successfully
                const user = userCredential.user;
                console.log('User logged in successfully:', user.email);
                
                // Reset button
                loginButton.innerHTML = originalText;
                loginButton.disabled = false;
                
                // Show success message
                showSuccess('Successfully logged in!');
                
                // Close modal
                closeModal('loginModal');
              })
              .catch((error) => {
                // Reset button
                loginButton.innerHTML = originalText;
                loginButton.disabled = false;
                
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error('Login error:', errorCode, errorMessage);
                
                // Show appropriate error message
                if (errorCode === 'auth/user-not-found') {
                  showFormError('loginForm', 'No user found with this email address.');
                } else if (errorCode === 'auth/wrong-password') {
                  showFormError('loginForm', 'Incorrect password. Please try again.');
                } else {
                  showFormError('loginForm', 'Login failed: ' + errorMessage);
                }
              });
          } catch (error) {
            console.error('Login error:', error);
            showFormError('loginForm', 'An unexpected error occurred. Please try again.');
          }
        }
        
        // Handle registration form submission
        function handleRegister() {
          // Clear previous errors
          clearFormError('registerForm');
          
          try {
            const username = document.getElementById('username').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validate inputs
            if (!username) {
              showFormError('registerForm', 'Please enter a username.');
              return;
            }
            
            if (!email) {
              showFormError('registerForm', 'Please enter your email address.');
              return;
            }
            
            if (!password) {
              showFormError('registerForm', 'Please enter a password.');
              return;
            }
            
            if (password.length < 6) {
              showFormError('registerForm', 'Password must be at least 6 characters long.');
              return;
            }
            
            if (password !== confirmPassword) {
              showFormError('registerForm', 'Passwords do not match. Please try again.');
              return;
            }
            
            // Get the register button
            const registerButton = document.querySelector('#registerForm button[type="button"]');
            const originalText = registerButton.innerHTML;
            registerButton.innerHTML = 'Creating account...';
            registerButton.disabled = true;
            
            // Create a new user with Firebase Auth
            firebase.auth().createUserWithEmailAndPassword(email, password)
              .then((userCredential) => {
                // User account created successfully
                const user = userCredential.user;
                console.log('User registered successfully:', user.email);
                
                // Set the display name
                return user.updateProfile({
                  displayName: username
                }).then(() => {
                  // Reset button
                  registerButton.innerHTML = originalText;
                  registerButton.disabled = false;
                  
                  // Show success message
                  showSuccess('Account created successfully! Welcome ' + username + '!');
                  
                  // Close modal
                  closeModal('registerModal');
                });
              })
              .catch((error) => {
                // Reset button
                registerButton.innerHTML = originalText;
                registerButton.disabled = false;
                
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error('Registration error:', errorCode, errorMessage);
                
                // Show appropriate error message
                if (errorCode === 'auth/email-already-in-use') {
                  showFormError('registerForm', 'This email address is already in use. Please try another one.');
                } else if (errorCode === 'auth/invalid-email') {
                  showFormError('registerForm', 'Please enter a valid email address.');
                } else if (errorCode === 'auth/weak-password') {
                  showFormError('registerForm', 'Please choose a stronger password.');
                } else {
                  showFormError('registerForm', 'Registration failed: ' + errorMessage);
                }
              });
          } catch (error) {
            console.error('Registration error:', error);
            showFormError('registerForm', 'An unexpected error occurred. Please try again.');
          }
        }
        
        // Check if user is already signed in
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in
            console.log('User is already signed in:', user.displayName || user.email);
            showSuccess('Welcome back ' + (user.displayName || user.email) + '!');
          } else {
            // No user is signed in
            console.log('No user is signed in');
          }
        });
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