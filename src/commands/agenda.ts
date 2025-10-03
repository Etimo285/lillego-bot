import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { GoogleCalendarService, CalendarEvent, formatEventDescription, getAgendaTimeInfo, getAgendaLocationInfo } from '../utils/calendarService';

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
    
    const weekLabel = weekOffset === 0 
      ? `Semaine du ${startDay} ${startMonth} (actuelle)`
      : weekOffset === 1 
        ? `Semaine du ${startDay} ${startMonth} (prochaine)`
        : `Semaine du ${startDay} ${startMonth}`;
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
      const calendarService = new GoogleCalendarService();
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

      const events = await calendarService.getEvents(timeMin, timeMax);

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
        const timeInfo = getAgendaTimeInfo(event);
        const location = getAgendaLocationInfo(event);
        
        let description = event.description || '';
        description = formatEventDescription(description);
        description = description.length > 300 ? description.substring(0, 300) + '...' : description;

        embed.addFields({
          name: `🔸 ${event.summary || 'Événement sans titre'}`,
          value: [
            timeInfo,
            location,
            description ? `📝 ${description}` : ''
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

