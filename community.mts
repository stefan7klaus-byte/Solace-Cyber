import { randomUUID } from 'node:crypto';
import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import sharp from 'sharp';
import { desc, eq } from 'drizzle-orm';
import { getDatabase } from '../../db/index.js';
import { articleComments, communityPosts, communityReviews } from '../../db/schema.js';
import { field, limitedForm, respond, validArticle, validId } from '../lib/community.js';

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const article = url.searchParams.get('article') || '';
  if (!['posts', 'post', 'comments', 'reviews'].includes(type || '')) return respond({ error: 'Unknown community section.' }, 400);
  if (!['GET', 'POST'].includes(request.method)) return respond({ error: 'Method not allowed.' }, 405);
  try {
    const database = getDatabase();
    if (type === 'comments' && !await validArticle(article)) return respond({ error: 'Article not found.' }, 404);
    if (request.method === 'GET') {
      if (type === 'post') {
        const id = url.searchParams.get('id') || '';
        if (!validId(id)) return respond({ error: 'Post not found.' }, 404);
        const [post] = await database.select().from(communityPosts).where(eq(communityPosts.id, id)).limit(1);
        return post ? respond({ post }) : respond({ error: 'Post not found.' }, 404);
      }
      const offset = Number(url.searchParams.get('offset') || 0);
      if (!Number.isInteger(offset) || offset < 0 || offset > 10000) return respond({ error: 'Invalid page.' }, 400);
      let items;
      if (type === 'posts') items = await database.select().from(communityPosts).orderBy(desc(communityPosts.createdAt), desc(communityPosts.id)).limit(13).offset(offset);
      else if (type === 'reviews') items = await database.select().from(communityReviews).orderBy(desc(communityReviews.createdAt), desc(communityReviews.id)).limit(13).offset(offset);
      else items = await database.select().from(articleComments).where(eq(articleComments.articleKey, article)).orderBy(desc(articleComments.createdAt), desc(articleComments.id)).limit(13).offset(offset);
      return respond({ items: items.slice(0, 12), hasMore: items.length > 12 });
    }
    if (type === 'post') return respond({ error: 'Use the post submission form.' }, 400);
    const origin = request.headers.get('origin');
    if (!origin || origin !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') return respond({ error: 'Please submit through our website.' }, 403);
    if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) return respond({ error: 'Please use the submission form.' }, 415);
    let data: FormData;
    try {
      data = await limitedForm(request);
    } catch {
      return respond({ error: 'Invalid submission. Please use the form and keep images under 3 MB.' }, 400);
    }
    if (data.get('website')) return respond({ error: 'Submission could not be accepted.' }, 400);
    if (data.get('consent') !== 'yes') return respond({ error: 'Please confirm you agree to publish your submission.' }, 400);
    let name: string;
    let content: string;
    try {
      name = field(data, 'name', 2, 80);
      content = field(data, 'content', 3, type === 'posts' ? 10000 : 2000);
    } catch (error) {
      return respond({ error: (error as Error).message }, 400);
    }
    if (type === 'comments') {
      const [item] = await database.insert(articleComments).values({ articleKey: article, name, content }).returning();
      return respond({ item }, 201);
    }
    if (type === 'reviews') {
      const rating = Number(data.get('rating'));
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return respond({ error: 'Choose a rating from 1 to 5.' }, 400);
      const [item] = await database.insert(communityReviews).values({ name, content, rating }).returning();
      return respond({ item }, 201);
    }
    let title: string;
    let imageAlt: string | null = null;
    try {
      title = field(data, 'title', 3, 160);
    } catch (error) {
      return respond({ error: (error as Error).message }, 400);
    }
    const image = data.get('image');
    let imageKey: string | null = null;
    if (image instanceof File && image.size) {
      if (image.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(image.type)) return respond({ error: 'Choose a JPG, PNG, or WebP image under 3 MB.' }, 400);
      try {
        imageAlt = field(data, 'image description', 3, 200);
      } catch (error) {
        return respond({ error: (error as Error).message }, 400);
      }
      let normalized: Buffer;
      try {
        const processor = sharp(Buffer.from(await image.arrayBuffer()), { limitInputPixels: 16000000, animated: false });
        const metadata = await processor.metadata();
        if (!['jpeg', 'png', 'webp'].includes(metadata.format || '') || (metadata.pages || 1) > 1) return respond({ error: 'Choose a non-animated JPG, PNG, or WebP image.' }, 400);
        normalized = await processor.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      } catch {
        return respond({ error: 'This image could not be read. Choose a valid JPG, PNG, or WebP image under 16 megapixels.' }, 400);
      }
      imageKey = `${randomUUID()}.webp`;
      await getStore('community-images').set(imageKey, new Uint8Array(normalized).buffer);
    }
    try {
      const [item] = await database.insert(communityPosts).values({ name, title, content, imageKey, imageAlt }).returning();
      return respond({ item }, 201);
    } catch (error) {
      if (imageKey) await getStore('community-images').delete(imageKey).catch(() => {});
      throw error;
    }
  } catch {
    return respond({ error: 'Community submissions are temporarily unavailable. Your text has not been cleared; please try again.' }, 503);
  }
}

export const config: Config = {
  path: '/api/community',
  rateLimit: { windowLimit: 40, windowSize: 60, aggregateBy: ['ip', 'domain'] }
};
