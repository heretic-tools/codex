(() => {
  const FAVORITES_KEY = "hereticCodexFavorites";
  const RECENTS_KEY = "hereticCodexRecent";
  const MAX_ITEMS = 8;
  const CORE_RULES_IMAGE_URL = "/assets/faction-images/core-rules__4cdf7a87__roster-header.png";
  const SKIPPED_PAGE_CLASSES = new Set(["codex-root-page", "faction-list-page"]);
  const CODEX_ROOT_SEGMENTS = new Set(["chaos", "core-rules", "faction", "imperium", "xenos"]);
  const basePath = normalizeBasePath(document.querySelector('meta[name="heretic-base-path"]')?.content || "");

  function normalizeBasePath(value) {
    const path = String(value || "").trim().replace(/\/+$/, "");
    return path && path !== "/" ? `/${path.replace(/^\/+/, "")}` : "";
  }

  function stripBasePath(pathname) {
    if (!basePath) {
      return pathname || "/";
    }
    if (pathname === basePath) {
      return "/";
    }
    if (pathname.startsWith(`${basePath}/`)) {
      return pathname.slice(basePath.length) || "/";
    }
    return pathname || "/";
  }

  function siteHref(path) {
    if (!path || !path.startsWith("/") || path.startsWith("//")) {
      return path;
    }
    return `${basePath}${path}`;
  }

  function canonicalCodexPath(pathname) {
    const path = stripBasePath(pathname) || "/";
    if (path === "/codex" || path.startsWith("/codex/")) {
      return path;
    }
    const segment = path.split("/").filter(Boolean)[0] || "";
    if (CODEX_ROOT_SEGMENTS.has(segment)) {
      return `/codex${path}`;
    }
    return path;
  }

  function readList(key) {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || "[]");
      if (!Array.isArray(value)) {
        return [];
      }
      return value
        .map(normalizedRecord)
        .filter((item) => item && item.href && item.title);
    } catch (_error) {
      return [];
    }
  }

  function writeList(key, items) {
    try {
      window.localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_ITEMS)));
    } catch (_error) {
      // Local Codex history is optional; content must remain readable without storage.
    }
  }

  function normalizedHref(value) {
    const url = new URL(value || window.location.href, window.location.origin);
    url.searchParams.delete("asset");
    const search = url.searchParams.toString();
    return `${canonicalCodexPath(url.pathname)}${search ? `?${search}` : ""}${url.hash}`;
  }

  function cssUrlValue(value) {
    const match = String(value || "").match(/url\((["']?)(.*?)\1\)/);
    return match ? match[2] : "";
  }

  function normalizedImageUrl(value) {
    if (!value) {
      return "";
    }
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin !== window.location.origin) {
        return "";
      }
      const path = stripBasePath(url.pathname);
      return path.startsWith("/assets/") ? `${path}${url.search}${url.hash}` : "";
    } catch (_error) {
      return "";
    }
  }

  function normalizedRecord(record) {
    if (!record || !record.href || !record.title) {
      return null;
    }
    const imageUrl = normalizedImageUrl(record.imageUrl);
    return {
      ...record,
      href: normalizedHref(record.href),
      ...(imageUrl ? { imageUrl } : {}),
    };
  }

  function pageType(main) {
    if (main.classList.contains("unit-detail-page")) {
      return "Datasheet";
    }
    if (main.classList.contains("detachment-detail-page")) {
      return "Detachment";
    }
    if (main.classList.contains("core-rule-page")) {
      return "Core Rule";
    }
    if (main.classList.contains("core-rules-faq-page")) {
      return "FAQ";
    }
    if (main.classList.contains("faction-home-page")) {
      return "Faction";
    }
    if (main.classList.contains("many-buttons-page")) {
      return "Index";
    }
    return "Codex";
  }

  function currentPageImage(main) {
    const header = document.querySelector(".app-header.faction-hero-title");
    const imageUrl = normalizedImageUrl(cssUrlValue(header?.style?.getPropertyValue("--faction-hero-image")));
    if (!imageUrl) {
      return {};
    }
    return {
      imageKind: main.classList.contains("unit-detail-page") ? "unit" : "faction",
      imageUrl,
    };
  }

  function currentPageRecord() {
    const main = document.querySelector(".codex-page");
    if (!main || [...SKIPPED_PAGE_CLASSES].some((className) => main.classList.contains(className))) {
      return null;
    }
    const title = document.querySelector(".app-title-text")?.textContent?.trim() || document.title || "Codex";
    return {
      href: normalizedHref(window.location.href),
      title,
      type: pageType(main),
      visitedAt: Date.now(),
      ...currentPageImage(main),
    };
  }

  function uniqueWithFirst(record, items) {
    const normalized = normalizedRecord(record);
    if (!normalized) {
      return items.slice(0, MAX_ITEMS);
    }
    return [
      normalized,
      ...items.filter((item) => normalizedHref(item.href) !== normalized.href),
    ].slice(0, MAX_ITEMS);
  }

  function rememberRecent(record) {
    if (!record) {
      return;
    }
    writeList(RECENTS_KEY, uniqueWithFirst(record, readList(RECENTS_KEY)));
  }

  function favorites() {
    return readList(FAVORITES_KEY);
  }

  function recents() {
    return readList(RECENTS_KEY);
  }

  function isFavorite(href) {
    const target = normalizedHref(href);
    return favorites().some((item) => normalizedHref(item.href) === target);
  }

  function setFavorite(record, enabled) {
    if (!record) {
      return;
    }
    const normalized = normalizedRecord(record);
    if (!normalized) {
      return;
    }
    const items = favorites().filter((item) => normalizedHref(item.href) !== normalized.href);
    writeList(FAVORITES_KEY, enabled ? [normalized, ...items] : items);
  }

  function syncFavoriteButton(button, record) {
    const active = isFavorite(record.href);
    button.classList.toggle("is-favorite", active);
    button.dataset.favoriteState = active ? "saved" : "save";
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", active ? "Remove from favorites" : "Save to favorites");
    button.title = active ? "Remove from favorites" : "Save to favorites";
    button.querySelector("[data-favorite-label]").textContent = active ? "Saved" : "Save";
  }

  function favoriteButton(record) {
    const button = document.createElement("button");
    button.className = "favorite-toggle";
    button.type = "button";
    const label = document.createElement("span");
    label.dataset.favoriteLabel = "true";
    button.append(label);
    button.addEventListener("click", () => {
      setFavorite(record, !isFavorite(record.href));
      syncFavoriteButton(button, record);
    });
    syncFavoriteButton(button, record);
    return button;
  }

  function localLibraryLinkLabel(item) {
    return `Open ${item.type || "Codex"}: ${item.title}`;
  }

  function fallbackLibraryImage(item) {
    const href = normalizedHref(item.href);
    if (href === "/codex/core-rules" || href.startsWith("/codex/core-rules/")) {
      return { imageKind: "faction", imageUrl: CORE_RULES_IMAGE_URL };
    }
    return {};
  }

  function libraryImage(item) {
    const imageUrl = normalizedImageUrl(item.imageUrl);
    if (imageUrl) {
      return { imageKind: item.imageKind || item.type || "Codex", imageUrl };
    }
    return fallbackLibraryImage(item);
  }

  function applyLibraryImage(link, item) {
    const { imageKind, imageUrl } = libraryImage(item);
    if (!imageUrl) {
      return false;
    }
    link.classList.add("has-local-image");
    link.dataset.imageKind = imageKind || item.type || "Codex";
    link.style.setProperty("--background-art", `url("${siteHref(imageUrl)}")`);
    return true;
  }

  function updateStoredImage(href, imageUrl, imageKind) {
    [FAVORITES_KEY, RECENTS_KEY].forEach((key) => {
      const items = readList(key);
      let changed = false;
      const next = items.map((item) => {
        if (normalizedHref(item.href) !== normalizedHref(href)) {
          return item;
        }
        changed = true;
        return {
          ...item,
          imageKind: imageKind || item.imageKind,
          imageUrl,
        };
      });
      if (changed) {
        writeList(key, next);
      }
    });
  }

  async function hydrateLibraryImage(link, item) {
    const image = libraryImage(item);
    if (image.imageUrl) {
      applyLibraryImage(link, item);
      if (!normalizedImageUrl(item.imageUrl)) {
        updateStoredImage(item.href, image.imageUrl, image.imageKind);
      }
      return;
    }
    if (typeof window.fetch !== "function") {
      return;
    }
    try {
      const response = await window.fetch(siteHref(normalizedHref(item.href)), { cache: "force-cache" });
      if (!response.ok) {
        return;
      }
      const html = await response.text();
      const match = html.match(/--faction-hero-image:\s*url\((["']?)(.*?)\1\)/);
      const imageUrl = normalizedImageUrl(match?.[2]);
      if (!imageUrl) {
        return;
      }
      const imageKind = item.type === "Datasheet" ? "unit" : "faction";
      applyLibraryImage(link, { ...item, imageKind, imageUrl });
      updateStoredImage(item.href, imageUrl, imageKind);
    } catch (_error) {
      // Missing thumbnails must never block the local library links.
    }
  }

  function renderList(root, title, items, emptyText) {
    const section = document.createElement("section");
    section.className = "local-library-section";
    const heading = document.createElement("h2");
    heading.className = "local-library-title";
    heading.textContent = title;
    const list = document.createElement("div");
    list.className = "local-library-list";
    if (items.length) {
      items.forEach((item) => {
        const link = document.createElement("a");
        link.className = "local-library-link";
        link.href = siteHref(normalizedHref(item.href));
        const label = localLibraryLinkLabel(item);
        link.setAttribute("aria-label", label);
        link.title = label;
        const name = document.createElement("span");
        name.className = "local-library-link-title";
        name.textContent = item.title;
        const meta = document.createElement("span");
        meta.className = "local-library-link-meta";
        meta.textContent = item.type || "Codex";
        link.append(name, meta);
        hydrateLibraryImage(link, item);
        list.append(link);
      });
    } else {
      const empty = document.createElement("p");
      empty.className = "local-library-empty";
      empty.textContent = emptyText;
      list.append(empty);
    }
    section.append(heading, list);
    root.append(section);
  }

  function renderLocalLibrary(root) {
    if (!root) {
      return;
    }
    root.replaceChildren();
    renderList(root, "Favorites", favorites(), "No saved Codex pages");
    renderList(root, "Recent", recents(), "No recent Codex pages");
  }

  window.HereticCodexLocal = {
    currentPageRecord,
    favoriteButton,
    favorites,
    localLibraryLinkLabel,
    recents,
    rememberRecent,
    renderLocalLibrary,
  };
})();
