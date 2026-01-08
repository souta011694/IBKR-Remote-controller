# IBKR Account Data Requirements

This document explains what data you need to provide from your IBKR account to populate the dashboard.

## Required Account Values

To display your account status, you need to extract the following values from IBKR:

### 1. Account Summary Values

These are the main account metrics that IBKR provides via their API:

| Dashboard Field | IBKR Account Value Tag | Description |
|----------------|------------------------|-------------|
| `totalBalance` | `TotalCashValue` or `NetLiquidation` | Total account value |
| `netLiquidation` | `NetLiquidation` | Net liquidation value |
| `buyingPower` | `BuyingPower` | Available buying power |
| `cashBalance` | `CashBalance` or `TotalCashValue` | Cash available |
| `openPositionsCount` | Count of `ib.positions()` | Number of open positions |
| `closedPositionsCount` | Count from trade history | Positions closed today |
| `dailyProfit` | Calculate from `DayTrades` or `UnrealizedPnL` | Today's profit/loss |
| `dailyProfitPercent` | Calculate: `(dailyProfit / previousBalance) * 100` | Daily profit percentage |
| `totalProfit` | Calculate from account history | Total profit since start |
| `totalProfitPercent` | Calculate: `(totalProfit / initialBalance) * 100` | Total profit percentage |
| `currency` | Account base currency | Usually "USD" |

### 2. Position Data

For each open position, you need:

| Field | IBKR Source | Description |
|-------|-------------|-------------|
| `symbol` | `position.contract.symbol` | Stock symbol (e.g., "AAPL") |
| `quantity` | `position.position` | Number of shares |
| `avgPrice` | `position.avgCost / position.position` | Average purchase price |
| `currentPrice` | `ib.reqMktData()` or `position.marketPrice` | Current market price |
| `marketValue` | `position.marketValue` | Current market value |
| `unrealizedPnl` | `position.unrealizedPNL` | Unrealized profit/loss |
| `unrealizedPnlPercent` | Calculate: `(unrealizedPnl / costBasis) * 100` | P&L percentage |

## How to Get This Data

### Option 1: Using ib_insync (Python)

If you're using `ib_insync` in your Python bot, here's how to extract the data:

```python
from ib_insync import IB

ib = IB()
ib.connect('127.0.0.1', 7497, clientId=1)

# Get account summary
account_values = ib.accountValues()
account_summary = ib.accountSummary()

# Extract values
def get_account_value(tag):
    for av in account_values:
        if av.tag == tag:
            return float(av.value)
    return 0.0

# Get positions
positions = ib.positions()

# Build account data
account_data = {
    'totalBalance': get_account_value('NetLiquidation'),
    'netLiquidation': get_account_value('NetLiquidation'),
    'buyingPower': get_account_value('BuyingPower'),
    'cashBalance': get_account_value('TotalCashValue'),
    'openPositionsCount': len(positions),
    'closedPositionsCount': 0,  # You'll need to track this
    'dailyProfit': get_account_value('UnrealizedPnL'),  # Or calculate from trades
    'dailyProfitPercent': 0.0,  # Calculate based on previous balance
    'totalProfit': 0.0,  # Calculate from account history
    'totalProfitPercent': 0.0,  # Calculate
    'currency': 'USD',  # Get from account summary
    'lastUpdate': datetime.now().isoformat(),
}

# Build positions data
positions_data = []
for pos in positions:
    contract = pos.contract
    market_price = ib.reqMktData(contract).marketPrice()
    
    positions_data.append({
        'symbol': contract.symbol,
        'quantity': pos.position,
        'avgPrice': pos.avgCost / pos.position if pos.position != 0 else 0,
        'currentPrice': market_price,
        'marketValue': pos.marketValue,
        'unrealizedPnl': pos.unrealizedPNL,
        'unrealizedPnlPercent': (pos.unrealizedPNL / pos.avgCost * 100) if pos.avgCost != 0 else 0,
    })
```

### Option 2: Key IBKR Account Value Tags

Here are the most important IBKR account value tags you'll need:

**Essential Tags:**
- `NetLiquidation` - Net liquidation value (total account value)
- `TotalCashValue` - Total cash value
- `BuyingPower` - Available buying power
- `CashBalance` - Cash balance
- `UnrealizedPnL` - Unrealized profit/loss
- `RealizedPnL` - Realized profit/loss
- `DayTrades` - Day trading buying power

**Additional Useful Tags:**
- `GrossPositionValue` - Total position value
- `ExcessLiquidity` - Excess liquidity
- `FullInitMarginReq` - Initial margin requirement
- `FullMaintMarginReq` - Maintenance margin requirement

### Option 3: Position Information

From `ib.positions()`, each position object contains:
- `contract` - Contract details (symbol, exchange, etc.)
- `position` - Number of shares (positive = long, negative = short)
- `avgCost` - Average cost basis
- `marketPrice` - Current market price
- `marketValue` - Current market value
- `unrealizedPNL` - Unrealized profit/loss

## Integration Steps

1. **Decide on integration method:**
   - Python bot API endpoint (recommended)
   - File-based (bot writes JSON file)
   - Direct Node.js integration (more complex)

2. **Extract the data** from IBKR using one of the methods above

3. **Map the data** to the expected format (see examples above)

4. **Update server.js** to use your data source instead of mock data

5. **Test** by clicking the refresh button in the dashboard

## Example: File-Based Integration

If your Python bot writes to a file, create `account_data.json`:

```json
{
  "totalBalance": 125000.50,
  "netLiquidation": 125000.50,
  "buyingPower": 50000.00,
  "cashBalance": 75000.00,
  "openPositionsCount": 8,
  "closedPositionsCount": 0,
  "dailyProfit": 1250.25,
  "dailyProfitPercent": 1.01,
  "totalProfit": 15250.75,
  "totalProfitPercent": 13.88,
  "currency": "USD",
  "lastUpdate": "2024-01-05T10:30:00.000Z"
}
```

And `positions_data.json`:

```json
{
  "positions": [
    {
      "symbol": "AAPL",
      "quantity": 100,
      "avgPrice": 150.25,
      "currentPrice": 175.50,
      "marketValue": 17550.00,
      "unrealizedPnl": 2525.00,
      "unrealizedPnlPercent": 16.81
    }
  ]
}
```

Then update `server.js` to read from these files.

## Questions to Answer

To help you integrate, please let me know:

1. **How do you currently connect to IBKR?**
   - Using ib_insync?
   - Using IB Gateway or TWS?
   - What port?

2. **How do you want to provide the data?**
   - Python bot with HTTP API?
   - File-based (bot writes JSON)?
   - Direct integration?

3. **What data can you already access?**
   - Can you get account values?
   - Can you get positions?
   - Can you calculate daily profit?

Once you provide this information, I can help you set up the exact integration!

