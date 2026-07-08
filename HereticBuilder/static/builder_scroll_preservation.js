const SCROLL_CONTAINER_SELECTORS = [
  ".builder-root",
  ".builder-roster-sidebar",
  ".builder-panel-content",
  ".desktop",
];

function currentWindowScroll() {
  return {
    x: window.scrollX || document.documentElement?.scrollLeft || document.body?.scrollLeft || 0,
    y: window.scrollY || document.documentElement?.scrollTop || document.body?.scrollTop || 0,
  };
}

function scrollContainers() {
  if (typeof document === "undefined" || !document.querySelectorAll) {
    return [];
  }
  return Array.from(document.querySelectorAll(SCROLL_CONTAINER_SELECTORS.join(",")));
}

function captureBuilderScrollPosition() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  const containers = scrollContainers()
    .map((node, index) => ({
      id: node.id || "",
      index,
      left: node.scrollLeft || 0,
      top: node.scrollTop || 0,
    }))
    .filter((item) => item.left || item.top);
  return {
    containers,
    windowScroll: currentWindowScroll(),
  };
}

function restoreNodeScroll(node, position) {
  if (!node || !position) {
    return;
  }
  const left = position.left || 0;
  const top = position.top || 0;
  if (typeof node.scrollTo === "function") {
    node.scrollTo(left, top);
    return;
  }
  node.scrollLeft = left;
  node.scrollTop = top;
}

function nodeByCapturedPosition(item, containers) {
  if (item.id && document.getElementById) {
    return document.getElementById(item.id) || containers[item.index];
  }
  return containers[item.index];
}

function restoreBuilderScrollPosition(snapshot) {
  if (!snapshot || typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const restore = () => {
    const containers = scrollContainers();
    for (const item of snapshot.containers || []) {
      restoreNodeScroll(nodeByCapturedPosition(item, containers), item);
    }
    const { x = 0, y = 0 } = snapshot.windowScroll || {};
    if (typeof window.scrollTo === "function") {
      window.scrollTo(x, y);
    }
  };
  restore();
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(restore);
  }
}

export { captureBuilderScrollPosition, restoreBuilderScrollPosition };
