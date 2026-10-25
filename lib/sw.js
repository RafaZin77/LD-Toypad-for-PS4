'use strict';
// Service worker do painel LEGO Dimensions Toy Pad (criado por RafaZin77).
// Guarda só a "casca" do app e as imagens. A API NUNCA é guardada: o painel precisa do servidor ligado para funcionar.
const VERSION = '__VERSION__';
const SHELL = `toypad-shell-${VERSION}`;
const MEDIA = `toypad-media-${VERSION}`;
const SHELL_URLS = ['/', '/i18n.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('toypad-') && k !== SHELL && k !== MEDIA).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const OFFLINE = {
  pt: 'Sem conexão com o servidor do painel. Ele está ligado? (no Termux: npm start)',
  en: 'No connection to the panel server. Is it running? (in Termux: npm start)',
  es: 'Sin conexión con el servidor del panel. ¿Está encendido? (en Termux: npm start)',
};
const offlineApi = (req) => {
  const l = String(req.headers.get('X-Lang') || '').slice(0, 2).toLowerCase();
  return new Response(JSON.stringify({ error: OFFLINE[l] || OFFLINE.pt }), { status: 503, headers: { 'Content-Type': 'application/json' } });
};

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) { e.respondWith(fetch(req).catch(() => offlineApi(req))); return; }

  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/i18n.js') {
    // Rede primeiro: uma versão nova do painel aparece assim que o servidor responde.
    e.respondWith(fetch(req).then((res) => {
      if (res && res.ok) caches.open(SHELL).then((c) => c.put(url.pathname === '/i18n.js' ? req : '/', res.clone()));
      return res;
    }).catch(() => caches.match(url.pathname === '/i18n.js' ? req : '/')));
    return;
  }

  if (/^\/(portraits|assets|theme-files|icons)\//.test(url.pathname)) { e.respondWith(staleWhileRevalidate(req, MEDIA)); return; }
  e.respondWith(staleWhileRevalidate(req, SHELL));
});
