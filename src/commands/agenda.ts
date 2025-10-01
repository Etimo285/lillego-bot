import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { google } from 'googleapis';
import { botConfig } from '../utils/config';
import { existsSync } from 'fs';
import { join } from 'path';

export const agenda: Command = {
  data: (() => {
    const builder = new SlashCommandBuilder()
      .setName('agenda')
      .setDescription('Retrieve upcoming events from Google Calendar')
      .addIntegerOption(option =>
        option
          .setName('max_results')
          .setDescription('Maximum number of events to retrieve (default: 10)')
          .setMinValue(1)
          .setMaxValue(25)
          .setRequired(false)
      )
      .addStringOption(option =>
        option
          .setName('time_min')
          .setDescription('Start time for events (ISO format, default: now)')
          .setRequired(false)
      )
      .addStringOption(option =>
        option
          .setName('time_max')
          .setDescription('End time for events (ISO format, default: 7 days from now)')
          .setRequired(false)
      );
    return builder as SlashCommandBuilder;
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      // Get command options
      const calendarId = botConfig.googleCalendarId;
      const maxResults = interaction.options.getInteger('max_results') || 10;
      const timeMin = interaction.options.getString('time_min') || new Date().toISOString();
      const timeMax = interaction.options.getString('time_max') || 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Initialize Google Calendar API
      let auth;
      
      // Check if service account JSON file exists (preferred method)
      const serviceAccountPath = join(process.cwd(), 'service-account.json');
      if (existsSync(serviceAccountPath)) {
        console.log('Using service account JSON file for authentication');
        auth = new google.auth.GoogleAuth({
          keyFile: serviceAccountPath,
          scopes: ['https://www.googleapis.com/auth/calendar.readonly']
        });
      } else if (botConfig.googleClientEmail && botConfig.googlePrivateKey) {
        console.log('Using environment variables for authentication');
        // Create a complete service account credentials object
        const serviceAccountCredentials = {
          type: 'service_account',
          project_id: 'lillego-bot',
          private_key_id: 'temp-key-id',
          private_key: botConfig.googlePrivateKey.replace(/\\n/g, '\n'),
          client_email: botConfig.googleClientEmail,
          client_id: 'temp-client-id',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(botConfig.googleClientEmail)}`
        };

        auth = new google.auth.GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
          credentials: serviceAccountCredentials
        });
      } else {
        throw new Error('Google Calendar API credentials not configured. Please either:\n1. Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables, or\n2. Place a service-account.json file in your project root');
      }

      const calendar = google.calendar({ version: 'v3', auth });

      // Fetch events from Google Calendar
      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin,
        timeMax: timeMax,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      if (events.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('📅 Calendar - No Events Found')
          .setDescription('No upcoming events found in the specified time range.')
          .setColor(0xFFA500)
          .setTimestamp()
          .setFooter({ text: 'Google Calendar API' });

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Create embed with events
      const embed = new EmbedBuilder()
        .setTitle(`📅 Calendar - Upcoming Events (${events.length})`)
        .setDescription(`Events from **${calendarId}** calendar`)
        .setColor(0x4285F4)
        .setTimestamp()
        .setFooter({ text: 'Google Calendar API' });

      // Add events to embed
      events.forEach((event, index) => {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;
        
        let timeInfo = '';
        if (start) {
          const startDate = new Date(start);
          if (event.start?.dateTime) {
            // All-day event
            timeInfo = `📅 **${startDate.toLocaleDateString()}** at **${startDate.toLocaleTimeString()}**`;
          } else {
            // Date-only event
            timeInfo = `📅 **${startDate.toLocaleDateString()}** (All day)`;
          }
        }

        const location = event.location ? `📍 ${event.location}` : '';
        const description = event.description ? 
          event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '') : '';

        embed.addFields({
          name: `${index + 1}. ${event.summary || 'Untitled Event'}`,
          value: [
            timeInfo,
            location,
            description ? `📝 ${description}` : '',
            event.htmlLink ? `🔗 [View in Calendar](${event.htmlLink})` : ''
          ].filter(Boolean).join('\n'),
          inline: false
        });
      });

      // Add time range info
      embed.addFields({
        name: '📊 Search Parameters',
        value: [
          `**Calendar:** ${calendarId}`,
          `**From:** ${new Date(timeMin).toLocaleString()}`,
          `**To:** ${new Date(timeMax).toLocaleString()}`,
          `**Max Results:** ${maxResults}`
        ].join('\n'),
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching calendar events:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Calendar Error')
        .setDescription('Failed to retrieve calendar events. Please check your Google Calendar API configuration.')
        .setColor(0xFF0000)
        .setTimestamp()
        .setFooter({ text: 'Google Calendar API' });

      if (error instanceof Error) {
        errorEmbed.addFields({
          name: 'Error Details',
          value: `\`\`\`${error.message}\`\`\``,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};

