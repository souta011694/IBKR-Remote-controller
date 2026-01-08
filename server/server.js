const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const {
  createUser,
  verifyPassword,
  generateToken,
  verifyToken,
  findUserByEmail,
} = require('./auth');
const { getBalanceHistory, saveBalanceSnapshot } = require('./balanceHistory');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Bot process management
let botProcess = null;
let botStatus = {
  isRunning: false,
  startTime: null,
  pid: null,
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Bot Manager API is running' });
});

// Authentication routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await createUser(name, email, password);
    const token = generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user,
    });
  } catch (error) {
    if (error.message === 'User already exists') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await verifyPassword(email, password);
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Bot control routes (protected)
app.get('/api/bot/status', authenticateToken, (req, res) => {
  // Check if process is still running
  if (botProcess && botProcess.pid) {
    try {
      // Check if process exists (Windows)
      process.kill(botProcess.pid, 0);
      botStatus.isRunning = true;
    } catch (e) {
      // Process doesn't exist
      botStatus.isRunning = false;
      botProcess = null;
    }
  } else {
    botStatus.isRunning = false;
  }

  res.json({
    isRunning: botStatus.isRunning,
    startTime: botStatus.startTime,
    pid: botStatus.pid,
  });
});

app.post('/api/bot/start', authenticateToken, (req, res) => {
  if (botStatus.isRunning) {
    return res.status(400).json({ 
      error: 'Bot is already running',
      isRunning: true 
    });
  }

  const botPath = process.env.BOT_PATH || req.body.botPath || 'bot.py';
  const pythonCmd = process.env.PYTHON_CMD || req.body.pythonCmd || 'python';

  try {
    // Start the Python bot
    botProcess = spawn(pythonCmd, [botPath], {
      cwd: process.env.BOT_DIR || process.cwd(),
      stdio: 'pipe',
    });

    botProcess.stdout.on('data', (data) => {
      console.log(`Bot stdout: ${data}`);
    });

    botProcess.stderr.on('data', (data) => {
      console.error(`Bot stderr: ${data}`);
    });

    botProcess.on('close', (code) => {
      console.log(`Bot process exited with code ${code}`);
      botStatus.isRunning = false;
      botProcess = null;
    });

    botProcess.on('error', (error) => {
      console.error('Error starting bot:', error);
      botStatus.isRunning = false;
      botProcess = null;
      return res.status(500).json({ 
        error: 'Failed to start bot: ' + error.message,
        isRunning: false 
      });
    });

    botStatus.isRunning = true;
    botStatus.startTime = new Date().toISOString();
    botStatus.pid = botProcess.pid;

    res.json({
      message: 'Bot started successfully',
      isRunning: true,
      pid: botProcess.pid,
      startTime: botStatus.startTime,
    });
  } catch (error) {
    console.error('Error starting bot:', error);
    res.status(500).json({ 
      error: 'Failed to start bot: ' + error.message,
      isRunning: false 
    });
  }
});

app.post('/api/bot/stop', authenticateToken, (req, res) => {
  if (!botStatus.isRunning || !botProcess) {
    return res.status(400).json({ 
      error: 'Bot is not running',
      isRunning: false 
    });
  }

  try {
    // Kill the bot process
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', botProcess.pid, '/f', '/t']);
    } else {
      botProcess.kill('SIGTERM');
    }

    botStatus.isRunning = false;
    botStatus.startTime = null;
    botStatus.pid = null;
    botProcess = null;

    res.json({
      message: 'Bot stopped successfully',
      isRunning: false,
    });
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({ 
      error: 'Failed to stop bot: ' + error.message,
      isRunning: botStatus.isRunning 
    });
  }
});

// IBKR Account Data routes (protected)
// These endpoints can be integrated with your Python bot or IBKR API
app.get('/api/account/summary', authenticateToken, async (req, res) => {
  try {
    // TODO: Integrate with your Python bot or IBKR API
    // For now, returning mock data structure
    // You can replace this with actual API calls to your Python bot
    
    // Option 1: Call your Python bot API if it exposes account data
    // const response = await axios.get('http://localhost:YOUR_BOT_PORT/account');
    
    // Option 2: Use IBKR API directly
    // const accountData = await getIBKRAccountData();
    
    // Option 3: Read from a file that your Python bot writes to
    // const accountData = await fs.readFile('account_data.json', 'utf8');
    
    // Mock data structure - replace with actual data
    const accountData = {
      totalBalance: 125000.50,
      netLiquidation: 125000.50,
      buyingPower: 50000.00,
      cashBalance: 75000.00,
      openPositionsCount: 8,
      closedPositionsCount: 24,
      dailyProfit: 1250.25,
      dailyProfitPercent: 1.01,
      totalProfit: 15250.75,
      totalProfitPercent: 13.88,
      currency: 'USD',
      lastUpdate: new Date().toISOString(),
    };

    // Save balance snapshot to history
    try {
      const userId = req.user.userId || req.user.id || req.user.email; // Use email as fallback identifier
      await saveBalanceSnapshot(userId, accountData);
    } catch (err) {
      console.error('Error saving balance snapshot:', err);
      // Don't fail the request if saving history fails
    }

    res.json(accountData);
  } catch (error) {
    console.error('Error fetching account summary:', error);
    res.status(500).json({ error: 'Failed to fetch account summary' });
  }
});

app.get('/api/account/balance-history', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const userId = req.user.userId || req.user.id || req.user.email; // Use email as fallback identifier
    const history = await getBalanceHistory(userId, days);
    res.json({ history });
  } catch (error) {
    console.error('Error fetching balance history:', error);
    res.status(500).json({ error: 'Failed to fetch balance history' });
  }
});

app.get('/api/account/positions', authenticateToken, async (req, res) => {
  try {
    // TODO: Integrate with your Python bot or IBKR API to get open positions
    // Mock data structure
    const positions = [
      {
        symbol: 'AAPL',
        quantity: 100,
        avgPrice: 150.25,
        currentPrice: 175.50,
        marketValue: 17550.00,
        unrealizedPnl: 2525.00,
        unrealizedPnlPercent: 16.81,
        entryTime: '2024-01-15T09:30:00',
      },
      {
        symbol: 'MSFT',
        quantity: 50,
        avgPrice: 300.00,
        currentPrice: 380.25,
        marketValue: 19012.50,
        unrealizedPnl: 4012.50,
        unrealizedPnlPercent: 26.75,
        entryTime: '2024-01-15T10:15:00',
      },
      {
        symbol: 'GOOGL',
        quantity: 75,
        avgPrice: 140.00,
        currentPrice: 145.75,
        marketValue: 10931.25,
        unrealizedPnl: 431.25,
        unrealizedPnlPercent: 4.11,
        entryTime: '2024-01-15T11:00:00',
      },
      {
        symbol: 'TSLA',
        quantity: 200,
        avgPrice: 250.00,
        currentPrice: 245.50,
        marketValue: 49100.00,
        unrealizedPnl: -900.00,
        unrealizedPnlPercent: -1.80,
        entryTime: '2024-01-15T13:20:00',
      },
    ];

    res.json({ positions });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

app.get('/api/account/trades', authenticateToken, async (req, res) => {
  try {
    // TODO: Integrate with your Python bot or IBKR API to get trade history
    // For now, returning mock data structure
    // You can replace this with actual API calls to your Python bot
    
    // Option 1: Call your Python bot API if it exposes trade data
    // const response = await axios.get('http://localhost:YOUR_BOT_PORT/trades');
    
    // Option 2: Read from a file that your Python bot writes to
    // const tradeData = await fs.readFile('trade_history.json', 'utf8');
    
    // Mock data structure - replace with actual data
    // Get today's date for filtering
    const today = new Date().toISOString().split('T')[0];
    const requestedDate = req.query.date || today;
    
    const trades = [
      { 
        symbol: 'GOOGL', 
        action: 'BUY', 
        quantity: 25, 
        price: 120.00, 
        time: '09:30:00',
        date: today,
        profit: 125.50
      },
      { 
        symbol: 'TSLA', 
        action: 'SELL', 
        quantity: 10, 
        price: 250.50, 
        time: '14:15:00',
        date: today,
        profit: -50.25
      },
      { 
        symbol: 'AAPL', 
        action: 'BUY', 
        quantity: 50, 
        price: 175.25, 
        time: '10:45:00',
        date: today,
        profit: 87.50
      },
      { 
        symbol: 'MSFT', 
        action: 'SELL', 
        quantity: 15, 
        price: 380.75, 
        time: '15:20:00',
        date: today,
        profit: 225.00
      },
      { 
        symbol: 'NVDA', 
        action: 'BUY', 
        quantity: 20, 
        price: 450.00, 
        time: '11:30:00',
        date: today,
        profit: 150.00
      },
    ];

    // Filter by date if provided
    const filteredTrades = requestedDate 
      ? trades.filter(t => t.date === requestedDate)
      : trades;

    res.json({
      trades: filteredTrades,
      today: filteredTrades, // Keep for backward compatibility
      date: requestedDate,
      totalTrades: filteredTrades.length,
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Bot control API ready at http://localhost:${PORT}/api`);
});

