(() => {
  function normalizeBasePath(value) {
    const path = String(value || "").trim().replace(/\/+$/, "");
    return path && path !== "/" ? `/${path.replace(/^\/+/, "")}` : "";
  }

  const basePath = normalizeBasePath(
    document.querySelector('meta[name="heretic-base-path"]')?.content || ""
  );

  function siteHref(path) {
    if (!path || !path.startsWith("/") || path.startsWith("//")) {
      return path;
    }
    return `${basePath}${path}`;
  }

  function sameOriginUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      return url.origin === window.location.origin ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function currentPageUrl() {
    const url = new URL(window.location.href);
    url.hash = "";
    return url.href;
  }

  function shellAssetUrls() {
    const urls = [
      currentPageUrl(),
      ...Array.from(document.querySelectorAll('link[rel="stylesheet"][href], link[rel="manifest"][href]'), (node) => node.href),
      ...Array.from(document.querySelectorAll("script[src]"), (node) => node.src),
    ].map(sameOriginUrl).filter(Boolean);
    return [...new Set(urls)];
  }

  function setOfflineStatus(isOffline) {
    document.documentElement.dataset.offline = isOffline ? "true" : "false";
    document.querySelectorAll("[data-offline-status]").forEach((node) => {
      node.hidden = !isOffline;
      node.textContent = isOffline ? "Offline" : "";
    });
  }

  function bindOfflineStatus() {
    setOfflineStatus(navigator.onLine === false);
    window.addEventListener("online", () => setOfflineStatus(false));
    window.addEventListener("offline", () => setOfflineStatus(true));
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
      return;
    }
    const scope = siteHref("/") || "/";
    navigator.serviceWorker.register(siteHref("/service-worker.js"), { scope }).then((registration) => {
      primeOfflineShell(registration);
    }).catch(() => {
      // Offline support is progressive enhancement; the app remains usable without it.
    });
  }

  function primeOfflineShell(registration) {
    const send = () => {
      const worker = registration.active || navigator.serviceWorker.controller;
      worker?.postMessage({ type: "CACHE_URLS", urls: shellAssetUrls() });
    };
    if (document.readyState === "complete") {
      window.setTimeout(send, 0);
      return;
    }
    window.addEventListener("load", () => window.setTimeout(send, 0), { once: true });
  }

  function initPwa() {
    bindOfflineStatus();
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPwa);
  } else {
    initPwa();
  }
})();
