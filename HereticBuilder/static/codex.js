(() => {
  const launchers = Array.from(document.querySelectorAll(".launcher"));
  const titleBar = document.querySelector(".title-bar");

  function goUp() {
    if (titleBar?.dataset.upHref) {
      window.location.href = titleBar.dataset.upHref;
    }
  }

  function selectLauncher(button) {
    launchers.forEach((item) => item.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    if (button.dataset.href) {
      window.location.href = button.dataset.href;
      return;
    }
    history.replaceState(null, "", `#${button.dataset.route}`);
  }

  launchers.forEach((button) => {
    button.addEventListener("click", () => selectLauncher(button));
  });

  titleBar?.addEventListener("click", goUp);
  titleBar?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goUp();
    }
  });

  const activeRoute = window.location.hash.replace("#", "");
  const activeButton = launchers.find((button) => button.dataset.route === activeRoute);
  if (activeButton) {
    activeButton.setAttribute("aria-pressed", "true");
  }

  window.setupWinScrollbars();
  window.addEventListener("load", window.setupWinScrollbars);
})();
