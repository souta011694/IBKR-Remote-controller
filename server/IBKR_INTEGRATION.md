# IBKR Account Data Integration Guide

This guide explains how to integrate your Python bot with the dashboard to display real IBKR account data.

## Option 1: Python Bot API Endpoint (Recommended)

If your Python bot can expose an HTTP API, you can modify the endpoints in `server.js` to call your bot:

```javascript
// In server.js, modify /api/account/summary endpoint
app.get('/api/account/summary', authenticateToken, async (req, res) => {
  try {
    // Call your Python bot API
    const response = await axios.get('http://localhost:YOUR_BOT_PORT/account/summary');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching account summary:', error);
    res.status(500).json({ error: 'Failed to fetch account summary' });
  }
});
```

## Option 2: File-Based Integration

Your Python bot can write account data to a JSON file, and the server reads it:

```javascript
// In server.js
const fs = require('fs').promises;

app.get('/api/account/summary', authenticateToken, async (req, res) => {
  try {
    const data = await fs.readFile('account_data.json', 'utf8');
    const accountData = JSON.parse(data);
    res.json(accountData);
  } catch (error) {
    console.error('Error reading account data:', error);
    res.status(500).json({ error: 'Failed to fetch account summary' });
  }
});
```

Your Python bot should write data in this format:

```json
{
  "totalBalance": 125000.50,
  "netLiquidation": 125000.50,
  "buyingPower": 50000.00,
  "cashBalance": 75000.00,
  "openPositionsCount": 8,
  "closedPositionsCount": 24,
  "dailyProfit": 1250.25,
  "dailyProfitPercent": 1.01,
  "totalProfit": 15250.75,
  "totalProfitPercent": 13.88,
  "currency": "USD",
  "lastUpdate": "2024-01-05T10:30:00.000Z"
}
```

## Option 3: Direct IBKR API Integration

If you want to integrate directly with IBKR API from Node.js, you can use the IB API client libraries. However, the most common approach is to use your existing Python bot since IBKR integration is typically done in Python.

## Required Data Structure

### Account Summary (`/api/account/summary`)
```javascript
{
  totalBalance: number,        // Total account balance
  netLiquidation: number,      // Net liquidation value
  buyingPower: number,          // Available buying power
  cashBalance: number,          // Cash balance
  openPositionsCount: number,   // Number of open positions
  closedPositionsCount: number, // Number of closed positions today
  dailyProfit: number,          // Daily profit/loss
  dailyProfitPercent: number,   // Daily profit percentage
  totalProfit: number,          // Total profit/loss
  totalProfitPercent: number,   // Total profit percentage
  currency: string,            // Account currency (e.g., "USD")
  lastUpdate: string            // ISO timestamp
}
```

### Positions (`/api/account/positions`)
```javascript
{
  positions: [
    {
      symbol: string,              // Stock symbol
      quantity: number,             // Number of shares
      avgPrice: number,            // Average purchase price
      currentPrice: number,        // Current market price
      marketValue: number,         // Current market value
      unrealizedPnl: number,      // Unrealized profit/loss
      unrealizedPnlPercent: number // Unrealized P&L percentage
    }
  ]
}
```

## Example Python Bot Integration

Here's an example of how your Python bot could expose account data:

```python
# In your Python bot
from flask import Flask, jsonify
import ib_insync

app = Flask(__name__)
ib = ib_insync.IB()

@app.route('/account/summary')
def account_summary():
    account_values = ib.accountValues()
    
    # Extract account data
    data = {
        'totalBalance': float(ib.accountSummary()[0].value),
        'netLiquidation': float([v for v in account_values if v.tag == 'NetLiquidation'][0].value),
        'buyingPower': float([v for v in account_values if v.tag == 'BuyingPower'][0].value),
        'cashBalance': float([v for v in account_values if v.tag == 'CashBalance'][0].value),
        'openPositionsCount': len(ib.positions()),
        'dailyProfit': calculate_daily_profit(),
        # ... etc
    }
    return jsonify(data)

if __name__ == '__main__':
    app.run(port=5001)  # Different port from Node.js server
```

Then update `server.js` to call this endpoint.

