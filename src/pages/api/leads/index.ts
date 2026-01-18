import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { getSessionFromCookie } from '../../../lib/auth';
import { hasTelegramConfig, telegramSendMessage } from '../../../lib/telegram';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromCookie(request.headers.get('cookie'));
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  try {
    const where = status && status !== 'all' ? { status } : {};
    
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return new Response(JSON.stringify({ leads, total, page, limit }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch leads' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, phone, message, utm_source, utm_medium, utm_campaign, pageUrl } = body;

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: 'Name and phone required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        method: 'Форма на сайте',
        contact: phone,
        comment: message || null,
        utmSource: utm_source || null,
        utmMedium: utm_medium || null,
        utmCampaign: utm_campaign || null,
        pageUrl: pageUrl || null,
      },
    });

    // Send notification to Telegram
    if (hasTelegramConfig()) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const admin = await prisma.adminTelegram.findUnique({ where: { adminEmail } });
        if (admin?.chatId) {
          const lines = [
            '🔔 Новая заявка',
            '',
            `👤 Имя: ${lead.name}`,
            `📱 Контакт: ${lead.contact}`,
            lead.comment ? `💬 Комментарий: ${lead.comment}` : '',
          ].filter(Boolean);

          const result = await telegramSendMessage(admin.chatId, lines.join('\n'), {
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Решено', callback_data: `lead_resolve:${lead.id}` }],
              ],
            },
          });

          if (result.ok && result.result?.message_id) {
            await prisma.telegramLeadMessage.create({
              data: {
                leadId: lead.id,
                chatId: admin.chatId,
                messageId: result.result.message_id,
              },
            }).catch(() => null);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, lead }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to create lead:', error);
    return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
