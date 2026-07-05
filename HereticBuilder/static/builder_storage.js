import { openLocalDb, storeRequest } from "./builder_storage_db.js";

function getAllRosters() {
  return storeRequest("readonly", (store) => store.getAll());
}

function saveRoster(roster, { touch = true } = {}) {
  return storeRequest("readwrite", (store) => store.put({
    ...roster,
    modifiedAt: touch ? new Date().toISOString() : roster.modifiedAt || new Date().toISOString(),
  }));
}

function removeRoster(id) {
  return storeRequest("readwrite", (store) => store.delete(id));
}

function newId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID().toUpperCase();
  }
  return `LOCAL-${Date.now()}-${Math.random().toString(16).slice(2)}`.toUpperCase();
}

export { getAllRosters, newId, openLocalDb, removeRoster, saveRoster };
