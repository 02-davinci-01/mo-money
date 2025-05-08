const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Create JWT token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { owner, username, pin } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new user
    const user = await User.create({
      owner,
      username,
      pin,
      movements: [],
      movementsDates: [],
      categories: [],
    });

    // Create token
    const token = createToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, pin } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check pin
    if (user.pin !== pin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = createToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// Get user data
exports.getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-pin');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
};

// Add movement
exports.addMovement = async (req, res) => {
  try {
    const { amount, category } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add movement
    user.movements.push(amount);
    user.movementsDates.push(new Date().toISOString());
    if (category) {
      user.categories.push(category);
    }

    // Update balance
    user.balance = user.movements.reduce((acc, mov) => acc + mov, 0);

    await user.save();

    res.status(200).json({
      message: 'Movement added successfully',
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance,
        movements: user.movements,
        movementsDates: user.movementsDates,
        categories: user.categories,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding movement', error: error.message });
  }
};

// Get movements
exports.getMovements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      movements: user.movements,
      movementsDates: user.movementsDates,
      categories: user.categories,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching movements', error: error.message });
  }
}; 