import { Event } from '../types';

export const error: Event = {
  name: 'error',
  async execute(error) {
    console.error('Discord client error:', error);
  }
};
