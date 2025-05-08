const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });

// Import controllers
const userController = require('./controllers/userController');
const User = require('./models/userModel');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    // Check for token in Authorization header or query parameters
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
    if (!token) {
      return res.status(401).json({ message: 'No authentication token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mo-money-secret-key');
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, '../frontend/final'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.css':
        res.setHeader('Content-Type', 'text/css');
        break;
      case '.js':
        res.setHeader('Content-Type', 'application/javascript');
        break;
      case '.html':
        res.setHeader('Content-Type', 'text/html');
        break;
      case '.png':
        res.setHeader('Content-Type', 'image/png');
        break;
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
    }
  }
}));

// Serve dashboard files
app.use('/dashboard', express.static(path.join(__dirname, '../frontend/final_dashboard'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.css':
        res.setHeader('Content-Type', 'text/css');
        break;
      case '.js':
        res.setHeader('Content-Type', 'application/javascript');
        break;
      case '.html':
        res.setHeader('Content-Type', 'text/html');
        break;
      case '.png':
        res.setHeader('Content-Type', 'image/png');
        break;
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
    }
  }
}));

// Serve assets
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// Root route - redirect to login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Login route
app.get('/login', (req, res) => {
  res.redirect('/login.html');
});

// Dashboard route
app.get('/dashboard', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/final_dashboard/index.html'));
});

// Routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { owner, username, pin } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin.toString(), salt);

    // Create new user
    const user = await User.create({
      owner,
      username,
      pin: hashedPin,
      movements: [],
      movementsDates: [],
      categories: []
    });

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'mo-money-secret-key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    const { username, pin } = req.body;
    console.log("Login attempt for username:", username);
    console.log("Provided PIN:", pin);

    // Find user
    const user = await User.findOne({ username });
    console.log("User found in database:", user);

    if (!user) {
      console.log("User not found in database");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check pin
    const isPinValid = await bcrypt.compare(pin.toString(), user.pin);
    console.log("PIN comparison result:", isPinValid);

    if (!isPinValid) {
      console.log("PIN comparison failed");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "mo-money-secret-key",
      { expiresIn: "30d" }
    );

    console.log("Login successful. Generated token:", token);
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});

app.get('/api/user', auth, async (req, res) => {
  try {
    // Force a fresh read from the database
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate balance from movements
    const balance = user.movements.reduce((acc, mov) => acc + mov, 0);

    // Create user object with all necessary data
    const userData = {
      id: user._id,
      owner: user.owner,
      username: user.username,
      movements: user.movements || [],
      movementsDates: user.movementsDates || [],
      categories: user.categories || [],
      interestRate: user.interestRate || 1.2,
      currency: user.currency || 'INR',
      locale: user.locale || 'en-IN',
      balance: balance
    };

    // Log the data being sent
    console.log('Sending user data:', {
      username: userData.username,
      movementsCount: userData.movements.length,
      balance: userData.balance
    });

    res.json({ user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

app.post('/api/movements', auth, userController.addMovement);
app.get('/api/movements', auth, userController.getMovements);

// Get account balance
app.get('/api/accounts/:userId/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const balance = user.movements.reduce((acc, mov) => acc + mov, 0);
    res.json({ balance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Seed test users
app.post('/api/seed', async (req, res) => {
  try {
    // Check if test users already exist
    const test1Exists = await User.findOne({ username: 'test1' });
    const test2Exists = await User.findOne({ username: 'test2' });
    const goldfishExists = await User.findOne({ username: 'goldfish' });

    // Only create test users if they don't exist
    if (!test1Exists || !test2Exists || !goldfishExists) {
      console.log('Creating test users...');
      
      // Create test users
      const testUsers = [
        {
          owner: "Test User 1",
          username: "test1",
          pin: "1111",
          movements: [200, 450, -400, 3000, -650, -130, 70, 1300],
          interestRate: 1.2,
          movementsDates: [
            "2024-03-18T21:31:17.178Z",
            "2024-03-16T07:42:02.383Z",
            "2024-03-14T09:15:04.904Z",
            "2024-03-10T10:17:24.185Z",
            "2024-03-05T14:11:59.604Z",
            "2024-03-01T17:01:17.194Z",
            "2024-02-28T23:36:17.929Z",
            "2024-02-25T10:51:36.790Z",
          ],
          categories: [
            "food",
            "entertainment",
            "health",
            "travel",
            "food",
            "entertainment",
            "health",
            "travel",
          ],
          currency: "INR",
          locale: "en-IN",
        },
        {
          owner: "Test User 2",
          username: "test2",
          pin: "2222",
          movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
          interestRate: 1.5,
          movementsDates: [
            "2024-03-18T21:31:17.178Z",
            "2024-03-16T07:42:02.383Z",
            "2024-03-14T09:15:04.904Z",
            "2024-03-10T10:17:24.185Z",
            "2024-03-05T14:11:59.604Z",
            "2024-03-01T17:01:17.194Z",
            "2024-02-28T23:36:17.929Z",
            "2024-02-25T10:51:36.790Z",
          ],
          categories: [
            "travel",
            "health",
            "entertainment",
            "food",
            "travel",
            "health",
            "entertainment",
            "food",
          ],
          currency: "INR",
          locale: "en-IN",
        },
        {
          owner: "GoldfishBlub",
          username: "goldfish",
          pin: "3131",
          movements: [100, 500, -200, 1200, -300, 250, 800, -150, 600, -100],
          interestRate: 0.8,
          movementsDates: [
            "2025-05-01T10:00:00.000Z",
            "2025-05-02T14:30:00.000Z",
            "2025-05-03T18:45:00.000Z",
            "2025-05-04T09:15:00.000Z",
            "2025-05-05T12:00:00.000Z",
            "2025-05-05T19:00:00.000Z",
            "2025-05-06T11:45:00.000Z",
            "2025-05-07T16:20:00.000Z",
            "2025-05-08T08:00:00.000Z",
            "2025-05-08T15:00:00.000Z",
          ],
          categories: [
            "entertainment",
            "travel",
            "food",
            "entertainment",
            "shopping",
            "travel",
            "entertainment",
            "food",
            "travel",
            "entertainment",
          ],
          currency: "INR",
          locale: "en-IN",
        },
      ];

      // Hash PINs and create users
      for (const user of testUsers) {
        if (
          (user.username === "test1" && !test1Exists) ||
          (user.username === "test2" && !test2Exists) ||
          (user.username === "goldfish" && !goldfishExists)
        ) {
          const salt = await bcrypt.genSalt(10);
          const hashedPin = await bcrypt.hash(user.pin, salt);
          await User.create({
            ...user,
            pin: hashedPin,
          });
        }
      }

      res.status(201).json({ message: 'Test users created successfully' });
    } else {
      res.status(200).json({ message: 'Test users already exist' });
    }
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ message: 'Error creating test users' });
  }
});

// Close account endpoint
app.delete('/api/close-account', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user account
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({ message: 'Account closed successfully' });
  } catch (error) {
    console.error('Close account error:', error);
    res.status(500).json({ message: 'Error closing account' });
  }
});

// Transfer money endpoint
app.post('/api/transactions/transfer', auth, async (req, res) => {
  try {
    const { receiverUsername, amount } = req.body;
    const senderId = req.user.id;

    console.log('Transfer request:', { senderId, receiverUsername, amount });

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Find sender and receiver
    const sender = await User.findById(senderId);
    const receiver = await User.findOne({ username: receiverUsername });

    if (!sender || !receiver) {
      console.log('User not found:', { sender: !!sender, receiver: !!receiver });
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if sender has enough balance
    const senderBalance = sender.movements.reduce((acc, mov) => acc + mov, 0);
    if (senderBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create transfer transaction
    const transferDate = new Date().toISOString();
    
    // Update sender's account
    sender.movements.push(-amount);
    sender.movementsDates.push(transferDate);
    sender.categories.push('transfer');
    await sender.save();

    // Update receiver's account
    receiver.movements.push(amount);
    receiver.movementsDates.push(transferDate);
    receiver.categories.push('transfer');
    await receiver.save();

    // Force a fresh read from the database
    const updatedSender = await User.findById(senderId).lean();
    const updatedReceiver = await User.findOne({ username: receiverUsername }).lean();

    // Calculate new balances
    const senderNewBalance = updatedSender.movements.reduce((acc, mov) => acc + mov, 0);
    const receiverNewBalance = updatedReceiver.movements.reduce((acc, mov) => acc + mov, 0);

    console.log('Transfer successful:', {
      sender: { 
        username: updatedSender.username, 
        newBalance: senderNewBalance,
        movements: updatedSender.movements,
        lastMovement: updatedSender.movements[updatedSender.movements.length - 1]
      },
      receiver: { 
        username: updatedReceiver.username, 
        newBalance: receiverNewBalance,
        movements: updatedReceiver.movements,
        lastMovement: updatedReceiver.movements[updatedReceiver.movements.length - 1]
      }
    });

    // Return both updated accounts
    res.status(200).json({
      message: 'Transfer successful',
      sender: {
        id: updatedSender._id,
        owner: updatedSender.owner,
        username: updatedSender.username,
        movements: updatedSender.movements,
        movementsDates: updatedSender.movementsDates,
        categories: updatedSender.categories,
        interestRate: updatedSender.interestRate,
        balance: senderNewBalance
      },
      receiver: {
        id: updatedReceiver._id,
        owner: updatedReceiver.owner,
        username: updatedReceiver.username,
        movements: updatedReceiver.movements,
        movementsDates: updatedReceiver.movementsDates,
        categories: updatedReceiver.categories,
        interestRate: updatedReceiver.interestRate,
        balance: receiverNewBalance
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Error processing transfer' });
  }
});

// AI Analysis endpoint
app.post('/api/ai/analyze', auth, async (req, res) => {
  try {
    const { transactions } = req.body;
    
    console.log('Received AI analysis request with transactions:', {
      count: transactions?.length,
      sample: transactions?.slice(0, 2)
    });
    
    if (!transactions || !Array.isArray(transactions)) {
      console.error('Invalid transaction data:', transactions);
      return res.status(400).json({ message: 'Invalid transaction data' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return res.status(500).json({ message: 'AI service configuration error' });
    }

    // Prepare prompt for Gemini
    const prompt = `Analyze these financial transactions and provide insights in JSON format:
    ${JSON.stringify(transactions, null, 2)}
    
    Provide a JSON response with these exact keys:
    {
      "spenderType": "one of these 4 options-- scholar,scoialite,stockpiler,strategeist",
      "spenderDescription": "a short description of the user's spending profile",
      "recommendations": ["array of 3-5 specific recommendations"],
      "trends": "string describing spending trends"
    }`;

    console.log('Sending request to Gemini API with transactions:', transactions.length);
    
    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    console.log('Gemini API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received response from Gemini API:', {
      hasCandidates: !!data.candidates,
      candidateCount: data.candidates?.length
    });

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini API response structure:', data);
      throw new Error('Invalid response from AI service');
    }

    // Extract the text from the response
    const responseText = data.candidates[0].content.parts[0].text;
    console.log('Raw Gemini response:', responseText);
    
    // Parse the JSON response
    let analysis;
    try {
      // Find JSON in the response text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response text:', responseText);
        throw new Error('No JSON found in response');
      }
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw new Error('Failed to parse AI analysis');
    }

    // Validate the analysis structure
    if (!analysis.spenderType || !Array.isArray(analysis.recommendations) || !analysis.trends) {
      console.error('Invalid analysis structure:', analysis);
      throw new Error('Invalid analysis structure');
    }

    console.log('Successfully analyzed transactions');
    res.json(analysis);
  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to analyze transactions',
      error: error.message 
    });
  }
});

// Handle all other routes
app.get('*', (req, res) => {
  res.redirect('/');
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server URL: http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port or kill the process using this port.`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 