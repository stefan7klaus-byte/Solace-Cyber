/* Shared Chain Search launcher across the full Solace site. */
(()=>{'use strict';
if(document.querySelector('.scw-global-chain-search'))return;
const css=document.createElement('link');
css.rel='stylesheet';css.href='/assets/global-chain-search.css';document.head.appendChild(css);
const button=document.createElement('button');
button.type='button';button.className='scw-global-chain-search';
button.setAttribute('aria-label','Open Chain Search for public blockchain data');
button.title='Search public blockchain data without leaving Solace Cyber';
button.innerHTML='<span class="scw-chain-mark" aria-hidden="true">✦</span><span>Chain Search</span>';
const existingOpen=document.getElementById('scw-explorer-open');
if(existingOpen){
 // This page already has its own Chain Search button in the navigation.
 // Do not add a duplicate floating launcher at the bottom-right.
 return;
}else{
 button.addEventListener('click',()=>{window.location.href='/index.html#scw-chain-explorer'});
}
document.body.appendChild(button);
})();
/* Persistent floating link to the crypto tracing and recovery library. */
if(!document.querySelector('.scw-floating-guides-link')){
 const guideStyle=document.createElement('style');
 guideStyle.textContent=`
 .scw-floating-guides-link{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9997;display:flex;align-items:center;gap:10px;max-width:min(340px,calc(100vw - 24px));padding:12px 18px;border:1px solid rgba(168,240,198,.65);border-radius:14px;background:rgba(13,28,21,.96);color:#eaf8ef;text-decoration:none;box-shadow:0 8px 28px rgba(0,0,0,.32);font:600 13px/1.35 Inter,system-ui,sans-serif;backdrop-filter:blur(10px);transition:transform .18s ease,border-color .18s ease}
 .scw-floating-guides-link:hover{transform:translate(-50%,-3px);border-color:#a8f0c6}
 .scw-floating-guides-link .scw-guides-icon{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;border-radius:10px;background:#a8f0c6;color:#102017;font-size:18px}
 .scw-floating-guides-link small{display:block;margin-top:3px;color:#b8cfc0;font-size:11px;font-weight:400}
 @media(max-width:600px){.scw-floating-guides-link{left:50%;bottom:12px;max-width:calc(100vw - 24px);padding:10px 14px;font-size:12px}}
 @media(prefers-reduced-motion:reduce){.scw-floating-guides-link{transition:none}}
 `;
 document.head.appendChild(guideStyle);
 const link=document.createElement('a');
 link.className='scw-floating-guides-link';
 link.href='/crypto-tracing-recovery.html';
 link.setAttribute('aria-label','Open the 150 Crypto Tracing and Recovery Guides');
 link.innerHTML='<span class="scw-guides-icon" aria-hidden="true">↗</span><span>Crypto Tracing &amp; Recovery<small>Explore 150 practical guides</small></span>';
 document.body.appendChild(link);
}
