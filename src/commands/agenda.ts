import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { google } from 'googleapis';
import { botConfig } from '../utils/config';
import { existsSync } from 'fs';
import { join } from 'path';

// Function to generate week options
function generateWeekOptions() {
  const now = new Date();
  const options = [];
  
  // French day names
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  // Get Monday of current week
  const currentMonday = new Date(now);
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
  currentMonday.setDate(now.getDate() + daysToMonday);
  
  // Generate 5 weeks (current + next 4)
  for (let weekOffset = 0; weekOffset < 5; weekOffset++) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() + (weekOffset * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startDay = weekStart.getDate();
    const startMonth = monthNames[weekStart.getMonth()];
    const endDay = weekEnd.getDate();
    const endMonth = monthNames[weekEnd.getMonth()];
    
    const weekLabel = `Semaine du ${startDay} ${startMonth}`;
    const weekValue = `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`;
    
    let description = '';
    if (weekOffset === 0) {
      description = 'Semaine actuelle';
    } else if (weekOffset === 1) {
      description = 'Semaine prochaine';
    } else {
      description = `Dans ${weekOffset} semaines`;
    }
    
    options.push({
      name: weekLabel,
      value: weekValue,
      description: description
    });
  }
  
  return options;
}

export const agenda: Command = {
  data: (() => {
    const builder = new SlashCommandBuilder()
      .setName('agenda')
      .setDescription('Récupère les événements à venir depuis Google Calendar');
    
    // Generate week options dynamically
    const weekOptions = generateWeekOptions();
    const choices = weekOptions.map(option => ({
      name: option.name,
      value: option.value
    }));
    
    builder.addStringOption(option =>
      option
        .setName('semaine')
        .setDescription('Choisissez la semaine à afficher')
        .setRequired(false)
        .addChoices(...choices)
    );
    
    return builder as SlashCommandBuilder;
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      // Get command options
      const calendarId = botConfig.googleCalendarId;
      const selectedWeek = interaction.options.getString('semaine');
      
      let timeMin: string;
      let timeMax: string;
      
      if (selectedWeek) {
        // Parse the selected week (format: "YYYY-MM-DD_YYYY-MM-DD")
        const [startDate, endDate] = selectedWeek.split('_');
        timeMin = `${startDate}T00:00:00.000Z`;
        timeMax = `${endDate}T23:59:59.999Z`;
      } else {
        // Default to current week if no week selected
        const now = new Date();
        const currentMonday = new Date(now);
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        currentMonday.setDate(now.getDate() + daysToMonday);
        
        const weekEnd = new Date(currentMonday);
        weekEnd.setDate(currentMonday.getDate() + 6);
        
        timeMin = `${currentMonday.toISOString().split('T')[0]}T00:00:00.000Z`;
        timeMax = `${weekEnd.toISOString().split('T')[0]}T23:59:59.999Z`;
      }

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

      if (events.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('📅 Agenda - Aucun événement trouvé')
          .setDescription('Aucun événement à venir trouvé dans la période spécifiée.')
          .setColor(0xFFA500)
          .setTimestamp()
          .setFooter({ text: 'Google Calendar API' });

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Create embed with events
      const embed = new EmbedBuilder()
        .setTitle(`📅 Agenda - Événements à venir (${events.length})`)
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
            // Event with time
            timeInfo = `📅 **${startDate.toLocaleDateString('fr-FR')}** à **${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}**`;
          } else {
            // All-day event
            timeInfo = `📅 **${startDate.toLocaleDateString('fr-FR')}** (Toute la journée)`;
          }
        }

        let location = '';
        if (event.location) {
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
          location = `📍 ${event.location} | [🗺️ Voir sur Google Maps](${mapsUrl})`;
        }
        
        let description = event.description || '';
        
        // Convert HTML tags to Discord-friendly format
        description = description
          .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> tags to newlines
          .replace(/<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi, '[$2]($1)')  // Convert <a> tags to Discord links
          .replace(/<[^>]+>/g, '')  // Remove any remaining HTML tags
          .trim();
        
        description = description.length > 100 ? description.substring(0, 100) + '...' : description;

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
        .setTitle('❌ Erreur Agenda')
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

