// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Export other Firebase Auth functions you'll use
export { RecaptchaVerifier, signInWithPhoneNumber };

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

let recaptchaVerifier = null;
let confirmationResult = null;
let isPhoneNumberStage = false; // Flag to track if we're in the phone number entry stage

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
      console.log('Test users already exist or seeding failed:', data.message);
    }
  } catch (err) {
    console.error('Error seeding test users:', err);
  }
};

// Seed test users when page loads
seedTestUsers();

const generateRecaptcha = () => {
  recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
  });
};

const response = await fetch(
  'https://mo-money-sal2.onrender.com/api/users/login',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, pin }),
    credentials: 'omit', // Try omitting credentials
  }
);

// Event Handlers
async function handleLogin(e) {
  e.preventDefault();

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
        if (loginForm && loginForm.querySelector('button[type="submit"]')) {
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

// Modify the verifyCodeBtn event listener
if (verifyCodeBtn) {
  verifyCodeBtn.addEventListener('click', async () => {
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

      if (tokenResponse.ok && tokenData.token && tokenData.user) {
        // Clean up temporary storage
        localStorage.removeItem('tempToken');
        localStorage.removeItem('userId');

        // Store the final auth data
        localStorage.setItem('token', tokenData.token);
        localStorage.setItem('userData', JSON.stringify(tokenData.user));

        // Redirect to dashboard
        window.location.href = 'https://mo-money-sal2.onrender.com/dashboard';
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
          'Invalid verification code or session expired. Please try again.';
      }
    }
  });
}

if (sendCodeBtn) {
  sendCodeBtn.addEventListener('click', async () => {
    const phoneNumber = phoneNumberInput.value;

    if (!phoneNumber) {
      if (phoneErrorElement) {
        phoneErrorElement.textContent = 'Please enter your phone number.';
      }
      return;
    }
    if (phoneErrorElement) {
      phoneErrorElement.textContent = '';
    }

    generateRecaptcha();

    try {
      const appVerifier = recaptchaVerifier;
      confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );
      window.confirmationResult = confirmationResult;
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
          'Failed to send verification code. Please try again.';
      }
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    }
  });
}

if (verifyCodeBtn) {
  verifyCodeBtn.addEventListener('click', async () => {
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
      const userCredential = await window.confirmationResult.confirm(
        verificationCode
      );
      const user = userCredential.user;
      console.log('Phone number verified!', user.uid);

      // --- Final login after OTP verification ---
      // You would typically send the Firebase UID to your backend
      // to finalize the login process, ensuring the username/PIN was also correct.
      const tokenResponse = await fetch('/api/login-final', {
        // Example backend endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: user.uid }), // Or however you identify the user session
      });
      const tokenData = await tokenResponse.json();

      if (
        tokenResponse.ok &&
        tokenData.success &&
        tokenData.token &&
        tokenData.user
      ) {
        localStorage.setItem('token', tokenData.token);
        localStorage.setItem('userData', JSON.stringify(tokenData.user));
        window.location.href = 'https://mo-money-sal2.onrender.com/dashboard'; // Redirect on successful 2FA login
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
          'Invalid verification code. Please try again.';
      }
    }
  });
}

// Initially hide phone number and verification sections
if (phoneNumberInput && sendCodeBtn && verificationSection) {
  phoneNumberInput.style.display = 'none';
  sendCodeBtn.style.display = 'none';
  verificationSection.style.display = 'none';
}

// Add event listener to login form for initial username/PIN login
if (loginForm) {
  loginForm.addEventListener('submit', handleLogin);
}
