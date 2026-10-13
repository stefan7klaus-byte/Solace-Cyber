SOLACE CYBER WORKSTATIONS WEBSITE
Files:
- index.html: homepage using homepage-hero.png
- blog.html: blog page using blog-hero.png
- homepage-hero.png and blog-hero.png: user-provided hero images

Keep all four files in the same folder when previewing or deploying.
The homepage contact form opens a mail draft; it does not submit to a backend.
The blog includes 50 brand-authored recommendation articles in blogs/, with searchable topic filters and pagination. Each article has its own URL and a link to the existing contact page.
All 50 articles are accessible without JavaScript; filtering and pagination are progressive enhancements.
The original six topic-suggestion cards remain below the article library and open an email draft.
The guides are promotional editorial content, not independent reviews, customer testimonials, or promises of recovery.
assets/blog-library.css and assets/blog-library.js support the article library and reading pages.
Keep the blogs/ and assets/ folders with the HTML pages when previewing or deploying.
Review all business, privacy, service, and legal claims before publishing.

CONTACT AND AI SUPPORT
Phone: +1 (209) 294-4699
WhatsApp: https://wa.me/12092944699
All 52 pages include a fixed bottom-left WhatsApp link and a bottom-right AI support launcher. Shared assets are assets/support-widget.css and assets/support-widget.js.

The AI assistant uses the Solace Cyber Workstations identity and the supplied authorized-security service scope. It runs through /api/chat in a modern Netlify Function using Netlify AI Gateway and gpt-4.1-mini. No provider API key needs to be configured. Address, opening hours, pricing, and certifications were not supplied and must not be invented by the assistant.

Chat sessions and confirmed quote/follow-up requests are stored in Netlify Database using Drizzle. The schema is in db/schema.ts and deploy-applied migrations are in netlify/database/migrations/. The assistant asks for name, email, phone, and company one at a time, accepts declined fields, and requests confirmation before creating a lead. Chat messages, including any contact details entered, are stored before lead confirmation as disclosed in the chat notice. Avoid submitting credentials or other sensitive information.

Leads are saved in the chat_leads table with status new; the associated chat_sessions row contains the conversation. A team member must review saved requests and arrange follow-up. The chat does not send emails or WhatsApp messages automatically, provide a human operator console, or guarantee response times. The phone, email, and WhatsApp links provide direct human-contact options. Use the site's authorized Netlify Database dashboard or database tooling to review leads; there is no public lead-list endpoint.

An opaque HttpOnly, SameSite cookie restores the chat while navigating pages. Requests are rate-limited, messages and conversation length are capped, and concurrent updates are protected. Do not manually serve backend sources or node_modules as public assets; .netlifyignore excludes them from deployment.

For local preview, run /opt/buildhome/node-deps/node_modules/.bin/netlify dev --port 8889. Netlify applies the checked-in migration on deployment and provisions the database. npm run typecheck validates TypeScript without creating build artifacts.

COMMUNITY AND BINARY RAIN
Every page includes falling 0/1 streams behind the content, with a pause control and automatic reduced-motion support. Existing background and hero images remain unchanged.
Visitors can comment on each guide and visitor post without signing in. The blog includes visitor post creation with optional JPG, PNG, or WebP images; the homepage includes a 1–5 rating and review form. Community navigation appears on every page. Contributions publish immediately and are explicitly labeled as unverified visitor content, not business-authored statements or verified customer testimonials.
Netlify Database stores posts, article-linked comments, and reviews. Netlify Blobs stores uploaded images. Images are limited to 3 MB and 16 megapixels, decoded and re-encoded as WebP, stripped of metadata, and resized to at most 1600 pixels. Images require a description for accessibility. No visitor contact information is required or collected.
Forms include publication consent, input limits, a honeypot, same-origin checks, platform rate limits, and safe text rendering. Visitors can report inappropriate content using the displayed email link. The site does not include an automated content-review service or a moderation console. The owner must review reports and remove inappropriate records using authorized Netlify Database tooling (and associated image objects through Netlify Blobs). Anonymous display names and reviews are not identity-verified.
community-post.html displays individually linked visitor posts and their comments. JavaScript and the deployed Netlify Functions are required for community content. The existing static guide library remains accessible without JavaScript.
