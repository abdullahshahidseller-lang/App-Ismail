const CACHE = 'ismail-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.url.includes('/api/') || req.url.includes('script.google.com')) return;
  e.respondWith(caches.match(req).then(cached=>{
    return cached || fetch(req).then(res=>{
      if(req.method==='GET' && res.ok){
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
      }
      return res;
    }).catch(()=>cached);
  }));
});
