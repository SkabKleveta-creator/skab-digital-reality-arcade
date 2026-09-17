'use strict';
const ROOT=new URL('./',self.registration.scope);
const PREFIX='neon-shinobi:'+encodeURIComponent(ROOT.pathname)+':';
const CACHE=PREFIX+'2.0.2';
const ASSETS=['./','index.html','css/game.css?v=2.0.2','js/store.js?v=2.0.2','js/game.js?v=2.0.2','js/campaign.js?v=2.0.2','js/controls.js?v=2.0.2','js/ui.js?v=2.0.2','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png'].map(path=>new URL(path,ROOT).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'}))))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
  const isShell=url.pathname===ROOT.pathname||url.pathname===ROOT.pathname+'index.html';
  if(!isShell&&!ASSETS.includes(url.href))return;
  // A running installation serves one complete release. Updates wait for open tabs to close.
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(isShell?new URL('index.html',ROOT).href:request))||fetch(request)));
});
