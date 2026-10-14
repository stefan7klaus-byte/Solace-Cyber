/* Shared Chain Search access button for every page except the homepage, which has its own launcher. */
(()=>{'use strict';
if(document.getElementById('scw-explorer-open')||document.querySelector('.scw-global-chain-search'))return;
const link=document.createElement('link');
link.rel='stylesheet';
link.href='https://solacecyberwork.online/assets/global-chain-search.css';
document.head.appendChild(link);
const button=document.createElement('a');
button.className='scw-global-chain-search';
button.href='https://solacecyberwork.online/index.html#chain-search';
button.setAttribute('aria-label','Open Chain Search for public blockchain data');
button.title='Search public blockchain data without leaving Solace Cyber';
button.innerHTML='<span class="scw-chain-mark" aria-hidden="true">✦</span><span>Chain Search</span>';
document.body.appendChild(button);
})();