import { button, textNode } from "./builder_dom.js";
import { labelControl } from "./builder_roster_control_labels.js";

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
    labelControl(button("plain-button toast-action", "Undo", async () => {
      const restore = onUndo;
      dismissToast();
      await restore?.();
    }), `Undo: ${message || "last change"}`)
  );
  toastHost().appendChild(toast);
  activeToast = toast;
  if (timeoutMs > 0) {
    activeTimer = window.setTimeout(dismissToast, timeoutMs);
  }
  return toast;
}

function showStatusToast({ message, timeoutMs = 4000, tone = "info" }) {
  dismissToast();
  const toast = document.createElement("div");
  toast.className = `builder-toast status-toast tone-${tone}`;
  toast.setAttribute("role", tone === "error" ? "alert" : "status");
  const dismiss = labelControl(button("remove-button toast-dismiss", "x", dismissToast), "Dismiss message");
  toast.append(
    textNode("span", "toast-message", message),
    dismiss
  );
  toastHost().appendChild(toast);
  activeToast = toast;
  if (timeoutMs > 0) {
    activeTimer = window.setTimeout(dismissToast, timeoutMs);
  }
  return toast;
}

export { dismissToast, showStatusToast, showUndoToast };
