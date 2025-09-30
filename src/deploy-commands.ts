import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { botConfig, validateConfig } from './utils/config';
import { Command } from './types';

async function deployCommands(): Promise<void> {
  try {
    validateConfig();
    
    const commands: any[] = [];
    const commandsPath = join(__dirname, 'commands');
    
    // Load all commands
    const commandFolders = readdirSync(commandsPath);
    
    for (const folder of commandFolders) {
      const commandPath = join(commandsPath, folder);
      const commandFiles = readdirSync(commandPath).filter(file => file.endsWith('.ts'));
      
      for (const file of commandFiles) {
        const filePath = join(commandPath, file);
        const command: Command = await import(filePath);
        
        if ('data' in command && 'execute' in command) {
          commands.push(command.data.toJSON());
          console.log(`✅ Loaded command: ${command.data.name}`);
        }
      }
    }
    
    // Deploy commands
    const rest = new REST().setToken(botConfig.token);
    
    console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);
    
    if (botConfig.guildId) {
      // Deploy to specific guild (faster for development)
      const data = await rest.put(
        Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId),
        { body: commands }
      ) as any[];
      
      console.log(`✅ Successfully reloaded ${data.length} guild application (/) commands.`);
    } else {
      // Deploy globally (takes up to 1 hour to propagate)
      const data = await rest.put(
        Routes.applicationCommands(botConfig.clientId),
        { body: commands }
      ) as any[];
      
      console.log(`✅ Successfully reloaded ${data.length} global application (/) commands.`);
    }
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
}

deployCommands();
