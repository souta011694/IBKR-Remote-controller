# Trading Bot Manager

A beautiful, user-friendly web interface for controlling your Python trading bot. This full-stack application provides an intuitive dashboard to start, stop, and monitor your bot with a modern Material-UI design.

## Features

- 🤖 **Bot Control**: Easy start/stop toggle with visual status indicators
- 📊 **Dashboard**: Real-time bot status and information
- ⚙️ **Settings**: Configure bot path and Python executable
- 🎨 **Modern UI**: Clean, responsive Material-UI interface

## Tech Stack

- **Frontend**: React 18 with Material-UI
- **Backend**: Node.js with Express
- **Bot Integration**: Python process management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Python (for your trading bot)

### Installation

1. Install all dependencies:
```bash
npm run install-all
```

2. Set up environment variables (optional):
```bash
cd server
cp env.example .env
# Edit .env with your bot configuration
```

3. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

## Configuration

### Environment Variables

Create a `server/.env` file with:

```env
PORT=5000
BOT_PATH=bot.py              # Path to your Python bot script
PYTHON_CMD=python            # Python command (python or python3)
BOT_DIR=.                    # Working directory for the bot
```

### Using the UI

1. **Start/Stop Bot**: Use the large toggle switch or button on the Dashboard
2. **Configure Settings**: Go to Settings page to set bot path and Python command
3. **Monitor Status**: The dashboard automatically updates bot status every 5 seconds

## Project Structure

```
.
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js    # Main bot control dashboard
│   │   │   ├── Settings.js     # Bot configuration
│   │   │   └── Layout.js       # Navigation layout
│   │   └── App.js
│   └── public/
├── server/              # Express backend server
│   ├── server.js        # API endpoints for bot control
│   └── .env             # Environment variables
└── package.json
```

## API Endpoints

- `GET /api/bot/status` - Get current bot status
- `POST /api/bot/start` - Start the bot
- `POST /api/bot/stop` - Stop the bot

## How It Works

1. The backend spawns your Python bot as a child process
2. The frontend polls the status endpoint every 5 seconds
3. Start/stop commands control the bot process lifecycle
4. Status is displayed with visual indicators (running/stopped)

## License

MIT

