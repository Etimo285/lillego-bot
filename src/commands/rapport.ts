import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import puppeteer from 'puppeteer';
import { Command } from '../types';
import path from 'path';
import { setTimeout } from 'timers/promises';



// Mapping object to convert period values to human-readable names
const periodNames: Record<string, string> = {
  'TODAY': 'Aujourd\'hui',
  'YESTERDAY': 'Hier',
  'THIS_WEEK': 'Cette semaine',
  'LAST_WEEK': 'Semaine dernière',
  'LAST_SEVEN': '7 derniers jours',
  'LAST_THIRTY': '30 derniers jours',
  'LAST_SIXTY': '60 derniers jours',
  'LAST_NINETY': '90 derniers jours',
  'THIS_MONTH': 'Ce mois-ci',
  'LAST_MONTH': 'Dernier mois',
  'LAST_THREE_MONTHS': '3 derniers mois',
  'LAST_SIX_MONTHS': '6 derniers mois',
  'LAST_TWELVE_MONTHS': '12 derniers mois',
  'THIS_YEAR': 'Cette année',
  'LAST_YEAR': 'Année dernière',
  'ALL_TIME': 'Depuis le début'
};

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
      const browser = await puppeteer.launch(
        {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
      );
      const page = await browser.newPage();
      const client = await page.createCDPSession()
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: '../../downloads/',
      })
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
      
      await setTimeout(3000);

      // Wait for the page to update with the new period
      await page.waitForSelector('#download-options');
      await page.click('#download-options');

      await setTimeout(3000);

      // Click on download PDF button
      if (await page.waitForSelector('#download-pdf')) {
        await interaction.editReply(`Periode: **${periodNames[selectedPeriod!]}** \nDownload PDF button reached ✅`);
        // await page.click('#download-pdf');
      } else {
        await interaction.editReply('Erreur lors de la génération du rapport. Veuillez réessayer.');
        return;
      }

      await setTimeout(2000);
      
      await browser.close();

      // await interaction.editReply({ files: [path.join(__dirname, '../../downloads/pages.pdf')] });

      // await interaction.editReply(`Rapport généré pour la période: ${periodNames[selectedPeriod!]}`);
      
    } catch (error) {
      console.error('Error generating report:', error);
      await interaction.editReply('Erreur lors de la génération du rapport. Veuillez réessayer.');
    }
  }
};