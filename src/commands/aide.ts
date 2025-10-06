import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, ExtendedClient } from '../types';

export const aide: Command = {
  data: new SlashCommandBuilder()
    .setName('aide')
    .setDescription('Liste toutes les commandes disponibles'),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client as ExtendedClient;
    
    // Create embed for help command
    const embed = new EmbedBuilder()
      .setTitle('Commandes Disponibles')
      .setDescription('Voici toutes les commandes que vous pouvez utiliser :')
      .setColor(0x0099FF)
      .setTimestamp()
      .setFooter({ text: 'Lillego Bot' });

    // Get all commands from the client
    const commands = client.commands;
    
    if (commands.size === 0) {
      embed.addFields({
        name: '⚠️ Aucune Commande Trouvée',
        value: 'Il n\'y a actuellement aucune commande disponible.',
        inline: false
      });
    } else {
      // Group commands by category (folder name)
      const commandCategories = new Map<string, Array<{name: string, description: string}>>();
      
      commands.forEach((command, commandName) => {
        // For now, we'll put all commands in a "General" category
        // In the future, you could organize by folder structure
        const category = 'Général';
        
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
      name: '💡 Comment Utiliser',
      value: 'Tapez `/` dans le chat pour voir toutes les commandes slash disponibles, ou utilisez `/aide` pour voir cette liste à tout moment !',
      inline: false
    });

    await interaction.reply({ embeds: [embed] });
  }
};
