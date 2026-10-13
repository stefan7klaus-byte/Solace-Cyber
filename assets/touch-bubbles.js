(()=>{'use strict';
if(window.__scwTouchBubbles)return;window.__scwTouchBubbles=true;
const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const layer=document.createElement('div');layer.className='scw-touch-bubble-layer';layer.setAttribute('aria-hidden','true');
const start=()=>{if(!document.body)return;document.body.appendChild(layer)};
if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
let last=0;
function bubbles(x,y,count=4){if(reduce||!layer.isConnected)return;const now=performance.now();if(now-last<38)return;last=now;for(let i=0;i<count;i++){const b=document.createElement('span');b.className='scw-touch-bubble';const size=5+Math.random()*15;b.style.left=(x+(Math.random()-.5)*24)+'px';b.style.top=(y+(Math.random()-.5)*18)+'px';b.style.setProperty('--size',size+'px');b.style.setProperty('--duration',(620+Math.random()*560)+'ms');b.style.setProperty('--drift',((Math.random()-.5)*70)+'px');b.style.setProperty('--rise',(35+Math.random()*85)+'px');layer.appendChild(b);b.addEventListener('animationend',()=>b.remove(),{once:true});setTimeout(()=>b.remove(),1500)}}
document.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&e.buttons===0)bubbles(e.clientX,e.clientY,2)},{passive:true});
document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const t=e.target;if(t&&t.closest&&t.closest('a,button,input,select,textarea,summary,.card,.visual,img,.btn,.scw-entry,.scw-community'))bubbles(e.clientX,e.clientY,6)},{passive:true});
document.addEventListener('pointerdown',e=>bubbles(e.clientX,e.clientY,8),{passive:true});
})();
