(() => {
  const launchers = Array.from(document.querySelectorAll(".launcher"));

  function selectLauncher(button) {
    launchers.forEach((item) => item.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    history.replaceState(null, "", `#${button.dataset.route}`);
  }

  launchers.forEach((button) => {
    button.addEventListener("click", () => {
      selectLauncher(button);
      if (button.dataset.route === "codex") {
        window.location.href = "/codex";
      }
    });
  });

  const activeRoute = window.location.hash.replace("#", "");
  const activeButton = launchers.find((button) => button.dataset.route === activeRoute);
  if (activeButton) {
    selectLauncher(activeButton);
  }

  window.setupWinScrollbars();
  window.addEventListener("load", window.setupWinScrollbars);
})();
