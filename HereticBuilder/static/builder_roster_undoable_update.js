function applyRosterUpdate({ message, nextRoster, onUndoableUpdate, onUpdate, previousRoster }) {
  if (onUndoableUpdate) {
    return onUndoableUpdate({
      message,
      nextRoster,
      previousRoster,
    });
  }
  return onUpdate(nextRoster);
}

export { applyRosterUpdate };
