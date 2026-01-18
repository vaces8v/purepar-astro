import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/prisma';
import { getSessionFromCookie } from '../../../../lib/auth';
import { hasTelegramConfig, getTelegramBotUsername } from '../../../../lib/telegram';

export const prerender = false;

function randomToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromCookie(request.headers.get('cookie'));
  if (!session) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminEmail = session.email;
  const record = await prisma.adminTelegram.findUnique({ where: { adminEmail } });

  return new Response(JSON.stringify({
    ok: true,
    configured: hasTelegramConfig(),
    botUsername: getTelegramBotUsername(),
    linked: Boolean(record?.chatId && record?.linkedAt),
    username: record?.username ?? null,
    firstName: record?.firstName ?? null,
    linkedAt: record?.linkedAt?.toISOString() ?? null,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromCookie(request.headers.get('cookie'));
  if (!session) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!hasTelegramConfig()) {
    return new Response(JSON.stringify({ ok: false, error: 'NOT_CONFIGURED' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminEmail = session.email;
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.adminTelegram.upsert({
    where: { adminEmail },
    update: {
      linkToken: token,
      linkTokenExpiresAt: expiresAt,
    },
    create: {
      adminEmail,
      linkToken: token,
      linkTokenExpiresAt: expiresAt,
    },
  });

  const botUsername = getTelegramBotUsername();
  const deepLink = `https://t.me/${botUsername}?start=${token}`;

  return new Response(JSON.stringify({ ok: true, deepLink, expiresAt: expiresAt.toISOString() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const session = getSessionFromCookie(request.headers.get('cookie'));
  if (!session) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminEmail = session.email;
  await prisma.adminTelegram.upsert({
    where: { adminEmail },
    update: {
      chatId: null,
      userId: null,
      username: null,
      firstName: null,
      linkedAt: null,
      linkToken: null,
      linkTokenExpiresAt: null,
    },
    create: { adminEmail },
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
