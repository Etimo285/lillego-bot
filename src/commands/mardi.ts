import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';
import { DayCommandHandler } from '../utils/dayCommandHandler';

export const mardi: Command = {
  data: new SlashCommandBuilder()
    .setName('mardi')
    .setDescription('Affiche les événements du prochain mardi'),

  async execute(interaction: ChatInputCommandInteraction) {
    const handler = new DayCommandHandler({
      dayName: 'Mardi',
      dayNumber: 2 // Tuesday
    });
    
    await handler.execute(interaction);
  }
};
