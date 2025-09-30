import { readdirSync } from 'fs';
import { join } from 'path';
import { ExtendedClient, Command } from '../types';

export async function loadCommands(client: ExtendedClient): Promise<void> {
  const commandsPath = join(__dirname, '../commands');
  
  try {
    const commandFolders = readdirSync(commandsPath);
    
    for (const folder of commandFolders) {
      const commandPath = join(commandsPath, folder);
      const commandFiles = readdirSync(commandPath).filter(file => file.endsWith('.ts'));
      
      for (const file of commandFiles) {
        const filePath = join(commandPath, file);
        const command: Command = await import(filePath);
        
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
          console.log(`⚠️  The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      }
    }
  } catch (error) {
    console.error('Error loading commands:', error);
  }
}
