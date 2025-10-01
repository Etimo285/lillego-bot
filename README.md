# Lillego Bot

A Discord bot built with TypeScript and Discord.js v14.

## Features

- 🚀 TypeScript support with full type safety
- 📁 Clean, organized folder structure
- ⚡ Slash commands support
- 🎯 Event-driven architecture
- 🔧 Easy command and event management
- 📊 Built-in ping and info commands
- 📅 Google Calendar integration with `/agenda` command

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
   Create a `.env` file and fill in your bot credentials:
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
   DEV_GUILD_ID=your_development_guild_id_here
   PREFIX=!
   
   # Google Calendar API Configuration (for /agenda command)
   GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com
   ```

3. **Set up Google Calendar API (for /agenda command):**
   
   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   
   b. Create a new project or select an existing one
   
   c. Enable the Google Calendar API:
      - Go to "APIs & Services" > "Library"
      - Search for "Google Calendar API"
      - Click "Enable"
   
   d. Create a Service Account:
      - Go to "APIs & Services" > "Credentials"
      - Click "Create Credentials" > "Service Account"
      - Fill in the service account details
      - Click "Create and Continue"
   
   e. Generate a private key:
      - Click on your service account
      - Go to "Keys" tab
      - Click "Add Key" > "Create new key"
      - Choose "JSON" format and download the key file
   
   f. Share your calendar with the service account:
      - Open Google Calendar
      - Go to calendar settings
      - Add the service account email to "Share with specific people"
      - Give it "See all event details" permission
   
   g. Extract credentials from the JSON file:
      - Copy the `client_email` value to `GOOGLE_CLIENT_EMAIL`
      - Copy the `private_key` value to `GOOGLE_PRIVATE_KEY`
      - **Important**: The private key should include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers
      - Make sure to preserve the `\n` characters in the private key (they represent line breaks)
   
   **Alternative Method (Recommended)**: Instead of using environment variables, you can place the entire JSON file in your project:
      - Rename the downloaded JSON file to `service-account.json`
      - Place it in your project root directory
      - Add `service-account.json` to your `.gitignore` file
      - The bot will automatically use this file if it exists

4. **Deploy slash commands:**
   ```bash
   npm run deploy
   ```

5. **Start the bot:**
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

## Commands

### `/agenda` - Google Calendar Integration
Retrieve upcoming events from Google Calendar with various options:

- `calendar_id` (optional): Google Calendar ID (default: primary)
- `max_results` (optional): Maximum number of events (1-25, default: 10)
- `time_min` (optional): Start time in ISO format (default: now)
- `time_max` (optional): End time in ISO format (default: 7 days from now)

**Examples:**
- `/agenda` - Get next 10 events from primary calendar
- `/agenda calendar_id:my-calendar@gmail.com max_results:5` - Get 5 events from specific calendar
- `/agenda time_min:2024-01-01T00:00:00Z time_max:2024-01-31T23:59:59Z` - Get events for January 2024

## Troubleshooting

### Google Calendar API Issues

**Error: `error:1E08010C:DECODER routines::unsupported`**
This error typically occurs when the private key format is incorrect. Make sure:

1. The private key includes the full key with proper markers:
   ```
   -----BEGIN PRIVATE KEY-----
   [your actual private key content]
   -----END PRIVATE KEY-----
   ```

2. The `\n` characters are preserved in your `.env` file (they represent line breaks)

3. The private key is properly quoted in your `.env` file:
   ```env
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```

**Error: `Calendar not found`**
- Make sure you've shared your calendar with the service account email
- Verify the `GOOGLE_CALENDAR_ID` is correct (usually your email address for primary calendar)

## Requirements

- Node.js 16.9.0 or higher
- Discord Bot Token
- Discord Application Client ID
- Google Cloud Project with Calendar API enabled (for `/agenda` command)
