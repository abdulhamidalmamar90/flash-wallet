
'use client';

/**
 * @fileOverview Telegram Notification Service with hardcoded credentials for consistent delivery.
 */

const TELEGRAM_TOKEN = '8236708164:AAHi0AYmvf3_IJEpYAgug-GYdf4O9AkvZY4';
const TELEGRAM_CHAT_ID = '7306867055';

export async function sendTelegramNotification(message: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    return response.ok;
  } catch (error) {
    console.warn('Telegram notification failed', error);
    return false;
  }
}

export async function sendTelegramPhoto(base64Image: string, caption: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`;
  
  try {
    const fetchResponse = await fetch(base64Image);
    const blob = await fetchResponse.blob();
    
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', blob, 'evidence.jpg');
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    if (replyMarkup) {
      formData.append('reply_markup', JSON.stringify(replyMarkup));
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    return response.ok;
  } catch (error) {
    console.warn('Telegram photo notification failed', error);
    return false;
  }
}
