import { createClient } from './client';
import { loadEvents } from './utils/eventHandler';
import { loadCommands } from './utils/commandHandler';
import { botConfig, validateConfig } from './utils/config';

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
