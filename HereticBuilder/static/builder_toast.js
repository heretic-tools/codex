import { button, textNode } from "./builder_dom.js";

let activeTimer = null;
let activeToast = null;

function dismissToast() {
  if (activeTimer) {
    window.clearTimeout(activeTimer);
    activeTimer = null;
  }
  if (activeToast?.remove) {
    activeToast.remove();
  }
  activeToast = null;
}

function toastHost() {
  return document.body || document.documentElement;
}

function showUndoToast({ message, onUndo, timeoutMs = 5000 }) {
  dismissToast();
  const toast = document.createElement("div");
  toast.className = "builder-toast undo-toast";
  toast.setAttribute("role", "status");
  toast.append(
    textNode("span", "toast-message", message),
    button("plain-button toast-action", "Undo", async () => {
      const restore = onUndo;
      dismissToast();
      await restore?.();
    })
  );
  toastHost().appendChild(toast);
  activeToast = toast;
  if (timeoutMs > 0) {
    activeTimer = window.setTimeout(dismissToast, timeoutMs);
  }
  return toast;
}

export { dismissToast, showUndoToast };
