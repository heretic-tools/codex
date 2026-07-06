function applyRosterUpdate({ message, nextRoster, onUndoableUpdate, onUpdate, previousRoster }) {
  if (nextRoster === previousRoster) {
    return previousRoster;
  }
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
