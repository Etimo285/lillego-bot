import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';
import { DayCommandHandler } from '../utils/dayCommandHandler';

export const jeudi: Command = {
  data: new SlashCommandBuilder()
    .setName('jeudi')
    .setDescription('Affiche les événements du prochain jeudi'),

  async execute(interaction: ChatInputCommandInteraction) {
    const handler = new DayCommandHandler({
      dayName: 'Jeudi',
      dayNumber: 4 // Thursday
    });
    
    await handler.execute(interaction);
  }
};
