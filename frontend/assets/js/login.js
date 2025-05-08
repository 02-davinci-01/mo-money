// DOM Elements
const loginForm = document.querySelector('.login__form');
const loginInputUser = document.querySelector('.login__input--user');
const loginInputPin = document.querySelector('.login__input--pin');

// Event Handlers
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const username = loginInputUser.value;
  const pin = loginInputPin.value;

  try {
    const response = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, pin })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    // Store the token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (err) {
    console.error('Error:', err);
    alert('Login failed. Please check your credentials.');
  }
}); 