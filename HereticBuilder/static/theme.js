(() => {
  const STORAGE_KEY = "hereticTheme";
  const THEMES = ["dark", "light"];

  function isTheme(value) {
    return THEMES.includes(value);
  }

  function storedTheme() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return isTheme(value) ? value : "";
    } catch (_error) {
      return "";
    }
  }

  function currentTheme() {
    const value = document.documentElement.dataset.theme || storedTheme();
    return isTheme(value) ? value : "dark";
  }

  function persistTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (_error) {
      // Theme preference is optional; the app must remain fully usable without storage.
    }
  }

  function nextTheme(theme) {
    return theme === "dark" ? "light" : "dark";
  }

  function updateToggleLabels(theme) {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const next = nextTheme(theme);
      button.setAttribute("aria-label", `Switch to ${next} theme`);
      button.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      button.setAttribute("title", `Switch to ${next} theme`);
      button.dataset.theme = theme;
      const label = button.querySelector("[data-theme-toggle-label]");
      if (label) {
        label.textContent = theme === "dark" ? "Dark" : "Light";
      }
    });
  }

  function applyTheme(theme, { persist = false } = {}) {
    const next = isTheme(theme) ? theme : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    if (persist) {
      persistTheme(next);
    }
    updateToggleLabels(next);
    return next;
  }

  function bindThemeToggles() {
    updateToggleLabels(currentTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      if (button.dataset.themeReady === "true") {
        return;
      }
      button.dataset.themeReady = "true";
      button.addEventListener("click", () => {
        applyTheme(nextTheme(currentTheme()), { persist: true });
      });
    });
  }

  window.HereticTheme = {
    apply: applyTheme,
    current: currentTheme,
    toggle: () => applyTheme(nextTheme(currentTheme()), { persist: true }),
  };

  applyTheme(storedTheme() || "dark");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindThemeToggles);
  } else {
    bindThemeToggles();
  }
})();
