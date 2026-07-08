(() => {
  const launchers = Array.from(document.querySelectorAll(".launcher"));
  const appHeader = document.querySelector(".app-header");
  const page = document.querySelector(".codex-page");
  const ruleReturnStorageKey = "hereticCoreRuleReturnStack";
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

  function normalizeCoreRulePath(pathname) {
    const ruleMatch = pathname.match(/^(\/(?:codex\/)?core-rules)\/rule\/(\d{1,2})(?:\.00)?$/);
    if (ruleMatch) {
      return `${ruleMatch[1]}/section/${ruleMatch[2].padStart(2, "0")}`;
    }
    const sectionMatch = pathname.match(/^(\/(?:codex\/)?core-rules)\/section\/(\d{1,2})$/);
    if (sectionMatch) {
      return `${sectionMatch[1]}/section/${sectionMatch[2].padStart(2, "0")}`;
    }
    return pathname;
  }

  function normalizeInternalHref(pathname, search = "", hash = "") {
    let path = stripBasePath(pathname);
    path = path.replace(/\/+$/, "") || "/";
    path = normalizeCoreRulePath(path);
    return `${path}${search}${hash}`;
  }

  function currentHref() {
    return normalizeInternalHref(window.location.pathname, window.location.search, window.location.hash);
  }

  function sameOriginHref(value) {
    if (!value) {
      return "";
    }
    try {
      const url = new URL(value, window.location.href);
      if (url.origin !== window.location.origin) {
        return "";
      }
      return normalizeInternalHref(url.pathname, url.search, url.hash);
    } catch (_error) {
      return "";
    }
  }

  function navigationHref(value) {
    const target = sameOriginHref(value);
    if (!target) {
      return "";
    }
    try {
      const url = new URL(value, window.location.href);
      if (basePath && url.pathname === "/") {
        return `${url.pathname}${url.search}${url.hash}`;
      }
    } catch (_error) {
      return "";
    }
    return siteHref(target);
  }

  function ruleReturnStack() {
    try {
      const value = JSON.parse(window.sessionStorage.getItem(ruleReturnStorageKey) || "[]");
      if (!Array.isArray(value)) {
        return [];
      }
      return value.map((item) => {
        return {
          from: sameOriginHref(item?.from),
          to: sameOriginHref(item?.to),
        };
      }).filter((item) => item.from && item.to);
    } catch (_error) {
      return [];
    }
  }

  function setRuleReturnStack(stack) {
    const normalized = stack.map((item) => ({
      from: sameOriginHref(item?.from),
      to: sameOriginHref(item?.to),
    })).filter((item) => item.from && item.to);
    if (normalized.length) {
      window.sessionStorage.setItem(ruleReturnStorageKey, JSON.stringify(normalized));
      return;
    }
    window.sessionStorage.removeItem(ruleReturnStorageKey);
  }

  function isCoreRulesReferenceHref(href) {
    return /^\/(?:codex\/)?core-rules\/(?:rule|section)\//.test(href);
  }

  function rememberRuleReturnHref(event) {
    const href = currentHref();
    const target = sameOriginHref(event?.currentTarget?.getAttribute("href"));
    const stack = ruleReturnStack();
    if (!target || target === href || !isCoreRulesReferenceHref(target)) {
      return;
    }
    const last = stack[stack.length - 1];
    if (!last || last.from !== href || last.to !== target) {
      stack.push({ from: href, to: target });
    }
    setRuleReturnStack(stack);
  }

  function ruleReturnHref() {
    const current = currentHref();
    if (!page || !isCoreRulesReferenceHref(current)) {
      return "";
    }
    const stack = ruleReturnStack();
    while (stack.length) {
      const item = stack.pop();
      if (item.from !== current && item.to === current) {
        setRuleReturnStack(stack);
        return item.from;
      }
    }
    setRuleReturnStack(stack);
    return "";
  }

  function goUp() {
    if (appHeader?.dataset.upHref) {
      window.location.href = navigationHref(appHeader.dataset.upHref);
    }
  }

  function closeWindow() {
    const returnHref = ruleReturnHref();
    if (returnHref) {
      window.location.href = siteHref(returnHref);
      return;
    }
    goUp();
  }

  function selectLauncher(button) {
    launchers.forEach((item) => item.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    if (button.dataset.href) {
      window.location.href = navigationHref(button.dataset.href);
      return;
    }
    history.replaceState(null, "", `#${button.dataset.route}`);
  }

  launchers.forEach((button) => {
    button.addEventListener("click", () => selectLauncher(button));
  });

  document.querySelectorAll("a[href]").forEach((link) => {
    const href = sameOriginHref(link.getAttribute("href"));
    if (!isCoreRulesReferenceHref(href)) {
      return;
    }
    link.addEventListener("click", rememberRuleReturnHref);
  });

  function isInteractiveTarget(event) {
    return Boolean(event.target?.closest?.("a, button, input, select, textarea, [role='link'], [role='button']"));
  }

  function cardTitle(card) {
    return card.dataset.collapsibleTitle || card.querySelector("h2, h3")?.textContent?.trim() || "Rules";
  }

  function collapseButtonLabel(collapsed, title) {
    return `${collapsed ? "Show" : "Hide"} ${title}`;
  }

  const collapsibleCardSelectors = [
    ".detachment-detail-page article.codex-content > .rule-card",
    ".detachment-detail-page .detachment-card-grid > .detachment-detail-card:not(.detachment-summary-card)",
    ".detachment-detail-page .detachment-card-grid > .detachment-feature-card",
    ".detachment-detail-page .faq-section > .rule-card",
  ];

  function setCodexCollapsibleCardCollapsed(card, collapsed) {
    const button = card.querySelector(".codex-collapsible-card-button");
    const body = card.querySelector(".codex-collapsible-card-body");
    if (!button || !body) {
      return;
    }
    const title = cardTitle(card);
    body.hidden = collapsed;
    card.classList.toggle("is-collapsed", collapsed);
    button.textContent = collapsed ? "Show" : "Hide";
    button.setAttribute("aria-expanded", collapsed ? "false" : "true");
    const label = collapseButtonLabel(collapsed, title);
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function enhanceCodexCollapsibleCard(card, index) {
    if (card.dataset.collapsibleReady === "true") {
      return;
    }
    const heading = card.querySelector(":scope > .unit-card-heading, :scope > .rule-card-heading, :scope > h2, :scope > h3");
    if (!heading) {
      return;
    }
    card.dataset.collapsibleTitle = cardTitle(card);
    let headingRow = heading;
    if (/^H[23]$/.test(heading.tagName)) {
      headingRow = document.createElement("div");
      card.insertBefore(headingRow, heading);
      headingRow.appendChild(heading);
    }
    const body = document.createElement("div");
    body.className = "unit-info-card-collapsible-body codex-collapsible-card-body";
    body.id = `codex-collapsible-card-body-${index + 1}`;
    while (headingRow.nextSibling) {
      body.appendChild(headingRow.nextSibling);
    }
    const button = document.createElement("button");
    button.className = "unit-info-card-collapse-button codex-collapsible-card-button";
    button.type = "button";
    button.setAttribute("aria-controls", body.id);
    button.addEventListener("click", () => {
      card.dataset.collapsibleTouched = "true";
      setCodexCollapsibleCardCollapsed(card, !body.hidden);
    });
    headingRow.classList.add("unit-info-card-toggle-row", "codex-collapsible-card-toggle-row");
    headingRow.appendChild(button);
    card.appendChild(body);
    card.dataset.collapsibleReady = "true";
  }

  function setupMobileCodexCollapsibleCards() {
    const cards = Array.from(new Set(collapsibleCardSelectors.flatMap((selector) => (
      Array.from(document.querySelectorAll(selector))
    ))));
    if (!cards.length || !window.matchMedia) {
      return;
    }
    const media = window.matchMedia("(max-width: 760px)");
    const applyMode = () => {
      cards.forEach((card, index) => {
        enhanceCodexCollapsibleCard(card, index);
        const button = card.querySelector(".codex-collapsible-card-button");
        const body = card.querySelector(".codex-collapsible-card-body");
        if (!button || !body) {
          return;
        }
        button.hidden = !media.matches;
        if (media.matches) {
          if (card.dataset.collapsibleTouched !== "true") {
            setCodexCollapsibleCardCollapsed(card, true);
          }
          return;
        }
        body.hidden = false;
        card.classList.remove("is-collapsed");
        button.setAttribute("aria-expanded", "true");
      });
    };
    applyMode();
    if (media.addEventListener) {
      media.addEventListener("change", applyMode);
    } else {
      media.addListener?.(applyMode);
    }
  }

  function setupCodexLocalLibrary() {
    const library = window.HereticCodexLocal;
    if (!library) {
      return;
    }
    const record = library.currentPageRecord();
    if (!record) {
      return;
    }
    library.rememberRecent(record);
    const actions = document.querySelector(".app-header-actions");
    if (!actions) {
      return;
    }
    const themeToggle = actions.querySelector("[data-theme-toggle]");
    actions.insertBefore(library.favoriteButton(record), themeToggle || null);
  }

  appHeader?.addEventListener("click", (event) => {
    if (isInteractiveTarget(event)) {
      return;
    }
    closeWindow();
  });
  appHeader?.addEventListener("keydown", (event) => {
    if (isInteractiveTarget(event)) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      closeWindow();
    }
  });

  const activeRoute = window.location.hash.replace("#", "");
  const activeButton = launchers.find((button) => button.dataset.route === activeRoute);
  if (activeButton) {
    activeButton.setAttribute("aria-pressed", "true");
  }

  setupMobileCodexCollapsibleCards();
  setupCodexLocalLibrary();

})();
