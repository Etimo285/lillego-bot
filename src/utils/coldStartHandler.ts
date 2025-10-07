import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types';
import { getBotReady, getBotStartTime } from '../index';

// Function to check if bot is in cold start (first 60 seconds after startup)
function isColdStart(): boolean {
  const uptime = Date.now() - getBotStartTime();
  return uptime < 60000; // 60 seconds
}

// Function to wait for bot to be ready with timeout
async function waitForBotReady(timeoutMs: number = 60000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (getBotReady()) {
      return true;
    }
    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
}

/**
 * Wraps a command to handle cold start scenarios
 * @param command The original command to wrap
 * @returns A new command with cold start handling
 */
export function wrapCommandWithColdStartHandling(command: Command): Command {
  return {
    data: command.data,
    async execute(interaction: ChatInputCommandInteraction) {
      // Check if bot is in cold start mode
      if (!getBotReady() || isColdStart()) {
        console.log(`🔄 Cold start detected for command: ${command.data.name}`);
        
        // Send immediate response to user
        const coldStartEmbed = new EmbedBuilder()
          .setTitle('🔄 Bot en cours de démarrage...')
          .setDescription('Le bot est en train de se réveiller. Veuillez patienter quelques instants...')
          .setColor(0xFFA500)
          .setTimestamp()
          .setFooter({ text: 'Render Free Tier - Cold Start' });

        try {
          await interaction.reply({ embeds: [coldStartEmbed], ephemeral: true });
        } catch (error) {
          console.error('Failed to send cold start message:', error);
          return;
        }

        // Wait for bot to be ready
        const isReady = await waitForBotReady(60000); // Wait up to 60 seconds
        
        if (!isReady) {
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏰ Timeout')
            .setDescription('Le bot met trop de temps à démarrer. Veuillez réessayer dans quelques instants.')
            .setColor(0xFF0000)
            .setTimestamp()
            .setFooter({ text: 'Render Free Tier - Timeout' });

          try {
            await interaction.editReply({ embeds: [timeoutEmbed] });
          } catch (error) {
            console.error('Failed to send timeout message:', error);
          }
          return;
        }

        // Bot is now ready, update the message and execute command
        const readyEmbed = new EmbedBuilder()
          .setTitle('✅ Bot prêt!')
          .setDescription('Le bot est maintenant actif. Exécution de votre commande...')
          .setColor(0x00FF00)
          .setTimestamp()
          .setFooter({ text: 'Render Free Tier - Ready' });

        try {
          await interaction.editReply({ embeds: [readyEmbed] });
        } catch (error) {
          console.error('Failed to send ready message:', error);
        }
      }

      // Execute the original command
      await command.execute(interaction);
    }
  };
}

/**
 * Utility to create a loading message during cold start
 */
export async function sendColdStartMessage(interaction: ChatInputCommandInteraction): Promise<void> {
  const coldStartEmbed = new EmbedBuilder()
    .setTitle('🔄 Bot en cours de démarrage...')
    .setDescription('Le bot est en train de se réveiller. Veuillez patienter quelques instants...')
    .setColor(0xFFA500)
    .setTimestamp()
    .setFooter({ text: 'Render Free Tier - Cold Start' });

  await interaction.reply({ embeds: [coldStartEmbed], ephemeral: true });
}

/**
 * Utility to update message when bot is ready
 */
export async function updateToReadyMessage(interaction: ChatInputCommandInteraction): Promise<void> {
  const readyEmbed = new EmbedBuilder()
    .setTitle('✅ Bot prêt!')
    .setDescription('Le bot est maintenant actif. Exécution de votre commande...')
    .setColor(0x00FF00)
    .setTimestamp()
    .setFooter({ text: 'Render Free Tier - Ready' });

  await interaction.editReply({ embeds: [readyEmbed] });
}

/**
 * Utility to send timeout message
 */
export async function sendTimeoutMessage(interaction: ChatInputCommandInteraction): Promise<void> {
  const timeoutEmbed = new EmbedBuilder()
    .setTitle('⏰ Timeout')
    .setDescription('Le bot met trop de temps à démarrer. Veuillez réessayer dans quelques instants.')
    .setColor(0xFF0000)
    .setTimestamp()
    .setFooter({ text: 'Render Free Tier - Timeout' });

  await interaction.editReply({ embeds: [timeoutEmbed] });
}
