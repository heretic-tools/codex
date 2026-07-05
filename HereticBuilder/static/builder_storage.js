import { state } from "./builder_state.js";

const DB_NAME = "heretic-builder-thin-v1";
const DB_VERSION = 1;
const ROSTER_STORE = "rosters";

function openLocalDb() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is unavailable"));
  }
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ROSTER_STORE)) {
        const store = db.createObjectStore(ROSTER_STORE, { keyPath: "id" });
        store.createIndex("modifiedAt", "modifiedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function storeRequest(mode, callback) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(ROSTER_STORE, mode);
    const store = tx.objectStore(ROSTER_STORE);
    const request = callback(store);
    let result;
    let settled = false;
    const fail = () => {
      if (!settled) {
        settled = true;
        reject(request.error || tx.error || new Error("IndexedDB transaction failed"));
      }
    };
    request.onerror = fail;
    request.onsuccess = () => {
      result = request.result;
    };
    tx.onerror = fail;
    tx.onabort = fail;
    tx.oncomplete = () => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };
  });
}

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
