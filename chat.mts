import { randomUUID } from 'node:crypto';
import type { Config } from '@netlify/functions';
import OpenAI from 'openai';
import { and, eq } from 'drizzle-orm';
import { getDatabase } from '../../db/index.js';
import { chatLeads, chatSessions, type ContactField, type LeadDraft } from '../../db/schema.js';
import { declines, emptyDraft, fieldQuestion, greeting, nextField, safeAnswer, serviceOptions, supportPrompt, validDetail } from '../lib/support.js';

function reply(body: unknown, status = 200, cookie?: string) {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (cookie) headers['Set-Cookie'] = cookie;
  return Response.json(body, { status, headers });
}

function sessionCookie(id: string, url: URL) {
  return `solace_chat=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${url.protocol === 'https:' ? '; Secure' : ''}`;
}

function completionSchema() {
  const nullableText = { type: ['string', 'null'] };
  return {
    type: 'object', additionalProperties: false,
    required: ['answer', 'intent', 'services', 'details', 'declinedField'],
    properties: {
      answer: { type: 'string' },
      intent: { type: 'string', enum: ['inquiry', 'quote', 'followup'] },
      services: { type: 'array', items: { type: 'string', enum: serviceOptions() } },
      details: {
        type: 'object', additionalProperties: false, required: ['name', 'email', 'phone', 'company'],
        properties: { name: nullableText, email: nullableText, phone: nullableText, company: nullableText }
      },
      declinedField: { type: ['string', 'null'], enum: ['name', 'email', 'phone', 'company', null] }
    }
  };
}

export default async function chat(request: Request) {
  const url = new URL(request.url);
  if (!['GET', 'POST'].includes(request.method)) return reply({ error: 'Method not allowed.' }, 405);
  const origin = request.headers.get('origin');
  if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') return reply({ error: 'Please use chat on our website.' }, 403);
  const cookieId = request.headers.get('cookie')?.match(/(?:^|;\s*)solace_chat=([0-9a-f-]{36})(?:;|$)/)?.[1];
  const validId = cookieId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(cookieId) ? cookieId : null;
  if (request.method === 'GET' && !validId) return reply({ messages: [{ role: 'assistant', content: greeting() }], awaiting: null, submitted: false });

  try {
    let message = '';
    if (request.method === 'POST') {
      if (!request.headers.get('content-type')?.includes('application/json')) return reply({ error: 'Please send a chat message.' }, 415);
      if (Number(request.headers.get('content-length') || 0) > 6000) return reply({ error: 'Please keep your message under 1,000 characters.' }, 413);
      const raw = await request.text();
      if (raw.length > 6000) return reply({ error: 'Message too long.' }, 413);
      let body;
      try { body = JSON.parse(raw); } catch { return reply({ error: 'Invalid message.' }, 400); }
      if (!body || typeof body.message !== 'string' || !body.message.trim() || body.message.length > 1000) return reply({ error: 'Please enter a message of 1–1,000 characters.' }, 400);
      message = body.message.trim();
    }
    const database = getDatabase();
    const [found] = validId ? await database.select().from(chatSessions).where(eq(chatSessions.id, validId)).limit(1) : [];
    const recent = found && Date.now() - found.updatedAt.getTime() < 86400000;
    let session = recent ? found : undefined;
    if (request.method === 'GET') return reply({ messages: session?.messages ?? [{ role: 'assistant', content: greeting() }], awaiting: session?.draft.awaiting ?? null, submitted: session?.draft.submitted ?? false });
    if (!session) {
      [session] = await database.insert(chatSessions).values({ id: randomUUID(), messages: [{ role: 'assistant', content: greeting() }], draft: emptyDraft() }).returning();
    }
    const cookie = sessionCookie(session.id, url);
    if (session.messages.length >= 81) return reply({ error: 'This conversation has reached its limit. Please contact our team by phone or WhatsApp.' }, 429, cookie);
    const draft: LeadDraft = structuredClone(session.draft);
    let answer = '';
    let saveLead = false;
    if (draft.awaiting === 'consent' && /^(yes|yes please|save request|submit|send|confirm)[.!]?$/i.test(message)) {
      saveLead = true;
      draft.awaiting = null;
      draft.submitted = true;
      answer = draft.intent === 'quote'
        ? 'We’ve saved your quote request for our team to review, prepare a quote, and follow up using the contact details you provided. Scope, authorization, and written terms need confirmation before work begins.'
        : 'We’ve saved your request for our team to review and follow up using the contact details you provided. We cannot promise a response time or a particular outcome.';
      if (!draft.details.email && !draft.details.phone) answer = 'We’ve saved the details you chose to provide, but without an email or phone number we cannot contact you. Please reach our team at +1 (209) 294-4699 or through the WhatsApp button when you’re ready.';
    } else if (draft.awaiting === 'consent' && declines(message)) {
      draft.intent = 'inquiry';
      draft.awaiting = null;
      answer = 'Understood. We haven’t submitted a follow-up or quote request. The chat remains saved as described in our chat notice. You can contact our team directly whenever you’re ready.';
    } else {
      const client = new OpenAI({ timeout: 25000, maxRetries: 1 });
      const completion = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        max_completion_tokens: 900,
        messages: [
          { role: 'system', content: supportPrompt(draft) },
          ...session.messages.slice(-20),
          { role: 'user', content: message }
        ],
        response_format: { type: 'json_schema', json_schema: { name: 'support_reply', strict: true, schema: completionSchema() } }
      });
      const response = completion.choices[0]?.message;
      if (response?.refusal || !response?.content) {
        answer = 'We can only help with lawful, authorized security work. Please contact our team to discuss a legitimate defensive scope.';
      } else {
        const result = JSON.parse(response.content);
        answer = safeAnswer(result.answer) || 'We can discuss authorized support within a clearly defined scope.';
        if (!draft.submitted) {
          if (['quote', 'followup'].includes(result.intent)) draft.intent = result.intent;
          if (Array.isArray(result.services)) draft.services = [...new Set([...draft.services, ...result.services.filter((service: string) => serviceOptions().includes(service))])];
          if (draft.intent !== 'inquiry') {
            for (const field of ['name', 'email', 'phone', 'company'] as ContactField[]) {
              const detail = validDetail(field, result.details?.[field]);
              if (detail) {
                draft.details[field] = detail;
                draft.declined = draft.declined.filter(declined => declined !== field);
              }
            }
            const pending = draft.awaiting;
            if (pending && pending !== 'consent' && !draft.details[pending] && (declines(message) || result.declinedField === pending)) draft.declined.push(pending);
          }
          if (!draft.services.length) {
            answer += '\n\nWhich service do you need help with?';
          } else if (draft.intent !== 'inquiry') {
            const field = nextField(draft);
            draft.awaiting = field ?? 'consent';
            answer += field ? `\n\n${fieldQuestion(field)}` : '\n\nMay we save your request and have our team follow up using the details you provided?';
          }
        }
      }
    }
    const messages = [...session.messages, { role: 'user' as const, content: message }, { role: 'assistant' as const, content: answer }];
    await database.transaction(async transaction => {
      const changed = await transaction.update(chatSessions).set({ messages, draft, version: session.version + 1, updatedAt: new Date() }).where(and(eq(chatSessions.id, session.id), eq(chatSessions.version, session.version))).returning({ id: chatSessions.id });
      if (!changed.length) throw new Error('CHAT_CONFLICT');
      if (saveLead) await transaction.insert(chatLeads).values({ sessionId: session.id, intent: draft.intent, services: draft.services, ...draft.details, declinedFields: draft.declined }).onConflictDoNothing();
    });
    return reply({ messages, awaiting: draft.awaiting, submitted: draft.submitted }, 200, cookie);
  } catch (error) {
    if (error instanceof Error && error.message === 'CHAT_CONFLICT') return reply({ error: 'Chat updated in another tab. Close and reopen it before sending again.' }, 409);
    return reply({ error: 'Our AI support is temporarily unavailable. Please try again or use WhatsApp or call +1 (209) 294-4699.' }, 503);
  }
}

export const config: Config = {
  path: '/api/chat',
  rateLimit: { windowLimit: 15, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};
