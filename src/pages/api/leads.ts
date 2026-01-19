import type { APIRoute } from 'astro';
import { PrismaClient } from '@prisma/client';
import { telegramSendMessage, hasTelegramConfig } from '../../lib/telegram';

const prisma = new PrismaClient();

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, phone, message, referrer, landingPage } = data;

    if (!name || !phone) {
      return new Response(JSON.stringify({ error: 'Name and phone are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Save to Database
    const lead = await prisma.lead.create({
      data: {
        name,
        contact: phone,
        method: 'FORM',
        comment: message,
        pageUrl: landingPage,
        utmSource: referrer ? new URL(referrer).hostname : 'direct',
      },
    });

    // 2. Send Telegram Notification
    // Logic matched with old-purepar: Lookup admin via email
    if (hasTelegramConfig()) {
      const adminEmail = process.env.ADMIN_EMAIL;

      if (adminEmail) {
        // Try to find the admin user to get their Chat ID
        const admin = await prisma.adminTelegram.findUnique({
          where: { adminEmail },
        });

        if (admin?.chatId) {
          const tgMessage = `
🔥 <b>Новая заявка с сайта PurePar</b>

👤 <b>Имя:</b> ${name}
📞 <b>Телефон:</b> ${phone}
💬 <b>Сообщение:</b> ${message || 'Нет сообщения'}

🔗 <b>Страница:</b> ${landingPage || 'Не определена'}
🌍 <b>Источник:</b> ${referrer || 'Прямой заход'}
          `.trim();

          await telegramSendMessage(admin.chatId, tgMessage, { parse_mode: 'HTML' });

          // Log the message sending if successful (optional, matched old-purepar loosely)
          // old-purepar also saved the messageId, we can do that if we want full parity,
          // but for now basic sending is the requirement.
        } else {
          console.warn(`Admin found for ${adminEmail} but no chatId is linked.`);
        }
      } else {
        console.warn('ADMIN_EMAIL is not set in environment variables.');
      }
    }

    return new Response(JSON.stringify({ success: true, id: lead.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Lead processing error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
