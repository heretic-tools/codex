const SWIPE_ACTION_THRESHOLD = 88;
const SWIPE_ACTION_LIMIT = 112;

function swipeActionDistance(startX, currentX) {
  return Math.max(0, startX - currentX);
}

function swipeActionReady(distance, threshold = SWIPE_ACTION_THRESHOLD) {
  return distance >= threshold;
}

function resetSwipeNode(node) {
  node.classList.remove("is-swipe-ready", "is-swiping");
  node.style.removeProperty("transform");
}

function enableSwipeAction(node, action) {
  let startX = 0;
  let startY = 0;
  let distance = 0;
  let tracking = false;

  node.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse") {
      return;
    }
    startX = event.clientX;
    startY = event.clientY;
    distance = 0;
    tracking = true;
    node.classList.add("is-swiping");
    node.setPointerCapture?.(event.pointerId);
  });

  node.addEventListener("pointermove", (event) => {
    if (!tracking) {
      return;
    }
    const deltaY = Math.abs(event.clientY - startY);
    distance = swipeActionDistance(startX, event.clientX);
    if (deltaY > distance) {
      resetSwipeNode(node);
      tracking = false;
      return;
    }
    const offset = Math.min(distance, SWIPE_ACTION_LIMIT);
    node.style.transform = offset ? `translateX(-${offset}px)` : "";
    node.classList.toggle("is-swipe-ready", swipeActionReady(distance));
    event.preventDefault?.();
  });

  const finish = async () => {
    if (!tracking) {
      return;
    }
    const ready = swipeActionReady(distance);
    resetSwipeNode(node);
    tracking = false;
    if (ready) {
      await action();
    }
  };

  node.addEventListener("pointerup", finish);
  node.addEventListener("pointercancel", () => {
    resetSwipeNode(node);
    tracking = false;
  });
}

export {
  enableSwipeAction,
  swipeActionDistance,
  swipeActionReady,
};
