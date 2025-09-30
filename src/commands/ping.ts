import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types';

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({ 
      content: 'Pinging...', 
      fetchReply: true 
    });
    
    const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const websocketHeartbeat = interaction.client.ws.ping;
    
    await interaction.editReply(
      `🏓 Pong!\n` +
      `📡 Roundtrip latency: ${roundtripLatency}ms\n` +
      `💓 WebSocket heartbeat: ${websocketHeartbeat}ms`
    );
  }
};
