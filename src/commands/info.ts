import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, ExtendedClient } from '../types';

export const info: Command = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Get information about the bot'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client as ExtendedClient;
    const embed = new EmbedBuilder()
      .setTitle('🤖 Lillego Bot Information')
      .setDescription('A Discord bot built with TypeScript and Discord.js')
      .addFields(
        { name: '📊 Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: '👥 Users', value: `${client.users.cache.size}`, inline: true },
        { name: '⚡ Commands', value: `${client.commands.size}`, inline: true },
        { name: '🕒 Uptime', value: `${Math.floor(process.uptime())} seconds`, inline: true },
        { name: '📝 Node.js Version', value: process.version, inline: true },
        { name: '💾 Memory Usage', value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, inline: true }
      )
      .setColor(0x0099FF)
      .setTimestamp()
      .setFooter({ text: 'Lillego Bot' });

    await interaction.reply({ embeds: [embed] });
  }
};
