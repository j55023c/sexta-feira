// ─── Sexta-feira HQ · Service Worker ───────────────────────────────
// Mude o número da versão sempre que atualizar o app.
// Isso força todos os dispositivos a baixar a versão nova.
const VERSION = 'sfhq-v4';

const CORE_FILES = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'
];

// ── Instalação: faz cache dos arquivos principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(cache => {
      // Tenta cachear cada arquivo individualmente para não travar se um falhar
      return Promise.allSettled(
        CORE_FILES.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Ativação: remove caches de versões antigas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first para assets, network-first para index.html
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Só intercepta GET
  if (event.request.method !== 'GET') return;

  // Para index.html: tenta rede primeiro (pega atualizações), cai no cache
  if (url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(VERSION).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Para tudo mais: cache primeiro, rede como fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(VERSION).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
