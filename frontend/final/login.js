// DOM Elements
const loginForm = document.querySelector('.login__form');
const loginInputUser = document.querySelector('.login__input--user');
const loginInputPin = document.querySelector('.login__input--pin');

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
// seedTestUsers();

// Event Handlers
async function handleLogin(e) {
  e.preventDefault();

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
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));

      // Redirect to dashboard
      window.location.href = 'https://mo-money-sal2.onrender.com/dashboard'; // Updated for Render
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed. Please try again.');
  }
}

// Add event listener to login form
document.querySelector('.login__form').addEventListener('submit', handleLogin);
