# Lillego Bot

A Discord bot built with TypeScript and Discord.js v14.

## Features

- 🚀 TypeScript support with full type safety
- 📁 Clean, organized folder structure
- ⚡ Slash commands support
- 🎯 Event-driven architecture
- 🔧 Easy command and event management
- 📊 Built-in ping and info commands

## Project Structure

```
src/
├── commands/           # Slash commands
│   └── general/       # General commands
├── events/            # Discord events
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── client.ts          # Discord client setup
├── index.ts           # Main entry point
└── deploy-commands.ts # Command deployment script
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   Copy `env.example` to `.env` and fill in your bot credentials:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
   PREFIX=!
   ```

3. **Deploy slash commands:**
   ```bash
   npm run deploy
   ```

4. **Start the bot:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## Available Scripts

- `npm run dev` - Start bot in development mode with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the compiled bot
- `npm run watch` - Watch mode for TypeScript compilation
- `npm run deploy` - Deploy slash commands to Discord

## Creating Commands

1. Create a new file in `src/commands/[category]/[command-name].ts`
2. Export a command object with `data` and `execute` properties
3. Run `npm run deploy` to register the command
4. Restart the bot

Example command:
```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types';

export const example: Command = {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('An example command'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply('Hello from example command!');
  }
};
```

## Creating Events

1. Create a new file in `src/events/[event-name].ts`
2. Export an event object with `name` and `execute` properties
3. Restart the bot

Example event:
```typescript
import { Event } from '../types';

export const example: Event = {
  name: 'messageCreate',
  async execute(message) {
    console.log(`New message: ${message.content}`);
  }
};
```

## Requirements

- Node.js 16.9.0 or higher
- Discord Bot Token
- Discord Application Client ID
