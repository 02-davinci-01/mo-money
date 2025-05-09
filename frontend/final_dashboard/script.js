// Start the app when DOM is loaded
'use strict';

/////////////////////////////////////////////////
// Elements
const btnTransaction = document.querySelector('.form__btn--transaction');
const inputTransactionAmount = document.querySelector('.form__input--amount');
const inputTransactionCategory = document.querySelector(
  '.form__input--category'
);

const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');
const btnAIAnalysis = document.querySelector('.btn--ai-analysis'); // Ensure this element exists in your HTML

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

// Global variables
let sorted = false;
let movementsChart = null;
let categoryChart = null;
let currentUser = null;
let timer;

/////////////////////////////////////////////////
// Utility Functions

// Fix for the displayMovements function
const displayMovements = function (movements, dates, categories, sort = false) {
  containerMovements.innerHTML = '';

  // Ensure all parameters are valid arrays before proceeding
  if (
    !Array.isArray(movements) ||
    !Array.isArray(dates) ||
    !Array.isArray(categories)
  ) {
    console.error('Invalid parameters for displayMovements:', {
      movements,
      dates,
      categories,
    });
    return;
  }

  // Create a copy of the arrays to avoid modifying the original data
  console.log(movements, dates, categories);
  const movs = movements.slice();
  const movDates = dates.slice();
  const movCategories = categories.slice();

  // Sort if needed
  if (sort) {
    const combined = movs.map((mov, i) => ({
      amount: mov,
      date: movDates[i],
      category: movCategories[i],
    }));
    combined.sort((a, b) => a.amount - b.amount);
    movs.length = 0;
    movDates.length = 0;
    movCategories.length = 0;
    combined.forEach(item => {
      movs.push(item.amount);
      movDates.push(item.date);
      movCategories.push(item.category);
    });
  }

  // Define category colors
  const categoryColors = {
    salary: '#39b385',
    shopping: '#ffb003',
    food: '#ffcb03',
    entertainment: '#e52a5a',
    transport: '#ff585f',
    transfer: '#9be15d',
    loan: '#39b385',
    uncategorized: '#666',
  };

  // Display movements in reverse chronological order
  for (let i = movs.length - 1; i >= 0; i--) {
    const mov = movs[i];
    const type = mov > 0 ? 'deposit' : 'withdrawal';
    const date = new Date(movDates[i]).toLocaleDateString();
    const category = movCategories[i] || 'uncategorized';
    const categoryColor =
      categoryColors[category.toLowerCase()] || categoryColors.uncategorized;

    const html = `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${
      movs.length - i
    } ${type}</div>
        <div class="movements__date">${date}</div>
        <div class="movements__category" style="background-color: ${categoryColor}20; border-color: ${categoryColor}40; color: ${categoryColor}">${category}</div>
        <div class="movements__value">${mov}₹</div>
      </div>
    `;

    containerMovements.insertAdjacentHTML('beforeend', html);
  }
};

const calcDisplayBalance = function (movements) {
  const balance = movements.reduce((acc, mov) => acc + mov, 0);
  labelBalance.textContent = `${balance}₹`;
  return balance;
};

const calcDisplaySummary = function (movements, interestRate) {
  const incomes = movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumIn.textContent = `${incomes}₹`;

  const out = movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumOut.textContent = `${Math.abs(out)}₹`;

  const interest = movements
    .filter(mov => mov > 0)
    .map(deposit => (deposit * interestRate) / 100)
    .filter((int, i, arr) => int >= 1)
    .reduce((acc, int) => acc + int, 0);
  labelSumInterest.textContent = `${interest}₹`;
};

const updateUserInfo = function (account) {
  document.querySelector('.user-name').textContent =
    account.owner.split(' ')[0];
  document.querySelector('.acc-number').textContent = account.username;
  document.querySelector('.login-time').textContent =
    new Date().toLocaleTimeString();
};

// Initialize charts
const initCharts = function () {
  // Movements Chart
  const movementsCtx = document
    .getElementById('movementsChart')
    .getContext('2d');
  movementsChart = new Chart(movementsCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Balance Over Time',
          data: [],
          borderColor: '#39b385',
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(57, 179, 133, 0.1)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Balance History',
          font: {
            size: 16,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  // Category Chart
  const categoryCtx = document.getElementById('categoryChart').getContext('2d');
  categoryChart = new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            '#39b385',
            '#ffb003',
            '#ffcb03',
            '#e52a5a',
            '#ff585f',
            '#9be15d',
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Spending by Category',
          font: {
            size: 16,
          },
        },
      },
    },
  });
};

// Update charts with new data
const updateCharts = function (userData) {
  // Update movements chart
  const dates = userData.movementsDates.map(date =>
    new Date(date).toLocaleDateString()
  );
  const balanceData = userData.movements.reduce(
    (acc, mov, i) => {
      acc.push(acc[i] + mov);
      return acc;
    },
    [0]
  );

  movementsChart.data.labels = dates;
  movementsChart.data.datasets[0].data = balanceData;
  movementsChart.update();

  // Update category chart
  const categoryTotals = {};
  userData.movements.forEach((mov, i) => {
    const category = userData.categories[i] || 'uncategorized';
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }
    categoryTotals[category] += Math.abs(mov);
  });

  categoryChart.data.labels = Object.keys(categoryTotals);
  categoryChart.data.datasets[0].data = Object.values(categoryTotals);
  categoryChart.update();
};

function showTransactionSuccess() {
  // 1. Animate the transaction form
  const transactionForm = document.querySelector('.operation--transaction');
  transactionForm.classList.add('transaction-success');

  // Remove the animation class after it completes
  setTimeout(() => {
    transactionForm.classList.remove('transaction-success');
  }, 500);

  // 2. Create and show notification if it doesn't exist
  let notification = document.querySelector('.transaction-notification');

  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'transaction-notification';
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>Transaction added successfully!</span>
    `;
    document.body.appendChild(notification);
  }

  // Show the notification
  setTimeout(() => {
    notification.classList.add('show');

    // Hide the notification after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }, 100);
}

// Logout timer function
const startLogoutTimer = function () {
  // Clear any existing timer
  if (timer) clearInterval(timer);

  // Set time to 5 minutes (300 seconds)
  let time = 300;

  // Function to update the timer display
  const tick = function () {
    const min = String(Math.trunc(time / 60)).padStart(2, '0');
    const sec = String(time % 60).padStart(2, '0');

    // Display time in the UI
    labelTimer.textContent = `${min}:${sec}`;

    // When timer reaches 0, log out the user
    if (time === 0) {
      clearInterval(timer);
      // Reset UI and logout
      containerApp.style.opacity = 0;
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = 'https://mo-money-sal2.onrender.com/login.html';
    }

    // Decrease by 1 second
    time--;
  };

  // Call the tick function immediately and then every second
  tick();
  timer = setInterval(tick, 1000);

  return timer;
};

const updateUI = function (userData) {
  // Store the user data for use in sort function
  currentUser = userData;

  // Display movements
  displayMovements(
    userData.movements,
    userData.movementsDates,
    userData.categories
  );

  // Display balance
  calcDisplayBalance(userData.movements);

  // Display summary
  calcDisplaySummary(userData.movements, userData.interestRate);

  // Update charts
  updateCharts(userData);

  // Update user info
  updateUserInfo(userData);

  // Reset timer
  startLogoutTimer();
};

const updateMoneyPersonality = function (personalityType) {
  const personalityImage = document.getElementById('personalityImage');
  const personalityTypeElement = document.getElementById('personalityType');
  const personalityDescription = document.getElementById(
    'personalityDescription'
  );

  // Update image source
  personalityImage.src = `money_personality/${personalityType.toLowerCase()}.png`;

  // Update personality type text
  personalityTypeElement.textContent = `the ${personalityType}`;

  // Update description based on personality type
  const descriptions = {
    strategeist:
      'You are a strategic planner who carefully considers financial decisions. You excel at long-term planning and making calculated investments.',
    stockpiler:
      'You are a cautious saver who prioritizes building a strong financial safety net. You prefer stability and security in your financial choices.',
    socialite:
      'You are a social spender who enjoys sharing experiences with others. You value relationships and experiences over material possessions.',
    scholar:
      'You are a knowledge-driven spender who invests in learning and personal growth. You make informed decisions based on research and analysis.',
  };

  personalityDescription.textContent =
    descriptions[personalityType.toLowerCase()] ||
    'Your spending personality has been analyzed.';
};

/////////////////////////////////////////////////
// Event Handlers

const handleTransfer = async function (e) {
  e.preventDefault();
  const amount = +inputTransferAmount.value;
  const receiverUsername = inputTransferTo.value;

  if (amount <= 0 || !receiverUsername) {
    alert('Please enter a valid amount and recipient username');
    return;
  }

  try {
    const response = await fetch(
      'https://mo-money-sal2.onrender.com/api/transactions/transfer',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          receiverUsername,
          amount,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Transfer failed');
    }

    const data = await response.json();
    updateUI(data.sender);
    inputTransferAmount.value = inputTransferTo.value = '';
  } catch (error) {
    console.error('Transfer error:', error);
    alert(error.message || 'Transfer failed');
  }
};

const handleTransaction = async function (e) {
  e.preventDefault();
  const amount = +inputTransactionAmount.value;
  const category = inputTransactionCategory.value.toLowerCase();

  if (amount === 0) {
    alert('Please enter a valid amount');
    return;
  }

  try {
    const response = await fetch(
      'https://mo-money-sal2.onrender.com/api/transactions/add',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount,
          category,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Transaction failed');
    }

    const data = await response.json();
    console.log('Transaction response:', data);
    updateUI(data.user);
    e.preventDefault();

    const amount2 = document.querySelector('.form__input--amount').value;
    const category2 = document.querySelector('.form__input--category').value;

    if (amount2 && category2) {
      // Here you would typically add the transaction to your data model
      // For demo purposes, we'll just show the success animation
      showTransactionSuccess();

      // Reset form
      document.querySelector('.form__input--amount').value = '';
    }
    inputTransactionAmount.value = '';
    // Reset the select to the first option
    inputTransactionCategory.selectedIndex = 0;
  } catch (error) {
    console.error('Transaction error:', error);
    alert(error.message || 'Transaction failed');
  }
};

const handleCloseAccount = async function (e) {
  e.preventDefault();

  try {
    const response = await fetch(
      'https://mo-money-sal2.onrender.com/api/close-account',
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to close account');
    }

    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = 'https://mo-money-sal2.onrender.com/login.html'; // Updated URL
  } catch (error) {
    console.error('Close account error:', error);
    alert(error.message || 'Failed to close account');
  }
};

const handleSort = function (e) {
  e.preventDefault();

  // Use the currentUser object that's kept in memory
  if (
    currentUser &&
    Array.isArray(currentUser.movements) &&
    Array.isArray(currentUser.movementsDates) &&
    Array.isArray(currentUser.categories)
  ) {
    displayMovements(
      currentUser.movements,
      currentUser.movementsDates,
      currentUser.categories,
      !sorted
    );
    sorted = !sorted;
  } else {
    console.error('Cannot sort: Current user data is not available or invalid');
  }
};

const handleAIAnalysis = async function (e) {
  e.preventDefault();

  // Show loading state
  document.querySelector('.ai-insights').style.display = 'block';
  document.querySelector('.ai-insights__loading').style.display = 'flex';
  document.querySelector('.ai-insights__content').style.display = 'none';

  try {
    // Fetch fresh user data from server
    const userResponse = await fetch(
      'https://mo-money-sal2.onrender.com/api/user',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await userResponse.json();
    console.log(userData);
    if (
      !userData.user ||
      !userData.user.movements ||
      !userData.user.movementsDates ||
      !userData.user.categories
    ) {
      throw new Error('Transaction data not available');
    }

    // Send data for AI analysis
    const transactionsToSend = userData.user.movements.map(
      (movement, index) => ({
        movement: movement,
        date: userData.user.movementsDates[index],
        category: userData.user.categories[index],
      })
    );

    const response = await fetch(
      'https://mo-money-sal2.onrender.com/api/ai/analyze',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          transactions: transactionsToSend, // Now 'transactions' is an array
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    const data = await response.json();

    // Update personality section
    updateMoneyPersonality(data.spenderType);
    document.getElementById('spenderType').textContent =
      data.spenderDescription;
    document.getElementById('recommendationsList').innerHTML =
      data.recommendations.map(rec => `<li>${rec}</li>`).join('');
    document.getElementById('spendingTrends').textContent = data.trends;

    // Hide loading and show content
    document.querySelector('.ai-insights__loading').style.display = 'none';
    document.querySelector('.ai-insights__content').style.display = 'block';
  } catch (error) {
    console.error('AI Analysis error:', error);
    alert(error.message || 'Analysis failed');
    // Hide loading state on error
    document.querySelector('.ai-insights__loading').style.display = 'none';
  }
};

/////////////////////////////////////////////////
// App Initialization

const initApp = async () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');

  if (!token || !userData) {
    window.location.href = 'https://mo-money-sal2.onrender.com/login.html'; // Updated URL
    return;
  }

  try {
    // Initialize charts first
    initCharts();

    // Fetch user data
    const response = await fetch(
      'https://mo-money-sal2.onrender.com/api/user',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    const userData = data.user;

    // Show the app
    document.querySelector('.app').style.opacity = 100;

    // Update UI with user data after charts are initialized
    updateUI(userData);

    // Add event listeners

    document
      .querySelector('.form--transfer')
      .addEventListener('submit', handleTransfer);
    document
      .querySelector('.form--transaction')
      .addEventListener('submit', handleTransaction);
    document
      .querySelector('.form--close')
      .addEventListener('submit', handleCloseAccount);
    document.querySelector('.btn--sort').addEventListener('click', handleSort);
    document
      .querySelector('.btn--ai-analysis')
      .addEventListener('click', handleAIAnalysis);
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Failed to load dashboard. Please try logging in again.');
    window.location.href = 'https://mo-money-sal2.onrender.com/login.html';
  }
};

document.addEventListener('DOMContentLoaded', initApp);
