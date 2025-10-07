import { createClient } from './client';
import { loadEvents } from './utils/eventHandler';
import { loadCommands } from './utils/commandHandler';
import { botConfig, validateConfig } from './utils/config';
import express, { Request, Response } from 'express';

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
    const PORT = process.env.PORT || '3000';
    const portNumber = Number(PORT) || 3000;
    app.listen(portNumber, '0.0.0.0', () => {
      console.log(`HTTP server listening on ${portNumber}`);
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
