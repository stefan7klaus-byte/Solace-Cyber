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
 button.addEventListener('click',()=>existingOpen.click());
}else{
 button.addEventListener('click',()=>{window.location.href='/index.html#scw-chain-explorer'});
}
document.body.appendChild(button);
})();