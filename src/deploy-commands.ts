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
    const commandFiles = readdirSync(commandsPath).filter(file => 
      file.endsWith('.js') && !file.endsWith('.d.ts')
    );
    
    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const commandModule = await import(filePath);
      
      // Get the command from the module (handle both default and named exports)
      const command: Command = commandModule.default || commandModule[Object.keys(commandModule)[0]];
      
      if (command && 'data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
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

      // Deploy to dev guild
      await rest.put(
        Routes.applicationGuildCommands(botConfig.clientId, botConfig.devGuildId),
        { body: commands }
      );
      
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
