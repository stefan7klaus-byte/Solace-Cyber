SOLACE CYBER WORKSTATIONS WEBSITE
Files:
- index.html: homepage using homepage-hero.png
- blog.html: blog page using blog-hero.png
- homepage-hero.png and blog-hero.png: user-provided hero images

Keep all four files in the same folder when previewing or deploying.
The homepage contact form prepares an email draft and provides a manual email/copy fallback if no email app is configured. It does not submit to a server.\n\nThe community comments, posts, and reviews now fall back to browser-local storage when the old Netlify API is unavailable. In that mode, entries are only visible in the same browser and device; they are not shared publicly with other visitors. Shared, persistent submissions require a configured backend service.
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

The homepage contact form still prepares a mail draft in the visitor's email
application. Community comments, visitor posts, post image uploads, and reviews
are published publicly without a sign-in or moderation queue. Submissions currently publish immediately and cannot be removed through a
visitor-facing moderation tool. Add a moderation and privacy/retention policy
before promoting the community widely. Basic per-IP submission rate limiting is enabled. Do not publish sensitive data or recovery credentials.

IMPORTANT HOSTING NOTE
GitHub Pages cannot run the backend functions. The live production site must be
deployed on Netlify for the API and persistent community features to work. The
GitHub Pages URL will remain a static version unless you switch visitors to the
Netlify URL or configure a custom domain for Netlify.
