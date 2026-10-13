(() => {
  const toggle = document.getElementById('support-chat-toggle');
  if (!toggle) return;
  const panel = document.createElement('dialog');
  panel.id = 'support-chat';
  panel.className = 'support-panel';
  panel.setAttribute('aria-labelledby', 'support-title');
  panel.innerHTML = `
    <header class="support-panel-header"><div><h2 id="support-title">Solace Cyber Workstations</h2><p>AI support · Human help by phone or WhatsApp</p></div><button class="support-close" type="button" aria-label="Close AI support">×</button></header>
    <nav class="support-channels" aria-label="Contact our team"><a href="tel:+12092944699">+1 (209) 294-4699</a><a href="https://wa.me/12092944699" target="_blank" rel="noopener noreferrer">WhatsApp</a><a href="mailto:Solace.cyber.workstations@mail.com">Email</a></nav>
    <div class="support-chat-scroll"><div class="support-messages" role="log" aria-live="polite" aria-relevant="additions" aria-label="Support conversation"></div><div class="support-options" aria-label="Suggested replies"></div><p class="support-status" role="status"></p><p class="support-error" role="alert" hidden></p></div>
    <p class="support-privacy">By sending, you agree that messages, including contact details you share, are saved for support and processed by our AI provider. We create a team follow-up request only after confirmation. Never send passwords, keys, recovery phrases, or identity documents.</p>
    <form class="support-form"><label for="support-message">Your message<textarea id="support-message" maxlength="1000" required placeholder="Describe your question, without secrets"></textarea></label><button class="support-send" type="submit">Send</button></form>`;
  document.body.append(panel);
  const log = panel.querySelector('.support-messages');
  const options = panel.querySelector('.support-options');
  const status = panel.querySelector('.support-status');
  const error = panel.querySelector('.support-error');
  const scroll = panel.querySelector('.support-chat-scroll');
  const form = panel.querySelector('.support-form');
  const input = panel.querySelector('textarea');
  const sendButton = panel.querySelector('.support-send');
  let loading = false;
  let renderedCount = 0;
  let renderedMessages = [];

  function setBusy(busy) {
    loading = busy;
    input.readOnly = busy;
    sendButton.disabled = busy;
    options.querySelectorAll('button').forEach(button => { button.disabled = busy; });
    status.textContent = busy ? 'Our AI support is responding…' : '';
    log.setAttribute('aria-busy', String(busy));
  }

  function display(data) {
    const messages = data.messages;
    if (!Array.isArray(messages)) throw new Error('We couldn’t load the conversation. Please try again.');
    if (messages.length < renderedCount || messages.slice(0, renderedCount).some((message, index) => message.role !== renderedMessages[index]?.role || message.content !== renderedMessages[index]?.content)) {
      log.replaceChildren();
      renderedCount = 0;
    }
    for (const message of messages.slice(renderedCount)) {
      const bubble = document.createElement('p');
      bubble.className = 'support-message';
      bubble.dataset.role = message.role;
      const label = document.createElement('span');
      label.className = 'support-message-label';
      label.textContent = message.role === 'user' ? 'You' : 'Solace · AI';
      bubble.append(label, document.createTextNode(message.content));
      log.append(bubble);
    }
    renderedCount = messages.length;
    renderedMessages = messages;
    options.replaceChildren();
    const suggestions = data.submitted ? [] : data.awaiting === 'consent'
      ? ['Save request', 'Not now']
      : data.awaiting ? ['Skip']
      : messages.length === 1
        ? ['Vulnerability Assessment & Penetration Testing', 'Web Application Security', 'Network & Endpoint Testing', 'Social Engineering & Configuration Reviews', 'Forensics & Incident Response', 'Threat Modeling & Consulting', 'Lawful Asset & Crypto Tracing', 'Request a quote']
        : ['Request a quote', 'Request team follow-up'];
    for (const suggestion of suggestions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'support-option';
      button.textContent = suggestion;
      button.addEventListener('click', () => { submit(suggestion); });
      options.append(button);
    }
    scroll.scrollTop = scroll.scrollHeight;
  }

  async function request(message) {
    const response = await fetch('/api/chat', {
      method: message ? 'POST' : 'GET',
      credentials: 'same-origin',
      headers: message ? { 'Content-Type': 'application/json' } : {},
      body: message ? JSON.stringify({ message }) : undefined,
      signal: AbortSignal.timeout(45000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || (response.status === 429 ? 'Please wait a minute before trying again, or contact our team directly.' : 'Our AI support is temporarily unavailable. Please use WhatsApp or call our team.'));
    return data;
  }

  async function submit(message) {
    if (loading || !message.trim()) return;
    error.hidden = true;
    setBusy(true);
    try {
      display(await request(message));
      input.value = '';
    } catch (failure) {
      error.textContent = failure.name === 'TimeoutError' ? 'This reply is taking too long. Please try again or contact our team directly.' : failure.message || 'We couldn’t connect. Please try again or use WhatsApp.';
      error.hidden = false;
      if (!input.value) input.value = message;
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  toggle.hidden = false;
  toggle.addEventListener('click', async () => {
    if (panel.open) {
      panel.close();
      return;
    }
    panel.show();
    toggle.setAttribute('aria-expanded', 'true');
    input.focus();
    if (loading) return;
    error.hidden = true;
    setBusy(true);
    try {
      display(await request());
    } catch (failure) {
      error.textContent = failure.message || 'We couldn’t load chat. You can still call or message our team.';
      error.hidden = false;
    } finally {
      setBusy(false);
    }
  });
  panel.querySelector('.support-close').addEventListener('click', () => panel.close());
  panel.addEventListener('close', () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      panel.close();
    }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    submit(input.value);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submit(input.value);
    }
  });
})();
