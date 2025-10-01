import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { google } from 'googleapis';
import { botConfig } from '../utils/config';
import { existsSync } from 'fs';
import { join } from 'path';

export const jeudi: Command = {
  data: new SlashCommandBuilder()
    .setName('jeudi')
    .setDescription('Affiche les événements du prochain jeudi'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      // Get command options
      const calendarId = botConfig.googleCalendarId;
      
      // Calculate next Thursday
      const now = new Date();
      const nextThursday = new Date(now);
      const dayOfWeek = now.getDay();
      
      // Thursday is day 4 (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, etc.)
      const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
      if (daysUntilThursday === 0 && now.getHours() >= 23) {
        // If it's Thursday but late in the day, get next Thursday
        nextThursday.setDate(now.getDate() + 7);
      } else {
        nextThursday.setDate(now.getDate() + daysUntilThursday);
      }
      
      // Set time range for the entire day
      const timeMin = `${nextThursday.toISOString().split('T')[0]}T00:00:00.000Z`;
      const timeMax = `${nextThursday.toISOString().split('T')[0]}T23:59:59.999Z`;

      // Initialize Google Calendar API
      let auth;
      
      // Check if service account JSON file exists (preferred method)
      const serviceAccountPath = join(process.cwd(), 'service-account.json');
      
      if (existsSync(serviceAccountPath)) {
        // Read and validate the service account file
        const fs = require('fs');
        const serviceAccountData = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        
        if (serviceAccountData.type === 'service_account') {
          auth = new google.auth.GoogleAuth({
            keyFile: serviceAccountPath,
            scopes: ['https://www.googleapis.com/auth/calendar.readonly']
          });
        } else {
          throw new Error('Fichier de compte de service invalide. Veuillez télécharger le bon fichier JSON depuis Google Cloud Console.');
        }
      } else if (botConfig.googleClientEmail && botConfig.googlePrivateKey) {
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
        throw new Error('Configuration de l\'API Google Calendar manquante. Veuillez configurer les identifiants.');
      }

      const calendar = google.calendar({ version: 'v3', auth });

      // Fetch events from Google Calendar
      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      // Format the date for display
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      const displayDate = `${nextThursday.getDate()} ${monthNames[nextThursday.getMonth()]}`;

      if (events.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle(`📅 Jeudi ${displayDate} - Aucun événement`)
          .setDescription('Aucun événement prévu pour ce jeudi.')
          .setColor(0xFFA500)
          .setTimestamp()
          .setFooter({ text: 'Google Calendar API' });

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Create embed with events
      const embed = new EmbedBuilder()
        .setTitle(`📅 Jeudi ${displayDate} - ${events.length} événement${events.length > 1 ? 's' : ''}`)
        .setColor(0x4285F4)
        .setTimestamp()
        .setFooter({ text: 'Google Calendar API' });

      // Add events to embed
      events.forEach((event, index) => {
        const start = event.start?.dateTime || event.start?.date;
        
        let timeInfo = '';
        if (start) {
          const startDate = new Date(start);
          if (event.start?.dateTime) {
            // Event with time
            timeInfo = `🕐 **${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}**`;
          } else {
            // All-day event
            timeInfo = `📅 **Toute la journée**`;
          }
        }

        const location = event.location ? `📍 ${event.location}` : '';
        const description = event.description ? 
          event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '') : '';

        embed.addFields({
          name: `${index + 1}. ${event.summary || 'Événement sans titre'}`,
          value: [
            timeInfo,
            location,
            description ? `📝 ${description}` : '',
            event.htmlLink ? `🔗 [Voir dans le calendrier](${event.htmlLink})` : ''
          ].filter(Boolean).join('\n'),
          inline: false
        });
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching calendar events:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Erreur Jeudi')
        .setDescription('Impossible de récupérer les événements du calendrier. Veuillez vérifier votre configuration Google Calendar.')
        .setColor(0xFF0000)
        .setTimestamp()
        .setFooter({ text: 'Google Calendar API' });

      if (error instanceof Error) {
        // Translate common error messages to French
        let errorMessage = error.message;
        if (error.message.includes('private_key and client_email are required')) {
          errorMessage = 'Identifiants Google Calendar manquants. Veuillez configurer le fichier service-account.json.';
        } else if (error.message.includes('Invalid service account file')) {
          errorMessage = 'Fichier de compte de service invalide. Veuillez télécharger le bon fichier JSON depuis Google Cloud Console.';
        } else if (error.message.includes('Configuration de l\'API Google Calendar manquante')) {
          errorMessage = 'Configuration de l\'API Google Calendar manquante. Veuillez configurer les identifiants.';
        }
        
        errorEmbed.addFields({
          name: 'Détails de l\'erreur',
          value: `\`\`\`${errorMessage}\`\`\``,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
