import { config } from 'dotenv';
import { Config } from '../types';

// Load environment variables
config();

export const botConfig: Config = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  devGuildId: process.env.DEV_GUILD_ID || '',
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID,
};

console.log(botConfig);

// Validate required environment variables
export function validateConfig(): void {
  const requiredVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID', 'GOOGLE_CALENDAR_ID'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
