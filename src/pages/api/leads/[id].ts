import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { getSessionFromCookie } from '../../../lib/auth';
import { telegramDeleteMessage } from '../../../lib/telegram';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  const session = getSessionFromCookie(request.headers.get('cookie'));
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = parseInt(params.id || '');
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { status } = body;

    const lead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    return new Response(JSON.stringify({ success: true, lead }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to update lead:', error);
    return new Response(JSON.stringify({ error: 'Failed to update lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const session = getSessionFromCookie(request.headers.get('cookie'));
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = parseInt(params.id || '');
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Delete telegram messages first
    const messages = await prisma.telegramLeadMessage.findMany({
      where: { leadId: id },
    });

    for (const msg of messages) {
      await telegramDeleteMessage(msg.chatId, msg.messageId);
    }

    await prisma.lead.delete({ where: { id } });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to delete lead:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
