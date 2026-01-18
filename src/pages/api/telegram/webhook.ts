import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { telegramSendMessage, telegramAnswerCallbackQuery, telegramDeleteMessage } from '../../../lib/telegram';

export const prerender = false;

function isValidWebhookSecret(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;
  const header = request.headers.get('x-telegram-bot-api-secret-token');
  return header === secret;
}

export const POST: APIRoute = async ({ request }) => {
  if (!isValidWebhookSecret(request)) {
    return new Response(JSON.stringify({ ok: false }), { status: 401 });
  }

  const update = await request.json().catch(() => null);
  if (!update) return new Response(JSON.stringify({ ok: true }));

  const message = update.message ?? update.edited_message;

  if (message?.text && typeof message.text === 'string') {
    const text: string = message.text;

    if (text.startsWith('/start')) {
      const parts = text.split(' ').filter(Boolean);
      const token = parts.length >= 2 ? parts[1] : '';
      const chatId = String(message.chat?.id ?? '');

      if (!token || !chatId) {
        return new Response(JSON.stringify({ ok: true }));
      }

      const record = await prisma.adminTelegram.findFirst({
        where: {
          linkToken: token,
          linkTokenExpiresAt: { gt: new Date() },
        },
      });

      if (!record) {
        await telegramSendMessage(
          chatId,
          'Ссылка для привязки устарела. Откройте админку и создайте новую ссылку.',
        ).catch(() => null);

        return new Response(JSON.stringify({ ok: true }));
      }

      await prisma.adminTelegram.update({
        where: { id: record.id },
        data: {
          chatId,
          userId: String(message.from?.id ?? ''),
          username: typeof message.from?.username === 'string' ? message.from.username : null,
          firstName: typeof message.from?.first_name === 'string' ? message.from.first_name : null,
          linkedAt: new Date(),
          linkToken: null,
          linkTokenExpiresAt: null,
        },
      });

      await telegramSendMessage(
        chatId,
        '✅ Telegram привязан. Теперь вы будете получать уведомления о новых заявках.',
      ).catch(() => null);

      return new Response(JSON.stringify({ ok: true }));
    }
  }

  const cb = update.callback_query;
  if (cb?.data && typeof cb.data === 'string') {
    const data: string = cb.data;
    const callbackQueryId = String(cb.id ?? '');

    if (data.startsWith('lead_resolve:')) {
      const leadId = data.slice('lead_resolve:'.length);
      const chatId = String(cb.message?.chat?.id ?? '');
      const messageId = Number(cb.message?.message_id);

      const admin = chatId
        ? await prisma.adminTelegram.findFirst({ where: { chatId } })
        : null;

      if (!admin) {
        await telegramAnswerCallbackQuery(callbackQueryId, 'Нет доступа').catch(() => null);
        return new Response(JSON.stringify({ ok: true }));
      }

      await prisma.lead
        .update({
          where: { id: leadId },
          data: { status: 'completed' },
        })
        .catch(() => null);

      await prisma.telegramLeadMessage.deleteMany({ where: { leadId } }).catch(() => null);

      if (chatId && Number.isFinite(messageId)) {
        await telegramDeleteMessage(chatId, messageId).catch(() => null);
      }

      await telegramAnswerCallbackQuery(callbackQueryId, '✅ Помечено как решено').catch(() => null);

      return new Response(JSON.stringify({ ok: true }));
    }
  }

  return new Response(JSON.stringify({ ok: true }));
};
