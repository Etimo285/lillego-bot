import { readdirSync } from 'fs';
import { join } from 'path';
import { ExtendedClient, Event } from '../types';

export async function loadEvents(client: ExtendedClient): Promise<void> {
  const eventsPath = join(__dirname, '../events');
  
  try {
    const eventFiles = readdirSync(eventsPath).filter(file => 
      file.endsWith('.js') && 
      !file.endsWith('.d.ts') && 
      !file.toLowerCase().includes('temp') &&
      !file.toLowerCase().includes('tmp')
    );
    
    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);
      
      try {
        // Use require instead of dynamic import to avoid ESM issues
        const eventModule = require(filePath);
        
        // Get the event from the module (handle both default and named exports)
        const event: Event = eventModule.default || eventModule[Object.keys(eventModule)[0]];
        
        if (event && event.name && event.execute) {
          if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
          } else {
            client.on(event.name, (...args) => event.execute(...args));
          }
          
          console.log(`✅ Loaded event: ${event.name}`);
        } else {
          console.log(`⚠️  Invalid event structure in ${file}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load event from ${filePath}:`, error);
      }
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
}
