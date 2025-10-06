import { Client, Collection, SlashCommandBuilder } from 'discord.js';

// Command interface
export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: any) => Promise<void>;
}

// Event interface
export interface Event {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => Promise<void>;
}

// Extended Client interface
export interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
}

// Configuration interface
export interface Config {
  token: string;
  clientId: string;
  guildId: string;
  devGuildId: string;
  prefix: string;
  googleCalendarId?: string;
}
