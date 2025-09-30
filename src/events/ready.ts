import { Event } from '../types';

export const ready: Event = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot is ready! Logged in as ${client.user?.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
    console.log(`👥 Serving ${client.users.cache.size} users`);
  }
};
