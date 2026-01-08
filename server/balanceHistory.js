const fs = require('fs').promises;
const path = require('path');

const BALANCE_HISTORY_FILE = path.join(__dirname, 'balance_history.json');

// Initialize balance history file if it doesn't exist
async function initBalanceHistoryFile() {
  try {
    await fs.access(BALANCE_HISTORY_FILE);
  } catch {
    await fs.writeFile(BALANCE_HISTORY_FILE, JSON.stringify([]));
  }
}

// Read balance history from file
async function getBalanceHistory(userId, days = 30) {
  await initBalanceHistoryFile();
  const data = await fs.readFile(BALANCE_HISTORY_FILE, 'utf8');
  const allHistory = JSON.parse(data);
  
  // Filter by userId and date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return allHistory.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entry.userId === userId && entryDate >= cutoffDate;
  }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Save balance snapshot
async function saveBalanceSnapshot(userId, balanceData) {
  await initBalanceHistoryFile();
  const data = await fs.readFile(BALANCE_HISTORY_FILE, 'utf8');
  const history = JSON.parse(data);
  
  const snapshot = {
    id: Date.now().toString(),
    userId,
    timestamp: new Date().toISOString(),
    totalBalance: balanceData.totalBalance,
    netLiquidation: balanceData.netLiquidation,
    cashBalance: balanceData.cashBalance,
    buyingPower: balanceData.buyingPower,
    dailyProfit: balanceData.dailyProfit,
  };
  
  history.push(snapshot);
  
  // Keep only last 90 days of data
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  const filteredHistory = history.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= cutoffDate;
  });
  
  await fs.writeFile(BALANCE_HISTORY_FILE, JSON.stringify(filteredHistory, null, 2));
  return snapshot;
}

module.exports = {
  getBalanceHistory,
  saveBalanceSnapshot,
};

