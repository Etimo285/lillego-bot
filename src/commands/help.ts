import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, ExtendedClient } from '../types';

export const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available commands'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client as ExtendedClient;
    
    // Create embed for help command
    const embed = new EmbedBuilder()
      .setTitle('🤖 Lillego Bot - Available Commands')
      .setDescription('Here are all the commands you can use:')
      .setColor(0x0099FF)
      .setTimestamp()
      .setFooter({ text: 'Lillego Bot' });

    // Get all commands from the client
    const commands = client.commands;
    
    if (commands.size === 0) {
      embed.addFields({
        name: '⚠️ No Commands Found',
        value: 'There are currently no commands available.',
        inline: false
      });
    } else {
      // Group commands by category (folder name)
      const commandCategories = new Map<string, Array<{name: string, description: string}>>();
      
      commands.forEach((command, commandName) => {
        // For now, we'll put all commands in a "General" category
        // In the future, you could organize by folder structure
        const category = 'General';
        
        if (!commandCategories.has(category)) {
          commandCategories.set(category, []);
        }
        
        commandCategories.get(category)!.push({
          name: commandName,
          description: command.data.description
        });
      });

      // Add each category to the embed
      commandCategories.forEach((commandList, category) => {
        const commandText = commandList
          .map(cmd => `**/${cmd.name}** - ${cmd.description}`)
          .join('\n');
        
        embed.addFields({
          name: `📁 ${category}`,
          value: commandText,
          inline: false
        });
      });
    }

    // Add usage information
    embed.addFields({
      name: '💡 How to Use',
      value: 'Type `/` in the chat to see all available slash commands, or use `/help` to see this list anytime!',
      inline: false
    });

    await interaction.reply({ embeds: [embed] });
  }
};
