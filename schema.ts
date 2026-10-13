import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export type ContactField = 'name' | 'email' | 'phone' | 'company';
export type LeadDraft = {
  intent: 'inquiry' | 'quote' | 'followup';
  services: string[];
  details: Partial<Record<ContactField, string>>;
  declined: ContactField[];
  awaiting: ContactField | 'consent' | null;
  submitted: boolean;
};

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey(),
  messages: jsonb('messages').$type<ChatMessage[]>().notNull(),
  draft: jsonb('draft').$type<LeadDraft>().notNull(),
  version: integer('version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const chatLeads = pgTable('chat_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().unique().references(() => chatSessions.id),
  intent: text('intent').notNull(),
  services: jsonb('services').$type<string[]>().notNull(),
  name: text('name'),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  declinedFields: jsonb('declined_fields').$type<ContactField[]>().notNull(),
  status: text('status').notNull().default('new'),
  consentedAt: timestamp('consented_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const communityPosts = pgTable('community_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageKey: text('image_key'),
  imageAlt: text('image_alt'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, table => [index('community_posts_created_idx').on(table.createdAt)]);

export const articleComments = pgTable('article_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleKey: text('article_key').notNull(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, table => [index('article_comments_article_created_idx').on(table.articleKey, table.createdAt)]);

export const communityReviews = pgTable('community_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  rating: integer('rating').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, table => [index('community_reviews_created_idx').on(table.createdAt)]);
