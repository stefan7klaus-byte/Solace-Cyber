SOLACE CYBER WORKSTATIONS WEBSITE
Files:
- index.html: homepage using homepage-hero.png
- blog.html: blog page using blog-hero.png
- homepage-hero.png and blog-hero.png: user-provided hero images

Keep all four files in the same folder when previewing or deploying.
The homepage contact form opens a mail draft; it does not submit to a backend.
Blog topic links open an email draft. Replace sample topic cards with finished articles before launch.
Review all business, privacy, service, and legal claims before publishing.


NETLIFY HOSTING AND BACKEND
---------------------------
The repository is configured for Netlify static hosting plus serverless functions.
Connect this GitHub repository to Netlify and deploy from the repository root.
The configured build command is `npm run build`; it creates a clean `dist/`
static publish directory while keeping function source outside the public output.
Netlify deploys functions from `netlify/functions`. The community API and support chatbot use Netlify Blobs for
persistent records and uploaded images.

REQUIRED NETLIFY ENVIRONMENT VARIABLE
- OPENAI_API_KEY: an OpenAI API key for live AI support. Set it in Netlify's
  project environment-variable settings with Functions scope, then redeploy.
- OPENAI_MODEL (optional): model name; defaults to gpt-4o-mini.

OPTIONAL QUOTE-REQUEST EMAIL NOTIFICATIONS
To send an email when a visitor explicitly confirms a quote request, configure:
- RESEND_API_KEY: API key for Resend
- LEADS_NOTIFICATION_EMAIL: inbox that should receive leads
- LEADS_FROM_EMAIL: sender address verified with Resend

If email notification settings are absent, quote requests are still saved in
Netlify Blobs, but the chatbot tells the visitor that automatic notifications
are not configured. Configure the three email settings before relying on the
chatbot for team follow-up.

The homepage contact form still prepares a mail draft in the visitor's email
application. Community comments, visitor posts, post image uploads, and reviews
are published publicly without a sign-in or moderation queue. Add moderation,
rate limiting, and a privacy/retention policy before promoting the community
widely. Do not publish sensitive data or recovery credentials.

IMPORTANT HOSTING NOTE
GitHub Pages cannot run the backend functions. The live production site must be
deployed on Netlify for the API and persistent community features to work. The
GitHub Pages URL will remain a static version unless you switch visitors to the
Netlify URL or configure a custom domain for Netlify.
