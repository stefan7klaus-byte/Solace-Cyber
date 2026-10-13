(() => {
  const isArticle = document.body.classList.contains('article-page');
  const isVisitorPost = document.body.classList.contains('visitor-post-page');
  const isBlog = /\/blog(?:\.html)?\/?$/.test(location.pathname);
  const slug = location.pathname.replace(/\/$/, '').split('/').pop().replace(/\.html$/, '');
  const postId = new URLSearchParams(location.search).get('id');
  const rain = document.createElement('div');
  rain.className = 'binary-rain';
  rain.setAttribute('aria-hidden', 'true');
  const count = Math.min(42, Math.max(14, Math.ceil(innerWidth / 38)));
  for (let index = 0; index < count; index++) {
    const stream = document.createElement('span');
    stream.className = 'binary-stream';
    stream.style.left = `${index * 100 / count}%`;
    stream.style.setProperty('--duration', `${12 + Math.random() * 18}s`);
    stream.style.setProperty('--delay', `${-Math.random() * 30}s`);
    stream.textContent = Array.from({ length: 18 + Math.floor(Math.random() * 20) }, () => Math.random() > .5 ? '1' : '0').join('\n');
    rain.append(stream);
  }
  document.body.prepend(rain);

  const toolbar = document.createElement('nav');
  toolbar.className = 'community-toolbar';
  toolbar.setAttribute('aria-label', 'Community and animation');
  toolbar.innerHTML = '<a href="/blog.html#community-posts">Visitor posts · Create a post</a><a href="/index.html#community-reviews">Read or submit a review</a><button type="button" aria-pressed="false">Pause binary rain</button>';
  const footer = document.querySelector('footer');
  if (footer) footer.before(toolbar);
  else document.body.append(toolbar);
  const motion = toolbar.querySelector('button');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) motion.hidden = true;
  motion.addEventListener('click', () => {
    const paused = rain.classList.toggle('is-paused');
    motion.setAttribute('aria-pressed', String(paused));
    motion.textContent = paused ? 'Resume binary rain' : 'Pause binary rain';
  });

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  async function api(params, options) {
    const response = await fetch(`/api/community?${new URLSearchParams(params)}`, options);
    let data;
    try { data = await response.json(); } catch { throw new Error(response.status === 429 ? 'Too many requests. Please wait a minute and try again.' : 'Community is temporarily unavailable. Please try again.'); }
    if (!response.ok) throw new Error(data.error || 'Your submission could not be saved. Please try again.');
    return data;
  }

  function imageNode(item) {
    const image = element('img');
    image.src = `/api/community-image/${encodeURIComponent(item.imageKey)}`;
    image.alt = item.imageAlt || 'Image uploaded by the post author';
    image.loading = 'lazy';
    return image;
  }

  function renderItem(item, type) {
    const card = element('article', 'community-item');
    if (type === 'posts') {
      const heading = element('h3');
      const link = element('a', '', item.title);
      link.href = `/community-post.html?id=${encodeURIComponent(item.id)}`;
      heading.append(link);
      card.append(heading);
    }
    const date = new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    card.append(element('div', 'community-meta', `${item.name} · ${date} · Visitor ${type === 'posts' ? 'post' : type === 'reviews' ? 'review · Not verified' : 'comment'}`));
    if (type === 'reviews') {
      const rating = element('p', 'community-rating', `${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)} · ${item.rating}/5`);
      rating.setAttribute('aria-label', `${item.rating} out of 5 stars`);
      card.append(rating);
    }
    if (item.imageKey) card.append(imageNode(item));
    card.append(element('p', '', type === 'posts' && item.content.length > 450 ? `${item.content.slice(0, 450)}…` : item.content));
    return card;
  }

  function section(type, article) {
    const details = {
      posts: ['community-posts', 'From the community', 'Visitor posts', 'Share a perspective, ask a question, or write about your experience. Posts are written by visitors, not by Solace.'],
      reviews: ['community-reviews', 'Your experience matters', 'Visitor reviews', 'Share your honest experience. These are unverified visitor submissions, not independently verified testimonials.'],
      comments: ['article-comments', 'Join the conversation', 'Article comments', 'Add a thoughtful comment about this article. No account is required.']
    }[type];
    const root = element('section', 'community-section');
    root.id = details[0];
    root.setAttribute('aria-labelledby', `${type}-title`);
    root.innerHTML = `<div class="community-eyebrow">${details[1]}</div><h2 id="${type}-title">${details[2]}</h2><p class="community-note">${details[3]}</p><p class="community-note">Submissions appear publicly immediately. Your display name, text, and any image are saved. Never share passwords, private keys, recovery phrases, contact details, or identity documents. Be respectful and only upload images you have permission to publish. <a href="mailto:Solace.cyber.workstations@mail.com">Report inappropriate content</a>.</p><div class="community-layout"><div><div class="community-list" aria-live="polite"></div><p class="community-status community-load-status" role="status"></p><button class="community-more" type="button" hidden>Load more</button></div><form class="community-form"><h3>${type === 'posts' ? 'Create a post' : type === 'reviews' ? 'Submit a review' : 'Leave a comment'}</h3><label for="${type}-name">Display name<input id="${type}-name" name="name" required minlength="2" maxlength="80" autocomplete="nickname"></label>${type === 'posts' ? '<label for="post-title">Post title<input id="post-title" name="title" required minlength="3" maxlength="160"></label>' : ''}${type === 'reviews' ? '<label for="review-rating">Your rating<select id="review-rating" name="rating" required><option value="">Choose a rating</option><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Average</option><option value="2">2 — Poor</option><option value="1">1 — Very poor</option></select></label>' : ''}<label for="${type}-content">${type === 'posts' ? 'Your post' : type === 'reviews' ? 'Your experience' : 'Your comment'}<textarea id="${type}-content" name="content" required minlength="3" maxlength="${type === 'posts' ? 10000 : 2000}" rows="6"></textarea></label>${type === 'posts' ? '<label for="post-image">Image (optional)<input id="post-image" name="image" type="file" accept="image/jpeg,image/png,image/webp"><span class="community-note">JPG, PNG, or WebP · Up to 3 MB and 16 megapixels. Image metadata is removed before publishing.</span></label><img class="community-image-preview" alt="Selected image preview" hidden><label for="post-image-alt">Image description<input id="post-image-alt" name="image description" minlength="3" maxlength="200" placeholder="Describe the image for readers using a screen reader"></label>' : ''}<label class="community-trap" aria-hidden="true">Leave empty<input name="website" tabindex="-1" autocomplete="off"></label><label class="community-consent"><input type="checkbox" name="consent" value="yes" required><span>I agree to publish and store my submission publicly. It is my own content and contains no sensitive information.</span></label><button type="submit">${type === 'posts' ? 'Publish post' : type === 'reviews' ? 'Publish review' : 'Publish comment'}</button><p class="community-status community-submit-status" role="status"></p></form></div>`;
    const main = document.querySelector('main');
    if (main?.contains(toolbar)) toolbar.before(root);
    else if (main) main.append(root);
    else toolbar.before(root);
    const list = root.querySelector('.community-list');
    const loadStatus = root.querySelector('.community-load-status');
    const more = root.querySelector('.community-more');
    const form = root.querySelector('form');
    const submitStatus = root.querySelector('.community-submit-status');
    const submitButton = form.querySelector('button[type=submit]');
    const params = { type, ...(article ? { article } : {}) };
    let offset = 0;
    let loading = false;
    let previewUrl;

    async function load(reset = false) {
      if (loading) return;
      loading = true;
      more.disabled = true;
      list.setAttribute('aria-busy', 'true');
      loadStatus.dataset.error = 'false';
      loadStatus.textContent = 'Loading community contributions…';
      try {
        const data = await api({ ...params, offset: String(reset ? 0 : offset) });
        if (reset) { list.replaceChildren(); offset = 0; }
        for (const item of data.items) list.append(renderItem(item, type));
        offset += data.items.length;
        more.hidden = !data.hasMore;
        more.textContent = 'Load more';
        loadStatus.textContent = offset ? '' : `No ${type} yet. Be the first to contribute.`;
      } catch (error) {
        loadStatus.textContent = error.message;
        loadStatus.dataset.error = 'true';
        more.hidden = false;
        more.textContent = 'Try loading again';
      } finally {
        loading = false;
        more.disabled = false;
        list.setAttribute('aria-busy', 'false');
      }
    }
    more.addEventListener('click', () => load());
    if (type === 'posts') {
      const input = form.querySelector('[type=file]');
      const preview = form.querySelector('.community-image-preview');
      const description = form.querySelector('[name="image description"]');
      input.addEventListener('change', () => {
        input.setCustomValidity('');
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        preview.hidden = true;
        description.required = false;
        const file = input.files[0];
        if (!file) return;
        if (file.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          input.setCustomValidity('Choose a JPG, PNG, or WebP image under 3 MB.');
          input.reportValidity();
          return;
        }
        description.required = true;
        previewUrl = URL.createObjectURL(file);
        preview.src = previewUrl;
        preview.hidden = false;
      });
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitButton.disabled || !form.reportValidity()) return;
      const payload = new FormData(form);
      for (const control of form.elements) control.disabled = true;
      submitStatus.dataset.error = 'false';
      submitStatus.textContent = 'Publishing your contribution…';
      try {
        const data = await api(params, { method: 'POST', body: payload });
        form.reset();
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const preview = form.querySelector('.community-image-preview');
        if (preview) preview.hidden = true;
        const description = form.querySelector('[name="image description"]');
        if (description) description.required = false;
        submitStatus.textContent = 'Published. Thank you for contributing.';
        if (type === 'posts') {
          const link = element('a', '', ' Read your post →');
          link.href = `/community-post.html?id=${encodeURIComponent(data.item.id)}`;
          submitStatus.append(link);
        }
        await load(true);
      } catch (error) {
        submitStatus.textContent = error.message;
        submitStatus.dataset.error = 'true';
      } finally {
        for (const control of form.elements) control.disabled = false;
      }
    });
    load();
  }

  async function loadVisitorPost() {
    const container = document.querySelector('.visitor-post');
    const status = document.querySelector('.visitor-post-status');
    try {
      const { post } = await api({ type: 'post', id: postId || '' });
      document.title = `${post.title} | Solace Community`;
      container.replaceChildren(element('div', 'community-eyebrow', 'Community · Visitor-authored post'), element('h1', '', post.title), element('p', 'article-byline', `By ${post.name} · ${new Date(post.createdAt).toLocaleDateString()}`), element('aside', 'editorial-note', 'This is an unverified visitor contribution, not a statement, endorsement, or service guarantee from Solace Cyber Workstations. Never share sensitive information.'));
      if (post.imageKey) container.append(imageNode(post));
      container.append(element('p', 'visitor-post-content', post.content));
      status.textContent = '';
      section('comments', post.id);
    } catch (error) {
      status.textContent = error.message;
      const retry = element('button', '', 'Try again');
      retry.type = 'button';
      retry.addEventListener('click', () => { retry.remove(); loadVisitorPost(); });
      status.append(document.createTextNode(' '), retry);
    }
  }

  if (isVisitorPost) loadVisitorPost();
  else if (isArticle) section('comments', slug);
  else if (isBlog) section('posts');
  else section('reviews');
  if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
})();
