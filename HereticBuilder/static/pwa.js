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
    navigator.serviceWorker.register(siteHref("/service-worker.js"), { scope }).catch(() => {
      // Offline support is progressive enhancement; the app remains usable without it.
    });
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
