// Basic debug script - this should show in console now
console.log('LOGIN.JS LOADED - BASIC DEBUG');

// Instead of importing directly from Firebase modules, we'll use the Firebase CDN
// and access Firebase through the window object

// Add event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM CONTENT LOADED');

  // DOM Elements
  const loginForm = document.querySelector('.login__form');
  const loginInputUser = document.querySelector('.login__input--user');
  const loginInputPin = document.querySelector('.login__input--pin');
  const phoneNumberInput = document.getElementById('phoneNumber');
  const sendCodeBtn = document.getElementById('sendCodeBtn');
  const recaptchaContainer = document.getElementById('recaptcha-container');
  const verificationSection = document.getElementById('verification-section');
  const verificationCodeInput = document.getElementById('verificationCode');
  const verifyCodeBtn = document.getElementById('verifyCodeBtn');
  const phoneErrorElement = document.getElementById('phoneError');
  const verificationErrorElement = document.getElementById('verificationError');
  const loginErrorElement = document.getElementById('loginError');

  console.log('DOM Elements check:', {
    loginForm: !!loginForm,
    phoneNumberInput: !!phoneNumberInput,
    sendCodeBtn: !!sendCodeBtn,
    recaptchaContainer: !!recaptchaContainer,
    verificationSection: !!verificationSection,
  });

  let recaptchaVerifier = null;
  let confirmationResult = null;
  let isPhoneNumberStage = false; // Flag to track if we're in the phone number entry stage

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: 'AIzaSyAj1M9GDhtnlAt8lrCoDhhnBada8lYjFeQ',
    authDomain: 'mo-money-e5cfd.firebaseapp.com',
    projectId: 'mo-money-e5cfd',
    storageBucket: 'mo-money-e5cfd.firebasestorage.app',
    messagingSenderId: '840504997561',
    appId: '1:840504997561:web:aa4be572bdd1b4529e8d68',
    measurementId: 'G-ZPRKC77WFM',
  };

  // Initialize Firebase - Check if Firebase is already loaded from CDN
  if (typeof firebase !== 'undefined') {
    console.log('Firebase is loaded from CDN');

    // Initialize Firebase
    try {
      // Check if Firebase is already initialized
      try {
        firebase.app();
        console.log('Firebase already initialized');
      } catch {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized');
      }

      const auth = firebase.auth();
      console.log('Firebase auth initialized');

      // Seed test users
      const seedTestUsers = async () => {
        console.log('Attempting to seed test users...');
        try {
          const response = await fetch(
            'https://mo-money-sal2.onrender.com/api/seed',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const data = await response.json();
          if (response.ok) {
            console.log('Test users seeded successfully');
          } else {
            console.log(
              'Test users already exist or seeding failed:',
              data.message
            );
          }
        } catch (err) {
          console.error('Error seeding test users:', err);
        }
      };

      // Seed test users when page loads
      seedTestUsers();

      const generateRecaptcha = () => {
        if (recaptchaVerifier) {
          recaptchaVerifier.clear();
        }

        try {
          recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
            'recaptcha-container',
            {
              size: 'invisible',
            }
          );
          console.log('reCAPTCHA generated successfully');
          return recaptchaVerifier;
        } catch (error) {
          console.error('Error generating reCAPTCHA:', error);
          return null;
        }
      };

      // Event Handlers
      async function handleLogin(e) {
        e.preventDefault();
        console.log('Login form submitted');

        if (!isPhoneNumberStage) {
          const username = document.getElementById('username').value;
          const pin = document.getElementById('pin').value;

          if (!username || !pin) {
            alert('Please enter both username and PIN');
            return;
          }

          try {
            const response = await fetch(
              'https://mo-money-sal2.onrender.com/api/users/login',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, pin }),
              }
            );

            const data = await response.json();

            if (response.ok) {
              // Store temporary token instead of the final token
              localStorage.setItem('tempToken', data.tempToken);
              localStorage.setItem('userId', data.userId);

              isPhoneNumberStage = true;
              if (phoneNumberInput && sendCodeBtn) {
                phoneNumberInput.style.display = 'block';
                sendCodeBtn.style.display = 'block';
              }
              if (
                loginForm &&
                loginForm.querySelector('button[type="submit"]')
              ) {
                loginForm.querySelector('button[type="submit"]').style.display =
                  'none';
              }
              if (loginErrorElement) {
                loginErrorElement.textContent = '';
              }
            } else {
              alert(data.message || 'Login failed');
            }
          } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
          }
        }
      }

      // Event listener for Send Code button
      if (sendCodeBtn) {
        console.log('Adding event listener to send code button');

        // First, add a simple click test to ensure the button is clickable
        sendCodeBtn.addEventListener('click', function (e) {
          console.log('SEND CODE BUTTON CLICKED - BASIC TEST');
        });

        // Then add the actual functionality
        sendCodeBtn.addEventListener('click', async e => {
          e.preventDefault(); // Prevent form submission if button is inside a form
          console.log('Send code button clicked with full functionality');

          const phoneNumber = phoneNumberInput.value;
          console.log('Phone number:', phoneNumber);

          if (!phoneNumber) {
            if (phoneErrorElement) {
              phoneErrorElement.textContent = 'Please enter your phone number.';
            }
            return;
          }
          if (phoneErrorElement) {
            phoneErrorElement.textContent = '';
          }

          // Create reCAPTCHA verifier
          const appVerifier = generateRecaptcha();
          if (!appVerifier) {
            console.error('Failed to create reCAPTCHA verifier');
            if (phoneErrorElement) {
              phoneErrorElement.textContent =
                'reCAPTCHA initialization failed. Please refresh and try again.';
            }
            return;
          }

          try {
            console.log('Sending verification code to:', phoneNumber);
            confirmationResult = await auth.signInWithPhoneNumber(
              phoneNumber,
              appVerifier
            );
            window.confirmationResult = confirmationResult;
            console.log('Verification code sent successfully');

            if (verificationSection) {
              verificationSection.style.display = 'block';
            }
            sendCodeBtn.disabled = true;
            if (phoneNumberInput) {
              phoneNumberInput.disabled = true;
            }
          } catch (error) {
            console.error('Error sending verification code:', error);
            if (phoneErrorElement) {
              phoneErrorElement.textContent =
                'Failed to send verification code: ' + error.message;
            }
            if (recaptchaVerifier) {
              recaptchaVerifier.clear();
            }
          }
        });
      } else {
        console.error('Send code button not found in the DOM');
      }

      // Event listener for Verify Code button
      if (verifyCodeBtn) {
        verifyCodeBtn.addEventListener('click', async e => {
          e.preventDefault(); // Prevent form submission if button is inside a form
          console.log('Verify code button clicked');

          const verificationCode = verificationCodeInput.value;

          if (!verificationCode) {
            if (verificationErrorElement) {
              verificationErrorElement.textContent =
                'Please enter the verification code.';
            }
            return;
          }
          if (verificationErrorElement) {
            verificationErrorElement.textContent = '';
          }

          if (!window.confirmationResult) {
            if (verificationErrorElement) {
              verificationErrorElement.textContent =
                'No verification code has been sent. Please request one.';
            }
            return;
          }

          try {
            console.log('Confirming verification code');
            const userCredential = await window.confirmationResult.confirm(
              verificationCode
            );
            const firebaseUser = userCredential.user;
            console.log('Phone number verified!', firebaseUser.uid);

            // Get the temporary token from localStorage
            const tempToken = localStorage.getItem('tempToken');
            if (!tempToken) {
              throw new Error('No temporary token found. Please login again.');
            }

            // Make the final login request with complete URL
            console.log('Making final login request');
            const tokenResponse = await fetch(
              'https://mo-money-sal2.onrender.com/api/login-final',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  tempToken: tempToken,
                  firebaseUid: firebaseUser.uid,
                }),
              }
            );

            const tokenData = await tokenResponse.json();
            console.log('Final login response:', tokenData);

            if (tokenResponse.ok && tokenData.token && tokenData.user) {
              // Clean up temporary storage
              localStorage.removeItem('tempToken');
              localStorage.removeItem('userId');

              // Store the final auth data
              localStorage.setItem('token', tokenData.token);
              localStorage.setItem('userData', JSON.stringify(tokenData.user));

              // Redirect to dashboard
              console.log('Login successful, redirecting to dashboard');
              window.location.href =
                'https://mo-money-sal2.onrender.com/dashboard';
            } else {
              if (loginErrorElement) {
                loginErrorElement.textContent =
                  tokenData.message || 'Final login failed.';
              }
            }
          } catch (error) {
            console.error('Error verifying code:', error);
            if (verificationErrorElement) {
              verificationErrorElement.textContent =
                'Invalid verification code or session expired: ' +
                error.message;
            }
          }
        });
      } else {
        console.error('Verify code button not found in the DOM');
      }

      // Initially hide phone number and verification sections
      if (phoneNumberInput && sendCodeBtn && verificationSection) {
        phoneNumberInput.style.display = 'none';
        sendCodeBtn.style.display = 'none';
        verificationSection.style.display = 'none';
      }

      // Add event listener to login form for initial username/PIN login
      if (loginForm) {
        console.log('Adding event listener to login form');
        loginForm.addEventListener('submit', handleLogin);
      } else {
        console.error('Login form not found in the DOM');
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  } else {
    console.error(
      'Firebase is not loaded! Make sure you have included the Firebase SDK in your HTML.'
    );
    alert(
      'Firebase SDK is not loaded. Check your HTML for Firebase script tags.'
    );
  }
});

console.log('END OF SCRIPT REACHED');
