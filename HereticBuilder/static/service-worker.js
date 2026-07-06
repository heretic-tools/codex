const CACHE_PREFIX = "heretic-tools";
const CACHE_VERSION = "pwa-v1";
const SHELL_CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}-runtime`;
const CACHE_NAMES = [SHELL_CACHE, RUNTIME_CACHE];

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./static/desktop.css",
  "./static/codex.css",
  "./static/theme.js",
  "./static/pwa.js",
];

function shouldHandle(request) {
  if (request.method !== "GET") {
    return false;
  }
  const url = new URL(request.url);
  return url.origin === self.location.origin;
}

function isCacheFirstPath(pathname) {
  return pathname.includes("/static/")
    || pathname.includes("/assets/")
    || pathname.includes("/builder-data/")
    || pathname.includes("/search-index/");
}

async function putIfOk(cacheName, request, response) {
  if (!response || !response.ok) {
    return response;
  }
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  return putIfOk(RUNTIME_CACHE, request, response);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return putIfOk(SHELL_CACHE, request, response);
  } catch (_error) {
    const cached = (await caches.match(request))
      || (await caches.match("./index.html"))
      || (await caches.match("./"));
    return cached || new Response("Offline", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      status: 503,
      statusText: "Offline",
    });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && !CACHE_NAMES.includes(name))
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!shouldHandle(request)) {
    return;
  }
  const url = new URL(request.url);
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (isCacheFirstPath(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
