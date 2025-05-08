// DOM Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');
const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

// Global variables
let currentUser = null;
let sorted = false;
const locale = 'en-IN';
const currency = 'INR';

// Format currency
const formatCur = (value, locale, currency) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

// Format movement date
const formatMovementDate = (date) => {
  const calcDaysPassed = (date1, date2) =>
    Math.round(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));

  const daysPassed = calcDaysPassed(new Date(), new Date(date));

  if (daysPassed === 0) return 'Today';
  if (daysPassed === 1) return 'Yesterday';
  if (daysPassed <= 7) return `${daysPassed} days ago`;

  return new Intl.DateTimeFormat(locale).format(new Date(date));
};

// Display movements
const displayMovements = (movements, movementsDates, categories, sort = false) => {
  containerMovements.innerHTML = '';

  const movs = sort ? [...movements].reverse() : movements;
  const dates = sort ? [...movementsDates].reverse() : movementsDates;
  const cats = sort ? [...categories].reverse() : categories;

  movs.forEach((mov, i) => {
    const type = mov > 0 ? 'deposit' : 'withdrawal';
    const date = formatMovementDate(dates[i]);
    const category = cats[i] || 'Uncategorized';

    const html = `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${i + 1} ${type}</div>
        <div class="movements__date">${date}</div>
        <div class="movements__category">${category}</div>
        <div class="movements__value">${formatCur(mov, locale, currency)}</div>
      </div>
    `;

    containerMovements.insertAdjacentHTML('afterbegin', html);
  });
};

// Calculate and display summary
const calcDisplaySummary = (movements) => {
  const incomes = movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumIn.textContent = formatCur(incomes, locale, currency);

  const out = movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumOut.textContent = formatCur(Math.abs(out), locale, currency);

  const interest = movements
    .filter(mov => mov > 0)
    .map(deposit => (deposit * 1.2) / 100)
    .reduce((acc, int) => acc + int, 0);
  labelSumInterest.textContent = formatCur(interest, locale, currency);
};

// Update UI
const updateUI = (user) => {
  if (!user) return;

  // Display movements
  displayMovements(user.movements, user.movementsDates, user.categories);

  // Display summary
  calcDisplaySummary(user.movements);

  // Display balance
  labelBalance.textContent = formatCur(user.balance, locale, currency);
};

// Get user data
const getUserData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/index.html';
      return;
    }

    const response = await fetch('http://localhost:3001/api/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;

      // Update UI
      labelWelcome.textContent = `Welcome back, ${currentUser.username}`;
      containerApp.style.opacity = 100;

      // Format date
      const now = new Date();
      const options = {
        hour: 'numeric',
        minute: 'numeric',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      };
      labelDate.textContent = new Intl.DateTimeFormat(locale, options).format(now);

      // Update UI with user data
      updateUI(currentUser);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/index.html';
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    alert('An error occurred while fetching user data');
  }
};

// Add movement
const addMovement = async (amount, category) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3001/api/movements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, category }),
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      updateUI(currentUser);
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to add movement');
    }
  } catch (error) {
    console.error('Error adding movement:', error);
    alert('An error occurred while adding movement');
  }
};

// Event handlers
btnTransfer.addEventListener('click', (e) => {
  e.preventDefault();
  const amount = +inputTransferAmount.value;
  const category = 'Transfer';
  if (amount > 0) {
    addMovement(-amount, category);
    inputTransferAmount.value = inputTransferTo.value = '';
  }
});

btnLoan.addEventListener('click', (e) => {
  e.preventDefault();
  const amount = Math.floor(inputLoanAmount.value);
  if (amount > 0) {
    addMovement(amount, 'Loan');
    inputLoanAmount.value = '';
  }
});

btnSort.addEventListener('click', (e) => {
  e.preventDefault();
  if (currentUser) {
    displayMovements(currentUser.movements, currentUser.movementsDates, currentUser.categories, !sorted);
    sorted = !sorted;
  }
});

// Initialize
// Check authentication and load user data
getUserData(); 