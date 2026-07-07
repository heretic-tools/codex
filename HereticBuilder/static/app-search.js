(() => {
  const root = document.querySelector(".app-search");
  if (!root) {
    return;
  }

  const input = root.querySelector(".app-search-input");
  const results = root.querySelector(".app-search-results");
  const resultList = document.createElement("div");
  const clearButton = document.createElement("button");
  let searchTimer = 0;
  let staticSearchIndexPromise = null;

  resultList.className = "app-search-results-list";
  resultList.setAttribute("role", "list");
  results.removeAttribute("role");
  results.id = results.id || "app-search-results";
  results.replaceChildren(resultList);
  input.setAttribute("aria-controls", results.id);

  clearButton.className = "app-search-clear";
  clearButton.type = "button";
  clearButton.setAttribute("aria-label", "Clear search");
  clearButton.title = "Clear search";
  clearButton.textContent = "x";
  input.after(clearButton);

  const APP_FOOTER_GAP = 54;
  const basePath = normalizeBasePath(document.querySelector('meta[name="heretic-base-path"]')?.content || "");
  const staticSearchIndexUrl = document.querySelector('meta[name="heretic-search-index"]')?.content || siteHref("/search-index/manifest.json");

  function normalizeBasePath(value) {
    const path = String(value || "").trim().replace(/\/+$/, "");
    return path && path !== "/" ? `/${path.replace(/^\/+/, "")}` : "";
  }

  function siteHref(path) {
    if (!path || !path.startsWith("/") || path.startsWith("//")) {
      return path;
    }
    return `${basePath}${path}`;
  }

  function compactText(...values) {
    return values
      .map((value) => String(value || ""))
      .join(" ")
      .replace(/\*+/g, "")
      .replace(/■/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function searchTokens(value) {
    return compactText(value).toLocaleLowerCase().match(/[\p{L}\p{N}_']+/gu) || [];
  }

  function clippedExcerpt(text, query, tokens) {
    const source = compactText(text);
    if (!source) {
      return "";
    }
    const folded = source.toLocaleLowerCase();
    const queryIndex = folded.indexOf(query);
    const indexes = queryIndex >= 0 ? [queryIndex] : tokens
      .map((token) => folded.indexOf(token))
      .filter((index) => index >= 0);
    const start = Math.max(0, (indexes.length ? Math.min(...indexes) : 0) - 48);
    const end = Math.min(source.length, start + 180);
    let excerpt = source.slice(start, end).trim();
    if (start > 0) {
      excerpt = `...${excerpt}`;
    }
    if (end < source.length) {
      excerpt = `${excerpt}...`;
    }
    return excerpt;
  }

  function resultScore(item, query, tokens) {
    const title = compactText(item.title).toLocaleLowerCase();
    const meta = compactText(item.meta).toLocaleLowerCase();
    const text = compactText(item.text).toLocaleLowerCase();
    const haystack = `${title} ${meta} ${text}`;
    if (!tokens.every((token) => haystack.includes(token))) {
      return null;
    }

    let score = 0;
    if (title === query) {
      score += 300;
    } else if (title.startsWith(query)) {
      score += 220;
    } else if (title.includes(query)) {
      score += 160;
    } else if (meta.includes(query)) {
      score += 80;
    } else if (text.includes(query)) {
      score += 40;
    }

    tokens.forEach((token) => {
      if (title.startsWith(token)) {
        score += 60;
      } else if (title.includes(token)) {
        score += 45;
      } else if (meta.includes(token)) {
        score += 25;
      } else if (text.includes(token)) {
        score += 10;
      }
    });
    return score;
  }

  function matchStaticResults(items, query, limit) {
    const queryText = compactText(query).toLocaleLowerCase();
    const tokens = searchTokens(query);
    if (!queryText || !tokens.length) {
      return [];
    }

    const seen = new Set();
    const matched = [];
    items.forEach((item) => {
      if (!item.title || !item.href) {
        return;
      }
      const key = [item.type || "", String(item.title).toLocaleLowerCase(), item.href].join("\u0000");
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      const score = resultScore(item, queryText, tokens);
      if (score === null) {
        return;
      }
      matched.push({
        score,
        type: item.type || "Result",
        title: compactText(item.title),
        meta: compactText(item.meta),
        excerpt: clippedExcerpt(item.text, queryText, tokens),
        href: item.href,
      });
    });

    matched.sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (left.type !== right.type) {
        return left.type.localeCompare(right.type);
      }
      return left.title.localeCompare(right.title);
    });
    return matched.slice(0, limit).map(({ score: _score, ...item }) => item);
  }

  function searchIndexHref(path) {
    if (!path || !path.startsWith("/") || path.startsWith("//")) {
      return path;
    }
    return siteHref(path);
  }

  async function fetchSearchIndexPayload(url) {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Search index failed: ${response.status}`);
    }
    return response.json();
  }

  async function loadSearchIndexPayload() {
    const payload = await fetchSearchIndexPayload(staticSearchIndexUrl);
    if (Array.isArray(payload.items)) {
      return payload.items;
    }
    const shards = Array.isArray(payload.shards) ? payload.shards : [];
    const shardItems = await Promise.all(shards.map(async (shard) => {
      const shardPayload = await fetchSearchIndexPayload(searchIndexHref(shard.path));
      return shardPayload.items || [];
    }));
    return shardItems.flat();
  }

  function loadStaticSearchIndex() {
    if (!staticSearchIndexPromise) {
      staticSearchIndexPromise = loadSearchIndexPayload();
    }
    return staticSearchIndexPromise;
  }

  // Keep the results panel above the on-screen keyboard. On mobile the panel is
  // fixed to the bottom of the layout viewport, but the keyboard does not shrink
  // the layout viewport (notably on iOS), so the panel would hide behind it. The
  // VisualViewport API reports the keyboard inset, letting us lift the panel and
  // cap its height to the visible area.
  function positionResults() {
    if (results.hidden) {
      return;
    }
    const viewport = window.visualViewport;
    const isFixed = getComputedStyle(results).position === "fixed";
    if (!viewport || !isFixed) {
      results.style.bottom = "";
      results.style.maxHeight = "";
      return;
    }
    const keyboardInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    results.style.bottom = `${keyboardInset + APP_FOOTER_GAP}px`;
    results.style.maxHeight = `${Math.max(120, Math.round(viewport.height - APP_FOOTER_GAP - 12))}px`;
  }

  function setOpen(open) {
    root.classList.toggle("is-open", open);
    input.setAttribute("aria-expanded", String(open));
    results.hidden = !open;
    if (open) {
      positionResults();
    } else {
      results.style.bottom = "";
      results.style.maxHeight = "";
    }
  }

  function syncClearButton() {
    root.classList.toggle("has-value", Boolean(input.value.trim()));
  }

  function clearResults() {
    resultList.replaceChildren();
    setOpen(false);
  }

  function resultText(value) {
    return String(value || "").trim();
  }

  function resultLinkLabel(item) {
    const type = resultText(item.type) || "Result";
    const title = resultText(item.title) || "Untitled";
    return `Open ${type}: ${title}`;
  }

  function resultLinks() {
    return Array.from(resultList.querySelectorAll(".app-search-result"));
  }

  function focusResult(index) {
    const links = resultLinks();
    if (!links.length) {
      return false;
    }
    const targetIndex = ((index % links.length) + links.length) % links.length;
    links[targetIndex].focus();
    return true;
  }

  function renderMessage(message) {
    const item = document.createElement("div");
    item.className = "app-search-message";
    item.textContent = message;
    resultList.replaceChildren(item);
    setOpen(true);
  }

  function groupedResults(items) {
    const groups = [];
    const byType = new Map();
    items.forEach((item) => {
      const type = resultText(item.type) || "Results";
      if (!byType.has(type)) {
        const group = { type, items: [] };
        byType.set(type, group);
        groups.push(group);
      }
      byType.get(type).items.push(item);
    });
    return groups;
  }

  function resultLink(item) {
    const link = document.createElement("a");
    const label = resultLinkLabel(item);
    link.className = "app-search-result";
    link.href = siteHref(item.href);
    link.title = label;
    link.setAttribute("aria-label", label);
    link.setAttribute("role", "listitem");

    const title = document.createElement("span");
    title.className = "app-search-result-title";
    title.textContent = resultText(item.title);
    link.append(title);

    const meta = document.createElement("span");
    meta.className = "app-search-result-meta";
    const context = resultText(item.meta);
    meta.textContent = context || resultText(item.type);
    link.append(meta);

    return link;
  }

  function renderResults(items) {
    resultList.replaceChildren();
    if (!items.length) {
      renderMessage("No results");
      return;
    }

    const fragment = document.createDocumentFragment();
    groupedResults(items).forEach((group) => {
      const section = document.createElement("section");
      section.className = "app-search-result-group";
      section.setAttribute("aria-label", group.type);

      const heading = document.createElement("div");
      heading.className = "app-search-result-group-title";
      heading.textContent = group.type;
      section.append(heading);

      group.items.forEach((item) => section.append(resultLink(item)));
      fragment.append(section);
    });
    resultList.append(fragment);
    setOpen(true);
  }

  async function runSearch(query) {
    try {
      const items = await loadStaticSearchIndex();
      if (input.value.trim() !== query) {
        return;
      }
      renderResults(matchStaticResults(items, query, 30));
    } catch (_error) {
      renderMessage("Search unavailable");
    }
  }

  function scheduleSearch() {
    window.clearTimeout(searchTimer);
    const query = input.value.trim();
    syncClearButton();
    if (query.length < 2) {
      clearResults();
      return;
    }
    searchTimer = window.setTimeout(() => runSearch(query), 160);
  }

  root.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  clearButton.addEventListener("click", () => {
    input.value = "";
    syncClearButton();
    clearResults();
    input.focus();
  });

  resultList.addEventListener("keydown", (event) => {
    const link = event.target?.closest?.(".app-search-result");
    if (!link) {
      return;
    }
    const links = resultLinks();
    const index = links.indexOf(link);
    if (index < 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusResult(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index === 0) {
        input.focus();
      } else {
        focusResult(index - 1);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      clearResults();
      input.focus();
    }
  });

  window.addEventListener("resize", positionResults);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", positionResults);
    window.visualViewport.addEventListener("scroll", positionResults);
  }

  input.addEventListener("input", scheduleSearch);
  input.addEventListener("focus", scheduleSearch);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
    if (event.key === "ArrowDown" && focusResult(0)) {
      event.preventDefault();
    }
    if (event.key === "ArrowUp" && focusResult(-1)) {
      event.preventDefault();
    }
    if (event.key === "Escape") {
      clearResults();
      input.blur();
    }
  });
  input.setAttribute("aria-keyshortcuts", "Control+K Meta+K");

  document.addEventListener("keydown", (event) => {
    if (String(event.key || "").toLocaleLowerCase() !== "k" || (!event.ctrlKey && !event.metaKey) || event.altKey) {
      return;
    }
    event.preventDefault();
    input.focus();
    input.select();
    scheduleSearch();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!root.contains(event.target)) {
      clearResults();
    }
  });

  syncClearButton();
})();
