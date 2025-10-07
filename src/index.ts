import { createClient } from './client';
import { loadEvents } from './utils/eventHandler';
import { loadCommands } from './utils/commandHandler';
import { botConfig, validateConfig } from './utils/config';
import { startKeepAlive } from './utils/keepAlive';
import express, { Request, Response } from 'express';

// Global state to track bot readiness
let isBotReady = false;
let botStartTime = Date.now();

// Export functions to manage bot state
export function setBotReady(ready: boolean) {
  isBotReady = ready;
}

export function getBotReady(): boolean {
  return isBotReady;
}

export function getBotStartTime(): number {
  return botStartTime;
}

async function main(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    
    // Create Discord client
    const client = createClient();
    
    // Load events and commands
    await loadEvents(client);
    await loadCommands(client);
    
    // Login to Discord
    await client.login(botConfig.token);
    
    console.log('🚀 Bot is starting up...');

    // HTTP keep-alive server (useful for platforms like Render)
    const app = express();
    app.get('/', (_req: Request, res: Response) => res.send('OK'));
    
    // Health check endpoint to monitor bot status
    app.get('/status', (_req: Request, res: Response) => {
      const uptime = Date.now() - botStartTime;
      res.json({
        status: isBotReady ? 'ready' : 'starting',
        uptime: uptime,
        ready: isBotReady,
        timestamp: new Date().toISOString()
      });
    });
    
    const PORT = process.env.PORT || '3000';
    const portNumber = Number(PORT) || 3000;
    app.listen(portNumber, '0.0.0.0', () => {
      console.log(`HTTP server listening on ${portNumber}`);
      
      // Start keep-alive mechanism after a short delay
      setTimeout(() => {
        startKeepAlive();
      }, 5000); // Start after 5 seconds
    });
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Start the bot
main();
