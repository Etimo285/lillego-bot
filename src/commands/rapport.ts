import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import puppeteer from 'puppeteer';
import { Command } from '../types';



export const rapport: Command = {
  data: (() => {
    const builder = new SlashCommandBuilder()
      .setName('rapport')
      .setDescription('Récupère le rapport d\'une periode definie')
      .addStringOption(option =>
        option
          .setName('période')
          .setDescription('Choisissez la période pour le rapport')
          .setRequired(true)
          .addChoices(
            { name: 'Aujourd\'hui', value: 'TODAY' },
            { name: 'Hier', value: 'YESTERDAY' },
            { name: 'Cette semaine', value: 'THIS_WEEK' },
            { name: 'Semaine dernière', value: 'LAST_WEEK' },
            { name: '7 derniers jours', value: 'LAST_SEVEN' },
            { name: '30 derniers jours', value: 'LAST_THIRTY' },
            { name: '60 derniers jours', value: 'LAST_SIXTY' },
            { name: '90 derniers jours', value: 'LAST_NINETY' },
            { name: 'Ce mois-ci', value: 'THIS_MONTH' },
            { name: 'Dernier mois', value: 'LAST_MONTH' },
            { name: '3 derniers mois', value: 'LAST_THREE_MONTHS' },
            { name: '6 derniers mois', value: 'LAST_SIX_MONTHS' },
            { name: '12 derniers mois', value: 'LAST_TWELVE_MONTHS' },
            { name: 'Cette année', value: 'THIS_YEAR' },
            { name: 'Année dernière', value: 'LAST_YEAR' },
            { name: 'Depuis le début', value: 'ALL_TIME' }
          )
      );
    return builder as SlashCommandBuilder;
  })(),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    // Get the selected period
    const selectedPeriod = interaction.options.getString('période');
    
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(process.env.WORDPRESS_URL || '');

      // Login to WordPress
      await page.type('#user_login', process.env.WORDPRESS_USERNAME || '');
      await page.type('#user_pass', process.env.WORDPRESS_PASSWORD || '');
      await page.click('#wp-submit');
      await page.waitForNavigation();
      
      // Navigate to analytics
      await page.click('#toplevel_page_independent-analytics');
      await page.waitForNavigation();
      
      // Click on dates button to open period selector
      await page.click('#dates-button');
      
      // Wait for the period selector to appear and select the chosen period
      await page.waitForSelector(`[data-relative-range-id="${selectedPeriod}"]`);
      await page.click(`[data-relative-range-id="${selectedPeriod}"]`);
      await page.click(`#apply-date`);
      
      // Wait for the page to update with the new period
      await page.waitForSelector('#download-options', { visible: true });
      await page.click('#download-options');

      // Click on download PDF button
      // await page.waitForSelector('#download-pdf');
      // await page.click('#download-pdf');
      
      await browser.close();
      
      await interaction.editReply(`Rapport généré pour la période: ${selectedPeriod}`);
      
    } catch (error) {
      console.error('Error generating report:', error);
      await interaction.editReply('Erreur lors de la génération du rapport. Veuillez réessayer.');
    }
  }
};