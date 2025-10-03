import { REST, Routes } from 'discord.js';
import { botConfig, validateConfig } from './utils/config';

async function clearCommands(): Promise<void> {
  try {
    validateConfig();
    
    const rest = new REST().setToken(botConfig.token);
    
    console.log('🧹 Started clearing application (/) commands...');
    
    if (botConfig.guildId) {
      // Clear guild commands (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId),
        { body: [] }
      );

      // Clear dev guild commands
      await rest.put(
        Routes.applicationGuildCommands(botConfig.clientId, botConfig.devGuildId),
        { body: [] }
      );
      
      console.log('✅ Successfully cleared guild application (/) commands.');
    } else {
      // Clear global commands (takes up to 1 hour to propagate)
      await rest.put(
        Routes.applicationCommands(botConfig.clientId),
        { body: [] }
      );
      
      console.log('✅ Successfully cleared global application (/) commands.');
    }
  } catch (error) {
    console.error('Error clearing commands:', error);
  }
}

clearCommands();
