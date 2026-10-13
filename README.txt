SOLACE CYBER WORKSTATIONS WEBSITE
Files:
- index.html: homepage using homepage-hero.png
- blog.html: blog page using blog-hero.png
- homepage-hero.png and blog-hero.png: user-provided hero images

Keep all four files in the same folder when previewing or deploying.
The homepage contact form prepares an email draft and provides a manual email/copy fallback if no email app is configured. It does not submit to a server.\n\nCommunity comments, posts, and reviews support Supabase shared storage when configured in assets/community-config.js. Until Supabase is configured, entries fall back to browser-local storage and are visible only in the same browser/device. Run supabase-community.sql in the Supabase SQL Editor, then set the project URL and anon/publishable key in assets/community-config.js. New shared submissions are held as pending and must be approved in the Supabase Table Editor before they appear publicly. Never put a service_role key in client-side files.
Blog topic links open an email draft. Replace sample topic cards with finished articles before launch.
Review all business, privacy, service, and legal claims before publishing.


GITHUB-ONLY SUPPORT CHAT
------------------------
The support widget in `assets/support-widget.js` is a browser-based FAQ helper. It runs
on static hosting such as GitHub Pages and does not call the former Netlify AI endpoint,
require an API key, or send chat messages to an AI provider. It answers common questions
using built-in service guidance; it is not a generative AI model and does not provide
server-side chat history or lead storage.

The former `netlify/functions/chat.mjs` AI chatbot endpoint has been removed. Netlify
may still be used separately for other existing backend features, but it is not required
for the FAQ chat widget.

The homepage contact form prepares a mail draft in the visitor's email application. The community UI uses Supabase REST when configured, with row-level security and moderation: visitors can submit pending comments, posts, and reviews, but only approved entries are publicly readable. Review pending entries in the Supabase Table Editor and change status to approved or rejected. Do not publish sensitive data or recovery credentials.

STATIC HOSTING NOTE
GitHub Pages cannot run server-side functions. The Supabase community feature works from GitHub Pages after the Supabase table, row-level security policies, project URL, and anon/publishable key are configured. The anon key is intended for public browser use only when RLS is correctly enabled; never expose a service_role key. The email contact form still relies on the visitor's mail app.

CURSOR BUBBLE EFFECT
assets/touch-bubbles.js and assets/touch-bubbles.css add lightweight floating bubbles around the pointer and on pointer interactions. The effect is decorative, does not intercept clicks, and respects reduced-motion preferences.