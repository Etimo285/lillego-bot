import { Event } from '../types';
import { setBotReady } from '../index';

export const ready: Event = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot is ready! Logged in as ${client.user?.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
    console.log(`👥 Serving ${client.users.cache.size} users`);
    
    // Mark bot as ready for command processing
    setBotReady(true);
    console.log('🟢 Bot is now ready to process commands');
  }
};
