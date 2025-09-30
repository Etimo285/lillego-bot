import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { ExtendedClient, Command } from './types';

export function createClient(): ExtendedClient {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages
    ]
  }) as ExtendedClient;

  // Initialize commands collection
  client.commands = new Collection<string, Command>();

  return client;
}
