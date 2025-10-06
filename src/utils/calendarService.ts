import { google } from 'googleapis';
import { botConfig } from './config';
import { existsSync } from 'fs';
import { join } from 'path';

export interface CalendarEvent {
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
}

export interface CalendarService {
  getEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]>;
}

export class GoogleCalendarService implements CalendarService {
  private calendar: any;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    let auth;
    
    // Check if service account JSON file exists (preferred method)
    const serviceAccountPath = join(process.cwd(), 'service-account.json');
    
    if (existsSync(serviceAccountPath)) {
      // Read and validate the service account file
      const fs = require('fs');
      const serviceAccountData = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      if (serviceAccountData.type === 'service_account') {
        auth = new google.auth.GoogleAuth({
          keyFile: serviceAccountPath,
          scopes: ['https://www.googleapis.com/auth/calendar.readonly']
        });
      } else {
        throw new Error('Fichier de compte de service invalide. Veuillez télécharger le bon fichier JSON depuis Google Cloud Console.');
      }
    } else if (botConfig.googleCalendarId) {
      // Create a complete service account credentials object
      const serviceAccountCredentials = {
        type: 'service_account',
        project_id: 'lillego-bot',
        private_key_id: 'temp-key-id',
        client_id: 'temp-client-id',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      };

      auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        credentials: serviceAccountCredentials
      });
    } else {
      throw new Error('Configuration de l\'API Google Calendar manquante. Veuillez configurer les identifiants.');
    }

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async getEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
    const response = await this.calendar.events.list({
      calendarId: botConfig.googleCalendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  }
}

export function formatEventDescription(description: string): string {
  return description
    .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> tags to newlines
    .replace(/<a\s+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi, '[$2]($1)')  // Convert <a> tags to Discord links
    .replace(/<[^>]+>/g, '')  // Remove any remaining HTML tags
    .trim();
}

export function createMapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function getTimeInfo(event: CalendarEvent): string {
  const start = event.start?.dateTime || event.start?.date;
  
  if (!start) return '';
  
  const startDate = new Date(start);
  if (event.start?.dateTime) {
    // Event with time
    return `🕐 ${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    // All-day event
    return `📅 Toute la journée`;
  }
}

export function getLocationInfo(event: CalendarEvent): string {
  if (!event.location) return '';
  
  const mapsUrl = createMapsUrl(event.location);
  return `📍 ${event.location} \n [🗺️ Itinéraire](${mapsUrl})`;
}

export function getAgendaTimeInfo(event: CalendarEvent): string {
  const start = event.start?.dateTime || event.start?.date;
  
  if (!start) return '';
  
  const startDate = new Date(start);
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  if (event.start?.dateTime) {
    // Event with time
    const dayName = dayNames[startDate.getDay()];
    const dayNumber = startDate.getDate();
    const monthName = monthNames[startDate.getMonth()];
    const time = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `📅 **${dayName} ${dayNumber} ${monthName}** à **${time}**`;
  } else {
    // All-day event
    const dayName = dayNames[startDate.getDay()];
    const dayNumber = startDate.getDate();
    const monthName = monthNames[startDate.getMonth()];
    return `📅 **${dayName} ${dayNumber} ${monthName}** (Toute la journée)`;
  }
}

export function getAgendaLocationInfo(event: CalendarEvent): string {
  if (!event.location) return '';
  
  const mapsUrl = createMapsUrl(event.location);
  return `📍 ${event.location} \n[🗺️ Itinéraire](${mapsUrl})`;
}
