// Szándékosan minimális, "app-shell" szintű service worker - ez egy CRM, ahol
// elavult, cache-elt ügyfél-/fizetési adat aktívan félrevezető lehetne, ezért:
// - minden navigálás network-first, csak teljes offline esetén esik vissza a cache-re
// - semmilyen /api/ kérést és semmilyen nem-GET kérést nem érint (azok mindig a hálózatra mennek)
// - csak a statikus, nem-érzékeny asseteket (ikonok, offline oldal) cache-eli

const CACHE_NAME = "thecode-crm-shell-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE_ASSETS = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
