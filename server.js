const express = require('express');
const path = require('path');
const cors = require('cors');
const firebase = require('firebase/app');
require('firebase/auth');

// Initialize express app and create HTTP server
const app = express();
const port = process.env.PORT || 5000;
const server = require('http').createServer(app);

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
        
        // Use the showModal function already defined above
        
        // Google Sign-In function
        function signInWithGoogle() {
          clearFormError('loginForm');
          clearFormError('registerForm');
          
          const googleProvider = new firebase.auth.GoogleAuthProvider();
          
          showFormError('loginForm', 'To enable Google Sign-in, please add your Replit domain to Firebase authorized domains list in the Firebase Console under Authentication → Settings → Authorized domains');
          
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
              
              if (errorCode === 'auth/configuration-not-found') {
                showFormError('loginForm', 'Please add your Replit domain to Firebase authorized domains list in the Firebase Console under Authentication → Settings → Authorized domains');
              } else {
                showFormError('loginForm', 'Failed to sign in with Google: ' + errorMessage);
              }
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
            
            // Show the required steps to make authentication work
            showFormError('loginForm', 'To enable login, please add your Replit domain to Firebase authorized domains list in the Firebase Console under Authentication → Settings → Authorized domains');
            
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
                
                // Briefly show success message before redirect
                setTimeout(() => {
                  redirectToDashboard();
                }, 1500);
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
            
            // Show the required steps to make authentication work
            showFormError('registerForm', 'To enable registration, please add your Replit domain to Firebase authorized domains list in the Firebase Console under Authentication → Settings → Authorized domains');
            
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
                  
                  // Close modal and redirect to dashboard
                  closeModal('registerModal');
                  
                  // Briefly show success message before redirect
                  setTimeout(() => {
                    redirectToDashboard();
                  }, 1500);
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
        
        // Function to redirect to dashboard
        function redirectToDashboard() {
          window.location.href = '/dashboard';
        }
        
        // Check if user is already signed in
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in
            console.log('User is already signed in:', user.displayName || user.email);
            showSuccess('Welcome back ' + (user.displayName || user.email) + '!');
            
            // If on the landing page, redirect to dashboard after a brief delay
            if (window.location.pathname === '/') {
              setTimeout(() => {
                redirectToDashboard();
              }, 1500);
            }
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

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MindArena Dashboard</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
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
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
        .logout-button {
          background-color: transparent;
          border: 2px solid #6C5CE7;
          color: #6C5CE7;
        }
        .logout-button:hover {
          background-color: rgba(108, 92, 231, 0.1);
        }
        #userDisplay {
          font-weight: bold;
          color: #6C5CE7;
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
    </div>
      
      <script>
        // Initialize Firebase
        const firebaseConfig = {
          apiKey: process.env.VITE_FIREBASE_API_KEY,
          authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
          appId: "${process.env.VITE_FIREBASE_APP_ID}"
        };
        
        firebase.initializeApp(firebaseConfig);
        
        // Check if user is logged in, if not redirect to home page
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            // User is signed in
            console.log('Dashboard: User is signed in:', user.displayName || user.email);
            updateUserInterface(user);
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
        
        // WebSocket connection and game logic
        let socket;
        let gameData = {
          gameId: null,
          opponent: null,
          currentQuestion: null,
          myScore: 0,
          opponentScore: 0,
          questionStartTime: null,
          questionTimer: null,
          gameState: 'idle' // idle, searching, waiting, playing, finished
        };
        
        // Connect to WebSocket server
        function connectWebSocket() {
          if (socket && socket.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
          }
          
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//${window.location.host}/ws`;
          
          socket = new WebSocket(wsUrl);
          
          socket.onopen = function() {
            console.log('WebSocket connection established');
            
            // Send authentication once WebSocket is open
            const user = firebase.auth().currentUser;
            if (user) {
              authenticateWebSocket(user);
            }
          };
          
          socket.onmessage = function(event) {
            const message = JSON.parse(event.data);
            console.log('Received WebSocket message:', message);
            
            switch (message.type) {
              case 'welcome':
                console.log('Connected to game server:', message.connectionId);
                break;
                
              case 'authSuccess':
                console.log('WebSocket authentication successful');
                break;
                
              case 'waitingForOpponent':
                updateMatchmakingStatus('Searching for an opponent...');
                break;
                
              case 'gameCreated':
                gameData.gameId = message.gameId;
                gameData.opponent = message.opponent;
                gameData.gameState = 'waiting';
                updateMatchmakingStatus(`Match found! Playing against ${message.opponent.displayName}`);
                showGamePreparation(message.opponent.displayName);
                break;
                
              case 'gameStart':
                gameData.gameState = 'playing';
                showGameInterface();
                break;
                
              case 'question':
                showQuestion(message);
                break;
                
              case 'answerFeedback':
                showAnswerFeedback(message);
                break;
                
              case 'revealAnswer':
                highlightCorrectAnswer(message.correctAnswer);
                updateScores(message.scores);
                break;
                
              case 'gameEnd':
                endGame(message);
                break;
                
              case 'error':
                console.error('Game error:', message.message);
                showGameError(message.message);
                break;
            }
          };
          
          socket.onclose = function() {
            console.log('WebSocket connection closed');
            setTimeout(() => {
              if (gameData.gameState === 'playing') {
                showGameError('Connection lost. The game has ended.');
                resetGame();
              }
            }, 1000);
          };
          
          socket.onerror = function(error) {
            console.error('WebSocket error:', error);
            showGameError('Connection error. Please try again later.');
          };
        }
        
        // Authenticate with the WebSocket server
        function authenticateWebSocket(user) {
          if (!socket || socket.readyState !== WebSocket.OPEN) return;
          
          socket.send(JSON.stringify({
            type: 'auth',
            userId: user.uid,
            displayName: user.displayName || user.email
          }));
        }
        
        // Start a quick match
        function startQuickMatch() {
          const user = firebase.auth().currentUser;
          if (!user) {
            alert('You must be logged in to play a match.');
            return;
          }
          
          // Connect to WebSocket if not already connected
          if (!socket || socket.readyState !== WebSocket.OPEN) {
            connectWebSocket();
            setTimeout(() => findMatch(user), 1000); // Wait for connection to establish
          } else {
            findMatch(user);
          }
        }
        
        // Find a match
        function findMatch(user) {
          gameData.gameState = 'searching';
          
          // Hide main content and show game area
          document.getElementById('mainContent').style.display = 'none';
          
          // Create and show matchmaking UI if it doesn't exist
          let gameArea = document.getElementById('gameArea');
          if (!gameArea) {
            gameArea = document.createElement('div');
            gameArea.id = 'gameArea';
            gameArea.className = 'game-area';
            document.querySelector('.content').appendChild(gameArea);
            
            // Apply styles
            gameArea.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            gameArea.style.backdropFilter = 'blur(10px)';
            gameArea.style.borderRadius = '20px';
            gameArea.style.padding = '30px';
            gameArea.style.maxWidth = '800px';
            gameArea.style.margin = '0 auto 30px';
            gameArea.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
          }
          
          // Update game area with matchmaking UI
          gameArea.innerHTML = `
            <div class="game-header">
              <h2>Quick Match</h2>
              <div id="matchStatus">Looking for an opponent...</div>
            </div>
            <div class="matchmaking-animation">
              <div class="pulse"></div>
            </div>
            <div class="matchmaking-controls">
              <button id="cancelMatchButton" class="button outline" onclick="cancelMatchmaking()">Cancel</button>
            </div>
            <style>
              .game-header {
                text-align: center;
                margin-bottom: 25px;
              }
              #matchStatus {
                color: #B2BEC3;
                margin-top: 10px;
              }
              .matchmaking-animation {
                display: flex;
                justify-content: center;
                margin: 40px 0;
              }
              .pulse {
                width: 80px;
                height: 80px;
                background-color: rgba(108, 92, 231, 0.3);
                border-radius: 50%;
                position: relative;
                animation: pulse 1.5s ease-in-out infinite;
              }
              .pulse:before, .pulse:after {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                background-color: rgba(108, 92, 231, 0.3);
                border-radius: 50%;
                z-index: -1;
              }
              .pulse:before {
                animation: pulse 1.5s ease-in-out 0.5s infinite;
              }
              .pulse:after {
                animation: pulse 1.5s ease-in-out 1s infinite;
              }
              @keyframes pulse {
                0% {
                  transform: scale(0.5);
                  opacity: 0.5;
                }
                50% {
                  transform: scale(1.2);
                  opacity: 0;
                }
                100% {
                  transform: scale(0.5);
                  opacity: 0;
                }
              }
              .matchmaking-controls {
                text-align: center;
              }
              
              /* Game interface styles */
              .game-interface {
                display: none;
              }
              .opponent-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding: 15px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
              }
              .player-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: #6C5CE7;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                margin-right: 10px;
              }
              .player-info {
                display: flex;
                align-items: center;
              }
              .scores {
                display: flex;
                align-items: center;
                font-size: 24px;
                font-weight: bold;
              }
              .score-divider {
                margin: 0 10px;
                color: #B2BEC3;
              }
              .question-container {
                margin-top: 30px;
                margin-bottom: 20px;
              }
              .question-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
              }
              .question-counter {
                font-size: 16px;
                color: #B2BEC3;
              }
              .timer {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: rgba(108, 92, 231, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: bold;
                color: white;
              }
              .question-text {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 30px;
                line-height: 1.4;
              }
              .options-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
              }
              .option {
                background-color: rgba(255, 255, 255, 0.1);
                padding: 15px;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 2px solid transparent;
              }
              .option:hover {
                background-color: rgba(255, 255, 255, 0.15);
                transform: translateY(-2px);
              }
              .option.selected {
                border-color: #6C5CE7;
                background-color: rgba(108, 92, 231, 0.2);
              }
              .option.correct {
                border-color: #2ecc71;
                background-color: rgba(46, 204, 113, 0.2);
              }
              .option.incorrect {
                border-color: #e74c3c;
                background-color: rgba(231, 76, 60, 0.2);
              }
              .game-results {
                text-align: center;
                padding: 30px;
              }
              .result-title {
                font-size: 36px;
                font-weight: bold;
                margin-bottom: 20px;
              }
              .result-stats {
                margin: 30px 0;
                display: flex;
                justify-content: center;
                gap: 30px;
              }
              .stat-item {
                background-color: rgba(255, 255, 255, 0.1);
                padding: 15px 25px;
                border-radius: 10px;
                text-align: center;
              }
              .stat-value {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .stat-label {
                font-size: 14px;
                color: #B2BEC3;
              }
              .game-preparation {
                text-align: center;
                padding: 30px;
              }
              .vs-container {
                display: flex;
                justify-content: space-around;
                align-items: center;
                margin: 30px 0;
              }
              .player-card {
                background-color: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 15px;
                width: 40%;
                text-align: center;
              }
              .large-avatar {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background-color: #6C5CE7;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 30px;
                color: white;
                margin: 0 auto 15px;
              }
              .player-name {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .player-status {
                font-size: 14px;
                color: #B2BEC3;
              }
              .vs-text {
                font-size: 24px;
                font-weight: bold;
                color: #6C5CE7;
              }
              .countdown {
                font-size: 36px;
                font-weight: bold;
                margin-top: 20px;
              }
            </style>
          `;
          
          // Send matchmaking request
          socket.send(JSON.stringify({
            type: 'findMatch',
            userId: user.uid
          }));
        }
        
        // Cancel matchmaking
        function cancelMatchmaking() {
          if (gameData.gameState === 'searching') {
            socket.send(JSON.stringify({
              type: 'cancelMatchmaking',
              userId: firebase.auth().currentUser.uid
            }));
            
            resetGame();
          }
        }
        
        // Update matchmaking status
        function updateMatchmakingStatus(status) {
          const statusElement = document.getElementById('matchStatus');
          if (statusElement) {
            statusElement.textContent = status;
          }
        }
        
        // Show game preparation screen with countdown
        function showGamePreparation(opponentName) {
          const user = firebase.auth().currentUser;
          const displayName = user.displayName || user.email || 'You';
          
          const gameArea = document.getElementById('gameArea');
          gameArea.innerHTML = `
            <div class="game-preparation">
              <h2>Match Starting</h2>
              <div class="vs-container">
                <div class="player-card">
                  <div class="large-avatar">${displayName.charAt(0).toUpperCase()}</div>
                  <div class="player-name">${displayName}</div>
                  <div class="player-status">Ready</div>
                </div>
                <div class="vs-text">VS</div>
                <div class="player-card">
                  <div class="large-avatar">${opponentName.charAt(0).toUpperCase()}</div>
                  <div class="player-name">${opponentName}</div>
                  <div class="player-status">Ready</div>
                </div>
              </div>
              <div class="countdown">3</div>
            </div>
          `;
          
          // Countdown animation
          let count = 3;
          const countdownElement = document.querySelector('.countdown');
          const countdownInterval = setInterval(() => {
            count--;
            countdownElement.textContent = count > 0 ? count.toString() : 'Go!';
            
            if (count < 0) {
              clearInterval(countdownInterval);
            }
          }, 1000);
        }
        
        // Show the game interface
        function showGameInterface() {
          const user = firebase.auth().currentUser;
          const myName = user.displayName || user.email || 'You';
          const opponentName = gameData.opponent ? gameData.opponent.displayName : 'Opponent';
          
          const gameArea = document.getElementById('gameArea');
          gameArea.innerHTML = `
            <div class="game-interface" id="gameInterface">
              <div class="opponent-info">
                <div class="player-info">
                  <div class="player-avatar">${myName.charAt(0).toUpperCase()}</div>
                  <div class="player-name">${myName}</div>
                </div>
                <div class="scores">
                  <span id="myScore">0</span>
                  <span class="score-divider">-</span>
                  <span id="opponentScore">0</span>
                </div>
                <div class="player-info">
                  <div class="player-name">${opponentName}</div>
                  <div class="player-avatar">${opponentName.charAt(0).toUpperCase()}</div>
                </div>
              </div>
              <div class="question-container" id="questionContainer">
                <div class="question-header">
                  <div class="question-counter" id="questionCounter">Question 1/5</div>
                  <div class="timer" id="questionTimer">10</div>
                </div>
                <div class="question-text" id="questionText">Waiting for question...</div>
                <div class="options-container" id="optionsContainer">
                  <!-- Options will be added dynamically -->
                </div>
              </div>
            </div>
          `;
          
          document.getElementById('gameInterface').style.display = 'block';
        }
        
        // Show a question
        function showQuestion(questionData) {
          gameData.currentQuestion = questionData;
          gameData.questionStartTime = Date.now();
          
          const questionCounter = document.getElementById('questionCounter');
          const questionText = document.getElementById('questionText');
          const optionsContainer = document.getElementById('optionsContainer');
          const timerElement = document.getElementById('questionTimer');
          
          if (questionCounter) {
            questionCounter.textContent = `Question ${questionData.questionNumber}/${questionData.totalQuestions}`;
          }
          
          if (questionText) {
            questionText.textContent = questionData.question;
          }
          
          if (optionsContainer) {
            optionsContainer.innerHTML = '';
            questionData.options.forEach((option, index) => {
              const optionElement = document.createElement('div');
              optionElement.className = 'option';
              optionElement.textContent = option;
              optionElement.onclick = () => selectAnswer(index);
              optionsContainer.appendChild(optionElement);
            });
          }
          
          // Start the timer
          if (timerElement) {
            let timeLeft = questionData.timeLimit;
            timerElement.textContent = timeLeft;
            
            // Clear any existing timer
            if (gameData.questionTimer) {
              clearInterval(gameData.questionTimer);
            }
            
            // Set up the new timer
            gameData.questionTimer = setInterval(() => {
              timeLeft--;
              timerElement.textContent = timeLeft;
              
              // Visual indicator as time runs low
              if (timeLeft <= 3) {
                timerElement.style.backgroundColor = 'rgba(231, 76, 60, 0.5)';
              }
              
              if (timeLeft <= 0) {
                clearInterval(gameData.questionTimer);
                // Time's up - if no answer selected, treat as timeout
                const selectedOption = document.querySelector('.option.selected');
                if (!selectedOption) {
                  // Automatically submit timeout (no answer)
                  submitAnswer(null);
                }
              }
            }, 1000);
          }
        }
        
        // Select an answer
        function selectAnswer(index) {
          // Only allow selection if not already answered
          if (document.querySelector('.option.correct') || document.querySelector('.option.incorrect')) {
            return;
          }
          
          const options = document.querySelectorAll('.option');
          options.forEach(option => option.classList.remove('selected'));
          
          if (index !== null && options[index]) {
            options[index].classList.add('selected');
          }
          
          // Submit the answer with a slight delay for better UX
          setTimeout(() => {
            submitAnswer(index);
          }, 300);
        }
        
        // Submit an answer to the server
        function submitAnswer(answerIndex) {
          // Clear timer
          if (gameData.questionTimer) {
            clearInterval(gameData.questionTimer);
            gameData.questionTimer = null;
          }
          
          // Calculate time elapsed
          const timeElapsed = (Date.now() - gameData.questionStartTime) / 1000;
          
          // Send answer to server
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'answer',
              gameId: gameData.gameId,
              userId: firebase.auth().currentUser.uid,
              answerIndex: answerIndex,
              timeElapsed: timeElapsed
            }));
          }
        }
        
        // Show feedback for an answer
        function showAnswerFeedback(feedback) {
          const myScoreElement = document.getElementById('myScore');
          if (myScoreElement) {
            myScoreElement.textContent = feedback.totalScore;
            gameData.myScore = feedback.totalScore;
          }
          
          // Show visual feedback (handled by highlightCorrectAnswer)
        }
        
        // Highlight the correct answer
        function highlightCorrectAnswer(correctIndex) {
          const options = document.querySelectorAll('.option');
          const selectedOption = document.querySelector('.option.selected');
          
          if (selectedOption) {
            const selectedIndex = Array.from(options).indexOf(selectedOption);
            
            if (selectedIndex === correctIndex) {
              selectedOption.classList.add('correct');
            } else {
              selectedOption.classList.add('incorrect');
              if (options[correctIndex]) {
                options[correctIndex].classList.add('correct');
              }
            }
          } else {
            // No answer was selected
            if (options[correctIndex]) {
              options[correctIndex].classList.add('correct');
            }
          }
        }
        
        // Update scores display
        function updateScores(scores) {
          const myScoreElement = document.getElementById('myScore');
          const opponentScoreElement = document.getElementById('opponentScore');
          
          if (myScoreElement && opponentScoreElement) {
            // Get current user ID
            const myUserId = firebase.auth().currentUser.uid;
            
            // Get opponent user ID
            const opponentUserId = gameData.opponent ? gameData.opponent.userId : null;
            
            if (myUserId && opponentUserId) {
              const myScore = scores[myUserId] || 0;
              const opponentScore = scores[opponentUserId] || 0;
              
              myScoreElement.textContent = myScore;
              opponentScoreElement.textContent = opponentScore;
              
              gameData.myScore = myScore;
              gameData.opponentScore = opponentScore;
            }
          }
        }
        
        // End the game and show results
        function endGame(results) {
          const user = firebase.auth().currentUser;
          const myUserId = user.uid;
          const opponentUserId = gameData.opponent ? gameData.opponent.userId : null;
          
          let resultMessage = '';
          let resultClass = '';
          
          if (results.isDraw) {
            resultMessage = "It's a Draw!";
            resultClass = 'draw';
          } else if (results.winner === myUserId) {
            resultMessage = 'Victory!';
            resultClass = 'victory';
          } else {
            resultMessage = 'Defeat';
            resultClass = 'defeat';
          }
          
          const gameArea = document.getElementById('gameArea');
          gameArea.innerHTML = `
            <div class="game-results">
              <div class="result-title ${resultClass}">${resultMessage}</div>
              <div class="final-score">
                <div class="scores">
                  <span>${gameData.myScore}</span>
                  <span class="score-divider">-</span>
                  <span>${gameData.opponentScore}</span>
                </div>
              </div>
              <div class="result-stats">
                <div class="stat-item">
                  <div class="stat-value">${results.gameStats.questions}</div>
                  <div class="stat-label">Questions</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${results.gameStats.duration}s</div>
                  <div class="stat-label">Duration</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${gameData.myScore}</div>
                  <div class="stat-label">Points Earned</div>
                </div>
              </div>
              <button class="button" onclick="playAgain()">Play Again</button>
              <button class="button outline" onclick="returnToDashboard()">Back to Dashboard</button>
            </div>
            <style>
              .victory {
                color: #2ecc71;
              }
              .defeat {
                color: #e74c3c;
              }
              .draw {
                color: #f39c12;
              }
              .final-score {
                font-size: 36px;
                font-weight: bold;
                margin: 20px 0;
              }
            </style>
          `;
          
          // Reset game state
          gameData.gameState = 'finished';
        }
        
        // Play another game
        function playAgain() {
          resetGame();
          setTimeout(() => startQuickMatch(), 500);
        }
        
        // Return to dashboard
        function returnToDashboard() {
          resetGame();
        }
        
        // Reset the game state
        function resetGame() {
          // Reset game data
          gameData = {
            gameId: null,
            opponent: null,
            currentQuestion: null,
            myScore: 0,
            opponentScore: 0,
            questionStartTime: null,
            questionTimer: null,
            gameState: 'idle'
          };
          
          // Clear any running timers
          if (gameData.questionTimer) {
            clearInterval(gameData.questionTimer);
            gameData.questionTimer = null;
          }
          
          // Hide game area and show main content
          const gameArea = document.getElementById('gameArea');
          if (gameArea) {
            gameArea.innerHTML = '';
          }
          
          const mainContent = document.getElementById('mainContent');
          if (mainContent) {
            mainContent.style.display = 'block';
          }
        }
        
        // Show game error
        function showGameError(message) {
          const gameArea = document.getElementById('gameArea');
          if (gameArea) {
            gameArea.innerHTML = `
              <div class="game-error">
                <div class="error-icon">❌</div>
                <div class="error-message">${message}</div>
                <button class="button" onclick="returnToDashboard()">Return to Dashboard</button>
              </div>
              <style>
                .game-error {
                  text-align: center;
                  padding: 40px 20px;
                }
                .error-icon {
                  font-size: 48px;
                  margin-bottom: 20px;
                }
                .error-message {
                  font-size: 20px;
                  color: #e74c3c;
                  margin-bottom: 30px;
                }
              </style>
            `;
          }
        }
        
        // Initialize WebSocket when user is authenticated
        firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            connectWebSocket();
          }
        });
        
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
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server, path: '/ws' });

// Game and Player Management
const activeGames = new Map(); // gameId -> game object
const waitingPlayers = []; // Queue of players waiting for a match
const connectedPlayers = new Map(); // userId -> WebSocket connection

// Quiz Questions Database
const quizQuestions = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    category: "Geography",
    difficulty: "easy",
    timeLimit: 10 // Seconds
  },
  {
    id: 2,
    question: "Which element has the chemical symbol 'O'?",
    options: ["Gold", "Oxygen", "Iron", "Carbon"],
    correctAnswer: 1,
    category: "Science",
    difficulty: "easy",
    timeLimit: 10
  },
  {
    id: 3,
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: 2,
    category: "Art",
    difficulty: "easy",
    timeLimit: 10
  },
  {
    id: 4,
    question: "What is the largest planet in our Solar System?",
    options: ["Earth", "Jupiter", "Saturn", "Mars"],
    correctAnswer: 1,
    category: "Science",
    difficulty: "easy",
    timeLimit: 10
  },
  {
    id: 5,
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2,
    category: "History",
    difficulty: "easy",
    timeLimit: 10
  }
];

// Get random questions for a game
function getRandomQuestions(count = 5, category = null) {
  let filteredQuestions = [...quizQuestions];
  
  if (category) {
    filteredQuestions = filteredQuestions.filter(q => q.category === category);
  }
  
  // Shuffle and get random questions
  const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Game Session class
class GameSession {
  constructor(player1, player2, gameId) {
    this.gameId = gameId;
    this.players = [player1, player2];
    this.playerScores = { [player1.userId]: 0, [player2.userId]: 0 };
    this.playerAnswers = { [player1.userId]: [], [player2.userId]: [] };
    this.questions = getRandomQuestions(5);
    this.currentQuestionIndex = 0;
    this.gameState = 'waiting'; // waiting, started, finished
    this.startTime = null;
    this.timePerQuestion = 10; // seconds
    this.timers = [];
  }

  // Start a game
  start() {
    this.gameState = 'started';
    this.startTime = Date.now();
    this.sendToAllPlayers({
      type: 'gameStart',
      gameId: this.gameId,
      totalQuestions: this.questions.length
    });
    this.sendNextQuestion();
  }

  // Send the next question to players
  sendNextQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    this.sendToAllPlayers({
      type: 'question',
      questionNumber: this.currentQuestionIndex + 1,
      totalQuestions: this.questions.length,
      question: question.question,
      options: question.options,
      timeLimit: question.timeLimit
    });

    // Create a timer to move to the next question
    const timer = setTimeout(() => {
      this.currentQuestionIndex++;
      this.sendNextQuestion();
    }, question.timeLimit * 1000);

    this.timers.push(timer);
  }

  // Process a player's answer
  processAnswer(userId, answerIndex, timeElapsed) {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    let points = 0;
    let isCorrect = false;

    // Check if answer is correct
    if (answerIndex === currentQuestion.correctAnswer) {
      // Award points based on speed - faster answer = more points
      const timeBonus = Math.max(0, currentQuestion.timeLimit - timeElapsed);
      points = 100 + Math.floor(timeBonus * 10); // Base 100 + time bonus
      isCorrect = true;
    }

    // Save answer info
    this.playerAnswers[userId].push({
      questionIndex: this.currentQuestionIndex,
      answerIndex: answerIndex,
      isCorrect: isCorrect,
      timeElapsed: timeElapsed,
      points: points
    });

    // Update player score
    this.playerScores[userId] += points;

    // Send answer feedback to the player
    const player = this.players.find(p => p.userId === userId);
    if (player && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({
        type: 'answerFeedback',
        isCorrect: isCorrect,
        points: points,
        totalScore: this.playerScores[userId]
      }));
    }

    // Check if all players have answered
    const allAnswered = this.players.every(player => 
      this.playerAnswers[player.userId].length > this.currentQuestionIndex
    );

    // If all players have answered, move to the next question
    if (allAnswered) {
      // Clear the current question timer
      if (this.timers.length > 0) {
        clearTimeout(this.timers.pop());
      }
      
      // Show correct answer to all players
      this.sendToAllPlayers({
        type: 'revealAnswer',
        correctAnswer: currentQuestion.correctAnswer,
        scores: this.playerScores
      });
      
      // Delay before moving to the next question
      setTimeout(() => {
        this.currentQuestionIndex++;
        this.sendNextQuestion();
      }, 2000); // 2 second delay before next question
    }
  }

  // End the game
  endGame() {
    this.gameState = 'finished';
    
    // Clear any remaining timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
    
    // Find the winner
    let winnerUserId = null;
    let highestScore = -1;
    let isDraw = false;
    
    for (const [userId, score] of Object.entries(this.playerScores)) {
      if (score > highestScore) {
        highestScore = score;
        winnerUserId = userId;
        isDraw = false;
      } else if (score === highestScore) {
        isDraw = true;
      }
    }
    
    // Send game results to all players
    this.sendToAllPlayers({
      type: 'gameEnd',
      scores: this.playerScores,
      winner: isDraw ? null : winnerUserId,
      isDraw: isDraw,
      gameStats: {
        duration: Math.floor((Date.now() - this.startTime) / 1000),
        questions: this.questions.length,
        playerAnswers: this.playerAnswers
      }
    });
    
    // Remove game from active games
    activeGames.delete(this.gameId);
    
    // Disconnect players from this game
    this.players.forEach(player => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.game = null;
      }
    });
  }
  
  // Send a message to all players in the game
  sendToAllPlayers(message) {
    this.players.forEach(player => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message));
      }
    });
  }
  
  // Remove a player from the game
  removePlayer(userId) {
    // If the game is still in progress, end it with the other player as winner
    if (this.gameState === 'started') {
      const remainingPlayer = this.players.find(p => p.userId !== userId);
      if (remainingPlayer) {
        this.sendToAllPlayers({
          type: 'playerLeft',
          userId: userId,
          winner: remainingPlayer.userId
        });
        
        // Update scores to ensure the remaining player wins
        this.playerScores[remainingPlayer.userId] = 999;
        this.endGame();
      }
    }
  }
}

// Create a new game with two players
function createGame(player1, player2) {
  const gameId = 'game_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  
  // Set up player objects with WS connections
  const gamePlayerObj1 = {
    userId: player1.userId,
    displayName: player1.displayName,
    ws: player1.ws,
    game: null
  };
  
  const gamePlayerObj2 = {
    userId: player2.userId,
    displayName: player2.displayName,
    ws: player2.ws,
    game: null
  };
  
  // Create game session
  const game = new GameSession(gamePlayerObj1, gamePlayerObj2, gameId);
  
  // Link players to the game
  gamePlayerObj1.game = game;
  gamePlayerObj2.game = game;
  
  // Add to active games
  activeGames.set(gameId, game);
  
  // Notify both players about the match
  [gamePlayerObj1, gamePlayerObj2].forEach(player => {
    const opponent = player === gamePlayerObj1 ? gamePlayerObj2 : gamePlayerObj1;
    player.ws.send(JSON.stringify({
      type: 'gameCreated',
      gameId: gameId,
      opponent: {
        userId: opponent.userId,
        displayName: opponent.displayName
      }
    }));
  });
  
  // Start the game after a brief delay
  setTimeout(() => {
    game.start();
  }, 3000);
  
  return game;
}

// Match a player with an opponent or add to waiting queue
function matchPlayer(player) {
  if (waitingPlayers.length > 0) {
    // Get opponent from waiting queue
    const opponent = waitingPlayers.shift();
    createGame(player, opponent);
  } else {
    // No opponent available - add to waiting queue
    waitingPlayers.push(player);
    player.ws.send(JSON.stringify({
      type: 'waitingForOpponent'
    }));
  }
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  // Setup initial state for the connection
  const connectionId = Date.now() + '_' + Math.floor(Math.random() * 1000);
  ws.id = connectionId;
  ws.isAlive = true;
  
  // Handle ping/pong for keeping connection alive
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data.type);
      
      switch (data.type) {
        case 'auth':
          // Authenticate user and store connection
          const userId = data.userId;
          const displayName = data.displayName || 'Player';
          
          const player = {
            userId,
            displayName,
            ws,
            status: 'online',
            lastActive: Date.now()
          };
          
          connectedPlayers.set(userId, player);
          
          ws.send(JSON.stringify({
            type: 'authSuccess',
            message: 'Authentication successful'
          }));
          break;
          
        case 'findMatch':
          // Find a match for the player
          if (!data.userId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Authentication required to find a match'
            }));
            return;
          }
          
          const searchingPlayer = connectedPlayers.get(data.userId);
          if (!searchingPlayer) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Player not found'
            }));
            return;
          }
          
          matchPlayer(searchingPlayer);
          break;
          
        case 'answer':
          // Process player's answer
          if (!data.gameId || !data.userId || data.answerIndex === undefined) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid answer data'
            }));
            return;
          }
          
          const game = activeGames.get(data.gameId);
          if (!game || game.gameState !== 'started') {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Game not found or not in progress'
            }));
            return;
          }
          
          game.processAnswer(data.userId, data.answerIndex, data.timeElapsed || 0);
          break;
          
        case 'cancelMatchmaking':
          // Cancel matchmaking for a waiting player
          if (!data.userId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'User ID required'
            }));
            return;
          }
          
          // Find and remove from waiting queue
          const playerIndex = waitingPlayers.findIndex(p => p.userId === data.userId);
          if (playerIndex !== -1) {
            waitingPlayers.splice(playerIndex, 1);
            ws.send(JSON.stringify({
              type: 'matchmakingCancelled'
            }));
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing message'
      }));
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    
    // Find and remove player from connected players
    for (const [userId, player] of connectedPlayers.entries()) {
      if (player.ws === ws) {
        // If player was in a game, handle the disconnect
        if (player.game) {
          player.game.removePlayer(userId);
        }
        
        // Remove from waiting queue if present
        const waitingIndex = waitingPlayers.findIndex(p => p.userId === userId);
        if (waitingIndex !== -1) {
          waitingPlayers.splice(waitingIndex, 1);
        }
        
        // Remove from connected players
        connectedPlayers.delete(userId);
        break;
      }
    }
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to MindArena WebSocket Server',
    connectionId: connectionId
  }));
});

// Heartbeat to keep connections alive and clean up dead connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

// Clean up interval on server close
wss.on('close', () => {
  clearInterval(interval);
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
  console.log(`WebSocket server running at ws://0.0.0.0:${port}/ws`);
});