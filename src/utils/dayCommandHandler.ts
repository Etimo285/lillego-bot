import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { basename } from 'path';
import { GoogleCalendarService, CalendarEvent, getTimeInfo, getLocationInfo, formatEventDescription } from '../utils/calendarService';

export interface DayCommandConfig {
  dayName: string;
  dayNumber: number; // 0=Sunday, 1=Monday, 2=Tuesday, etc.
  thumbnailPath?: string; // local file path for embed thumbnail
  thumbnailName?: string; // optional explicit filename for attachment
}

export class DayCommandHandler {
  private calendarService: GoogleCalendarService;
  private config: DayCommandConfig;

  constructor(config: DayCommandConfig) {
    this.calendarService = new GoogleCalendarService();
    this.config = config;
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const targetDate = this.calculateTargetDate();
      const timeMin = `${targetDate.toISOString().split('T')[0]}T00:00:00.000Z`;
      const timeMax = `${targetDate.toISOString().split('T')[0]}T23:59:59.999Z`;

      const events = await this.calendarService.getEvents(timeMin, timeMax);
      const displayDate = this.formatDisplayDate(targetDate);
      const dayText = this.getDayText(targetDate);

      // Prepare optional thumbnail attachment
      const files = this.config.thumbnailPath
        ? [{ attachment: this.config.thumbnailPath, name: this.config.thumbnailName || basename(this.config.thumbnailPath) }]
        : undefined;
      const thumbnailUrl = files ? `attachment://${files[0].name}` : undefined;

      if (events.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle(`😴 ${this.config.dayName} ${displayDate}`)
          .setDescription(`Rien de prévu ${dayText} ! 🌟`)
          .setColor(0x95A5A6)
          .setTimestamp();

        if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

        await interaction.editReply({ embeds: [embed], files });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`✨ ${this.config.dayName} ${displayDate}`)
        .setDescription(`Voici ce qui vous attend ${dayText} !`)
        .setColor(0x3498DB)
        .setTimestamp();

      if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

      this.addEventsToEmbed(embed, events);
      await interaction.editReply({ embeds: [embed], files });

    } catch (error) {
      await this.handleError(interaction, error);
    }
  }

  private calculateTargetDate(): Date {
    const now = new Date();
    const targetDate = new Date(now);
    const dayOfWeek = now.getDay();
    
    let daysUntilTarget;
    if (dayOfWeek === this.config.dayNumber) {
      // If it's the target day, check if it's late in the day
      if (now.getHours() >= 23) {
        daysUntilTarget = 7; // Next occurrence
      } else {
        daysUntilTarget = 0; // Today
      }
    } else if (dayOfWeek < this.config.dayNumber) {
      // If it's before the target day this week
      daysUntilTarget = this.config.dayNumber - dayOfWeek;
    } else {
      // If it's after the target day this week, target day is next week
      daysUntilTarget = 7 - dayOfWeek + this.config.dayNumber;
    }
    
    targetDate.setDate(now.getDate() + daysUntilTarget);
    return targetDate;
  }

  private formatDisplayDate(date: Date): string {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${date.getDate()} ${monthNames[date.getMonth()]}`;
  }

  private getDayText(targetDate: Date): string {
    const today = new Date();
    const isToday = targetDate.toDateString() === today.toDateString();
    return isToday ? 'aujourd\'hui' : 'ce jour-ci';
  }

  private addEventsToEmbed(embed: EmbedBuilder, events: CalendarEvent[]): void {
    events.forEach((event, index) => {
      const timeInfo = getTimeInfo(event);
      const location = getLocationInfo(event);
      
      let description = event.description || '';
      description = formatEventDescription(description);
      description = description.length > 500 ? description.substring(0, 500) + '...' : description;

      // const eventEmoji = index % 2 === 0 ? '⚪' : '⚫';
      const eventEmoji = '🔔';
      
      embed.addFields({
        name: `${eventEmoji} ${event.summary || 'Événement'}`,
        value: [
          timeInfo,
          location,
          description ? `💬 ${description}` : ''
        ].filter(Boolean).join('\n'),
        inline: false
      });
    });
  }

  private async handleError(interaction: ChatInputCommandInteraction, error: any): Promise<void> {
    console.error('Error fetching calendar events:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('😅 Oups !')
      .setDescription('Je n\'arrive pas à récupérer votre agenda pour le moment. Réessayez plus tard !')
      .setColor(0xE74C3C)
      .setTimestamp();

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
