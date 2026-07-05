import assert from "node:assert/strict";
import test from "node:test";

global.document = { querySelector: () => null };

const { state } = await import("../HereticBuilder/static/builder_state.js");
const { getAllRosters, removeRoster, saveRoster } = await import("../HereticBuilder/static/builder_storage.js");

function fakeIndexedDb() {
  const calls = [];
  const request = {
    error: null,
    result: undefined,
    onerror: null,
    onsuccess: null,
  };
  const store = {
    delete(id) {
      calls.push(["delete", id]);
      return request;
    },
    getAll() {
      calls.push(["getAll"]);
      return request;
    },
    put(row) {
      calls.push(["put", row]);
      return request;
    },
  };
  const tx = {
    error: null,
    onabort: null,
    oncomplete: null,
    onerror: null,
    objectStore(name) {
      calls.push(["objectStore", name]);
      return store;
    },
  };
  const db = {
    transaction(storeName, mode) {
      calls.push(["transaction", storeName, mode]);
      return tx;
    },
  };
  return { calls, db, request, tx };
}

test("Builder IndexedDB saves resolve only after transaction complete", async () => {
  const fake = fakeIndexedDb();
  state.db = fake.db;
  let settled = false;

  const promise = saveRoster({ id: "roster-1", name: "Local Roster" }).then((result) => {
    settled = true;
    return result;
  });

  fake.request.result = "roster-1";
  fake.request.onsuccess();
  await Promise.resolve();
  assert.equal(settled, false);

  fake.tx.oncomplete();
  assert.equal(await promise, "roster-1");
  assert.equal(settled, true);

  assert.deepEqual(fake.calls[0], ["transaction", "rosters", "readwrite"]);
  assert.deepEqual(fake.calls[1], ["objectStore", "rosters"]);
  const putCall = fake.calls.find((call) => call[0] === "put");
  assert.equal(putCall[1].id, "roster-1");
  assert.equal(putCall[1].name, "Local Roster");
  assert.match(putCall[1].modifiedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("Builder IndexedDB cache writes can preserve modifiedAt", async () => {
  const fake = fakeIndexedDb();
  state.db = fake.db;
  const modifiedAt = "2026-07-05T10:00:00.000Z";

  const promise = saveRoster({
    id: "roster-1",
    listSummary: { pointsTotal: 100 },
    modifiedAt,
    name: "Cached Roster",
  }, { touch: false });

  fake.request.result = "roster-1";
  fake.request.onsuccess();
  fake.tx.oncomplete();
  await promise;

  const putCall = fake.calls.find((call) => call[0] === "put");
  assert.equal(putCall[1].modifiedAt, modifiedAt);
  assert.deepEqual(putCall[1].listSummary, { pointsTotal: 100 });
});

test("Builder IndexedDB reads resolve after transaction complete", async () => {
  const fake = fakeIndexedDb();
  state.db = fake.db;
  const rosters = [{ id: "roster-1" }];

  const promise = getAllRosters();
  fake.request.result = rosters;
  fake.request.onsuccess();
  fake.tx.oncomplete();

  assert.equal(await promise, rosters);
  assert.deepEqual(fake.calls, [
    ["transaction", "rosters", "readonly"],
    ["objectStore", "rosters"],
    ["getAll"],
  ]);
});

test("Builder IndexedDB write aborts reject even after request success", async () => {
  const fake = fakeIndexedDb();
  state.db = fake.db;
  const promise = removeRoster("roster-1");

  fake.request.result = undefined;
  fake.request.onsuccess();
  fake.tx.error = new Error("quota exceeded");
  fake.tx.onabort();

  await assert.rejects(promise, /quota exceeded/);
  assert.deepEqual(fake.calls, [
    ["transaction", "rosters", "readwrite"],
    ["objectStore", "rosters"],
    ["delete", "roster-1"],
  ]);
});
