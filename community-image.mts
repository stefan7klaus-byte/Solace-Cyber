import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { eq } from 'drizzle-orm';
import { getDatabase } from '../../db/index.js';
import { communityPosts } from '../../db/schema.js';

export default async function handler(request: Request) {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const key = new URL(request.url).pathname.split('/').pop() || '';
  if (!/^[0-9a-f-]{36}\.webp$/.test(key)) return new Response('Not found', { status: 404 });
  try {
    const [post] = await getDatabase().select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.imageKey, key)).limit(1);
    if (!post) return new Response('Not found', { status: 404 });
    const image = await getStore('community-images').get(key, { type: 'stream', consistency: 'strong' });
    if (!image) return new Response('Not found', { status: 404 });
    return new Response(image, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return new Response('Image temporarily unavailable', { status: 503 });
  }
}

export const config: Config = { path: '/api/community-image/:key' };
