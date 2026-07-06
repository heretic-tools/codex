(() => {
  const FAVORITES_KEY = "hereticCodexFavorites";
  const RECENTS_KEY = "hereticCodexRecent";
  const MAX_ITEMS = 8;
  const SKIPPED_PAGE_CLASSES = new Set(["codex-root-page", "faction-list-page"]);

  function readList(key) {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value.filter((item) => item && item.href && item.title) : [];
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
    return `${url.pathname}${search ? `?${search}` : ""}${url.hash}`;
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
    };
  }

  function uniqueWithFirst(record, items) {
    return [
      record,
      ...items.filter((item) => normalizedHref(item.href) !== record.href),
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
    const items = favorites().filter((item) => normalizedHref(item.href) !== record.href);
    writeList(FAVORITES_KEY, enabled ? [record, ...items] : items);
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
        link.href = item.href;
        const name = document.createElement("span");
        name.className = "local-library-link-title";
        name.textContent = item.title;
        const meta = document.createElement("span");
        meta.className = "local-library-link-meta";
        meta.textContent = item.type || "Codex";
        link.append(name, meta);
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
    recents,
    rememberRecent,
    renderLocalLibrary,
  };
})();
