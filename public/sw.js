// Cache version is bumped on every deploy so old caches get evicted.
// When you change cache strategy, also bump the major number.
const CACHE_PREFIX = 'bitelens-';
const CACHE = `${CACHE_PREFIX}v3`;

// Static, hash-immutable assets: cache-first (they never change at the same URL).
const IMMUTABLE_PREFIXES = ['/_next/static/', '/_next/image'];

// Offline fallback target. Cached on install.
const OFFLINE_FALLBACK = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.add(new Request(OFFLINE_FALLBACK, { cache: 'reload' })))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE)
        .map((k) => caches.delete(k)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first for hash-immutable static bundles.
  if (IMMUTABLE_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first with a cache fallback for everything else (HTML, JSON, icons).
  // This is the key fix: deploys are picked up on the next online navigation.
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return new Response('', { status: 504 });
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    // Only cache complete (200) GETs; skip opaque/partial responses.
    if (res && res.status === 200 && res.type === 'basic') {
      const cache = await caches.open(CACHE);
      cache.put(request, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const fallback = await caches.match(OFFLINE_FALLBACK);
      if (fallback) return fallback;
    }
    return new Response('', { status: 504 });
  }
}

// When the page tells us "I want to update now", swap immediately.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
