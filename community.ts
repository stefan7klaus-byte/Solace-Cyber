import { getDatabase } from '../../db/index.js';
import { communityPosts } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { articleSlugs } from './article-slugs.js';

export function respond(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export function validId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function validArticle(key: string) {
  if (articleSlugs.includes(key)) return true;
  if (!validId(key)) return false;
  const [post] = await getDatabase().select({ id: communityPosts.id }).from(communityPosts).where(eq(communityPosts.id, key)).limit(1);
  return Boolean(post);
}

export function field(data: FormData, key: string, minimum: number, maximum: number) {
  const value = data.get(key);
  if (typeof value !== 'string' || value.trim().length < minimum || value.trim().length > maximum) {
    throw new Error(`Please enter ${minimum}–${maximum} characters for ${key}.`);
  }
  return value.trim();
}

export async function limitedForm(request: Request) {
  const limit = 4 * 1024 * 1024;
  if (Number(request.headers.get('content-length') || 0) > limit) throw new Error('Submission is too large. Images must be under 3 MB.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Please complete the submission form.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error('Submission is too large. Images must be under 3 MB.');
    }
    chunks.push(result.value);
  }
  return new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
}
