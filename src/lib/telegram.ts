'use client';

/**
 * @fileOverview Telegram Notification Service
 * Sends automated alerts for critical financial operations.
 */

const TELEGRAM_TOKEN = '8236708164:AAHi0AYmvf3_IJEpYAgug-GYdf4O9AkvZY4';
const TELEGRAM_CHAT_ID = '7306867055';

export async function sendTelegramNotification(message: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    // Silent fail to not interrupt user flow
    console.warn('Telegram notification failed', error);
  }
}
