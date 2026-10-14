/* Ensure Chain Search is available even on pages that do not render the support chat. */
(()=>{'use strict';if(document.querySelector('script[data-scw-global-chain-search]'))return;const s=document.createElement('script');s.src='/assets/global-chain-search.js';s.defer=true;s.dataset.scwGlobalChainSearch='true';document.head.appendChild(s)})();
(()=>{'use strict';
const toggle=document.getElementById('support-chat-toggle');if(!toggle)return;
toggle.hidden=false;
const panel=document.createElement('section');panel.className='support-chat-panel';panel.id='support-chat';panel.hidden=true;
panel.innerHTML='<div class="support-chat-head"><strong>Solace Cyber Workstations · Help</strong><button type="button" aria-label="Close chat">×</button></div><div class="support-chat-messages" role="log" aria-live="polite"><div class="support-chat-msg bot">Hello! I’m the Solace website help assistant. I can answer common questions about our services and how to contact us. This version runs directly in your browser and does not send your messages to an AI service. What would you like to know?</div></div><p class="support-chat-note">Never share passwords, recovery phrases, private keys, one-time codes, or identity documents here.</p><form class="support-chat-form"><input name="message" maxlength="1000" placeholder="Ask about services or contact…" required aria-label="Your message"><button type="submit">Send</button></form>';
document.body.appendChild(panel);
const messages=panel.querySelector('.support-chat-messages'),form=panel.querySelector('form'),input=form.querySelector('input');let busy=false;
function add(text,who){const div=document.createElement('div');div.className='support-chat-msg '+who;div.textContent=text;messages.appendChild(div);messages.scrollTop=messages.scrollHeight}
function open(){panel.hidden=false;toggle.setAttribute('aria-expanded','true');input.focus()}
function close(){panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()}
function replyFor(raw){
 const q=raw.toLowerCase().replace(/[^a-z0-9\s@.+-]/g,' '),has=pattern=>pattern.test(q);
 if(has(/\b(hello|hi|hey|good morning|good afternoon)\b/))return 'Hello! Welcome to Solace Cyber Workstations. I can help with service information, assessment steps, digital-asset access questions, and contact options. What are you looking for help with?';
 if(has(/\b(price|pricing|cost|quote|quotation|estimate|how much|fee|fees)\b/))return 'Pricing depends on the scope, authorization, available evidence, and complexity of the request. Use the Request an assessment form on this page to describe the situation without including secrets. You can also email Solace.cyber.workstations@mail.com. No outcome or recovery can be guaranteed.';
 if(has(/\b(contact|email|reach|phone|talk to|human|team|support person|call me)\b/))return 'You can contact Solace Cyber Workstations at Solace.cyber.workstations@mail.com, or use the Request an assessment form on this page. If you prefer WhatsApp, use the floating WhatsApp button. Please do not send passwords, seed phrases, or private keys.';
 if(has(/\b(crypto|cryptocurrency|wallet|bitcoin|ethereum|funds|asset recovery|recover.*(coin|wallet|crypto|funds))\b/))return 'We can discuss a lawful digital-asset access assessment and help identify what information may be relevant. Recovery is never guaranteed. Never share your seed phrase, private key, password, or one-time code. Start with the Request an assessment form and describe the wallet type and issue in general terms only.';
 if(has(/\b(hack|hacking|penetration|vulnerability|web application|network security|cybersecurity|security test|ethical hacking)\b/))return 'We can discuss authorized security work such as vulnerability assessments, penetration testing, web-application and network security reviews. Testing must be limited to systems you own or have explicit permission to assess. Use the Request an assessment form to describe your goals and authorized scope.';
 if(has(/\b(forensic|forensics|incident|breach|ransomware|malware|compromised|data leak|respond)\b/))return 'For a suspected security incident, preserve relevant logs and evidence, avoid making unnecessary changes to affected devices, and use a trusted clean device to secure important accounts. We can discuss digital forensics and incident-response assessment. If there is immediate operational risk, contact your internal security team or appropriate emergency response provider.';
 if(has(/\b(threat model|threat modeling|consult|consulting|risk|remediation)\b/))return 'We can discuss threat modeling, security consulting, risk review, and remediation planning. A useful first step is to outline the system or business process, your main concern, and what you are authorized to share. Use the Request an assessment form for a scoped conversation.';
 if(has(/\b(privacy|data|store|stored|record|save|messages)\b/))return 'This GitHub-hosted help assistant processes your question in your browser and does not send chat messages to an AI provider or save them to a chat backend. Please still avoid entering personal secrets or sensitive information. The separate website contact form may open your email application.';
 if(has(/\b(how does it work|process|first step|start|begin|assessment)\b/))return 'A good starting point is to describe your goal, the system or asset involved, what you are authorized to access, and any relevant non-sensitive evidence. We can then clarify scope and limitations before any work is agreed. Use the Request an assessment form on this page.';
 if(has(/\b(thank|thanks)\b/))return 'You’re welcome. If you need more specific guidance, ask about a service or contact the team at Solace.cyber.workstations@mail.com.';
 return 'I can answer common questions about cybersecurity assessments, digital forensics and incident response, threat modeling, lawful digital-asset access assessments, pricing requests, privacy, and contacting the team. For a question outside these topics, email Solace.cyber.workstations@mail.com or use Request an assessment. This is a local FAQ assistant, not a generative AI chatbot.';
}

// scw-mini-prompt-v2: show a small invitation; never open the chat automatically.
let scwChatInteracted=false;
let scwWelcomeTimer=null;
let scwMiniPrompt=null;
function scwShowMiniPrompt(message){
 if(!scwMiniPrompt){
   scwMiniPrompt=document.createElement('div');
   scwMiniPrompt.className='support-chat-mini-prompt';
   scwMiniPrompt.setAttribute('role','status');
   scwMiniPrompt.innerHTML='<span class="support-chat-mini-copy"></span><button type="button" class="support-chat-mini-close" aria-label="Dismiss chat invitation">×</button>';
   document.body.appendChild(scwMiniPrompt);
   scwMiniPrompt.querySelector('.support-chat-mini-close').addEventListener('click',()=>{scwMiniPrompt.hidden=true;if(scwWelcomeTimer)clearTimeout(scwWelcomeTimer)});
 }
 scwMiniPrompt.querySelector('.support-chat-mini-copy').textContent=message;
 scwMiniPrompt.hidden=false;
}
function scwAutoWelcome(){
 let alreadyWelcomed=false;
 try{alreadyWelcomed=sessionStorage.getItem('scw-mini-prompt-v2')==='1';}catch(_){}
 if(!alreadyWelcomed){
   try{sessionStorage.setItem('scw-mini-prompt-v2','1');}catch(_){}
   scwShowMiniPrompt('Hi! Need help finding a service? Open the chat whenever you’re ready.');
   scwWelcomeTimer=window.setTimeout(()=>{
     if(!scwChatInteracted&&scwMiniPrompt&&!scwMiniPrompt.hidden){
       scwShowMiniPrompt('I’m here if you need help. Click the chat button when you’re ready.');
     }
   },120000);
 }
}
toggle.addEventListener('click',()=>{scwChatInteracted=true;if(scwWelcomeTimer)clearTimeout(scwWelcomeTimer);if(scwMiniPrompt)scwMiniPrompt.hidden=true;panel.hidden?open():close()});
input.addEventListener('focus',()=>{scwChatInteracted=true;if(scwWelcomeTimer)clearTimeout(scwWelcomeTimer)});
scwAutoWelcome();

panel.querySelector('.support-chat-head button').addEventListener('click',close);
async function scwSendChatNotification(eventType,message,reply,sessionId){
 try{
   await fetch('/.netlify/functions/chat-notification',{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({eventType,message,reply,sessionId,page:location.pathname,occurredAt:new Date().toISOString()})
   });
 }catch(_){/* Chat remains usable if email notifications are temporarily unavailable. */}
}
let scwSessionId='';
try{scwSessionId=sessionStorage.getItem('scw-chat-session-id')||'';if(!scwSessionId){scwSessionId=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():'scw-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);sessionStorage.setItem('scw-chat-session-id',scwSessionId)}}catch(_){scwSessionId='scw-'+Date.now().toString(36)}
form.addEventListener('submit',e=>{
 e.preventDefault();const message=input.value.trim();if(!message||busy)return;
 busy=true;input.value='';input.disabled=true;add(message,'user');
 void scwSendChatNotification('visitor_message',message,'',scwSessionId);
 window.setTimeout(()=>{
   const reply=replyFor(message);add(reply,'bot');
   void scwSendChatNotification('chatbot_reply',message,reply,scwSessionId);
   busy=false;input.disabled=false;input.focus();
 },180);
});
})();