# Lillego Bot - Cold Start Solution

This Discord bot is deployed on Render's free tier, which has a cold start delay of approximately 50 seconds when the bot is asleep. This solution implements a comprehensive cold start handling system.

## Features

### 🔄 Cold Start Detection
- Automatically detects when the bot is in cold start mode (first 60 seconds after startup)
- Tracks bot readiness state throughout the application lifecycle

### ⚡ Immediate User Feedback
- Provides instant response to users when cold start is detected
- Shows informative messages in French explaining the situation
- Uses Discord embeds for better visual feedback

### ⏳ Smart Waiting Mechanism
- Waits up to 60 seconds for the bot to become ready
- Checks bot status every second during the waiting period
- Handles timeout scenarios gracefully

### 💓 Keep-Alive System
- Automatically pings the health endpoint every 10 minutes
- Helps prevent the bot from going to sleep too quickly
- Configurable via environment variables

### 📊 Health Monitoring
- Added `/status` endpoint for monitoring bot health
- Provides uptime, readiness status, and timestamp information
- Useful for debugging and monitoring

## How It Works

1. **Bot Startup**: When the bot starts, it's marked as "not ready"
2. **Command Received**: When a user runs a command during cold start:
   - Bot immediately responds with a "starting up" message
   - Waits for the bot to become ready (up to 60 seconds)
   - Updates the message when ready and executes the command
3. **Keep-Alive**: Every 10 minutes, the bot pings itself to stay awake
4. **Health Check**: The `/status` endpoint provides real-time bot status

## Environment Variables

- `HEALTH_CHECK_URL`: URL for keep-alive pings (defaults to `https://lillego-bot.onrender.com/status`)
- `PORT`: Port for the HTTP server (defaults to 3000)

## User Experience

When a user runs a command during cold start:

1. **Immediate Response**: "🔄 Bot en cours de démarrage..."
2. **Waiting Period**: Bot waits for activation (up to 50 seconds)
3. **Ready Confirmation**: "✅ Bot prêt!" 
4. **Command Execution**: Original command runs normally

If timeout occurs:
- **Timeout Message**: "⏰ Timeout - Le bot met trop de temps à démarrer"

## Technical Implementation

- **Command Wrapping**: All commands are automatically wrapped with cold start handling
- **State Management**: Global state tracks bot readiness and startup time
- **Error Handling**: Comprehensive error handling for all cold start scenarios
- **TypeScript**: Fully typed implementation for better maintainability

## Deployment

The solution works seamlessly with Render's free tier:
- No additional configuration required
- Automatic detection of cold start scenarios
- Graceful handling of timeouts and errors
- Maintains existing bot functionality

## Monitoring

Check bot status at: `https://lillego-bot.onrender.com/status`

Response format:
```json
{
  "status": "ready|starting",
  "uptime": 12345,
  "ready": true|false,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
