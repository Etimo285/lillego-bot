import { readdirSync } from 'fs';
import { join } from 'path';
import { ExtendedClient, Command } from '../types';
import { wrapCommandWithColdStartHandling } from './coldStartHandler';

export async function loadCommands(client: ExtendedClient): Promise<void> {
  const commandsPath = join(__dirname, '../commands');
  
  try {
    const commandFiles = readdirSync(commandsPath).filter(file => 
      file.endsWith('.js') && 
      !file.endsWith('.d.ts') && 
      !file.toLowerCase().includes('temp') &&
      !file.toLowerCase().includes('tmp')
    );
    
    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      
      try {
        // Use require instead of dynamic import to avoid ESM issues
        const commandModule = require(filePath);
        
        // Get the command from the module (handle both default and named exports)
        const command: Command = commandModule.default || commandModule[Object.keys(commandModule)[0]];
        
        if (command && 'data' in command && 'execute' in command) {
          // Wrap command with cold start handling
          const wrappedCommand = wrapCommandWithColdStartHandling(command);
          client.commands.set(wrappedCommand.data.name, wrappedCommand);
          console.log(`✅ Loaded command with cold start handling: ${command.data.name}`);
        } else {
          console.log(`⚠️  The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      } catch (error) {
        console.error(`❌ Failed to load command from ${filePath}:`, error);
      }
    }
  } catch (error) {
    console.error('Error loading commands:', error);
  }
}
