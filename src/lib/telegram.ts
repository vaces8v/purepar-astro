const TELEGRAM_BOT_TOKEN = import.meta.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_USERNAME = import.meta.env.TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME;

export function hasTelegramConfig(): boolean {
  return !!(TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_USERNAME);
}

export function getTelegramBotUsername(): string {
  return TELEGRAM_BOT_USERNAME || '';
}

export async function telegramSendMessage(chatId: string, text: string, options?: {
  parse_mode?: 'HTML' | 'Markdown';
  reply_markup?: any;
}): Promise<{ ok: boolean; result?: { message_id: number } }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { ok: false };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to send telegram message:', error);
    return { ok: false };
  }
}

export async function telegramDeleteMessage(chatId: string, messageId: number): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    });
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('Failed to delete telegram message:', error);
    return false;
  }
}

export async function telegramAnswerCallbackQuery(callbackQueryId: string, text?: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('Failed to answer callback query:', error);
    return false;
  }
}
