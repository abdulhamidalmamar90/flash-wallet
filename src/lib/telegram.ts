'use client';

/**
 * @fileOverview Telegram Notification Service
 * Sends automated alerts for critical financial operations including photo support.
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
    console.warn('Telegram notification failed', error);
  }
}

export async function sendTelegramPhoto(base64Image: string, caption: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`;
  
  try {
    // Convert data URI to Blob
    const fetchResponse = await fetch(base64Image);
    const blob = await fetchResponse.blob();
    
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', blob, 'evidence.jpg');
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');

    await fetch(url, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.warn('Telegram photo notification failed', error);
  }
}
