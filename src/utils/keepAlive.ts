import fetch from 'node-fetch';

// Keep-alive configuration
const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000; // 10 minutes
const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'https://lillego-bot.onrender.com/status';

let keepAliveInterval: NodeJS.Timeout | null = null;

/**
 * Start the keep-alive mechanism to prevent the bot from sleeping
 */
export function startKeepAlive(): void {
  if (keepAliveInterval) {
    console.log('🔄 Keep-alive already running');
    return;
  }

  console.log('💓 Starting keep-alive mechanism...');
  
  keepAliveInterval = setInterval(async () => {
    try {
      const response = await fetch(HEALTH_CHECK_URL);
      if (response.ok) {
        console.log('💓 Keep-alive ping successful');
      } else {
        console.warn('⚠️ Keep-alive ping failed with status:', response.status);
      }
    } catch (error) {
      console.error('❌ Keep-alive ping failed:', error);
    }
  }, KEEP_ALIVE_INTERVAL);

  console.log(`💓 Keep-alive will ping every ${KEEP_ALIVE_INTERVAL / 1000 / 60} minutes`);
}

/**
 * Stop the keep-alive mechanism
 */
export function stopKeepAlive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('💓 Keep-alive stopped');
  }
}

/**
 * Get the current keep-alive status
 */
export function isKeepAliveActive(): boolean {
  return keepAliveInterval !== null;
}
