import { updateRoster } from "./builder_roster_io_actions.js";
import { showUndoToast } from "./builder_toast.js";

async function updateRosterWithUndo({ message, nextRoster, previousRoster, render }) {
  await updateRoster(nextRoster, render);
  showUndoToast({
    message,
    onUndo: () => updateRoster(previousRoster, render),
  });
}

export { updateRosterWithUndo };
