import assert from "node:assert/strict";
import test from "node:test";

import {
  rosterCachedPointsTotal,
  rosterListCacheIsFresh,
  rosterWithListCache,
} from "../HereticBuilder/static/builder_roster_cache.js";

test("roster list cache stores validator totals without mutating roster", () => {
  const roster = {
    id: "roster-1",
    dataVersion: 878,
    units: [{ id: "unit-1", points: 15 }],
  };
  const validation = {
    state: "valid",
    points: {
      detachmentPoints: 2,
      total: 110,
    },
  };

  const cached = rosterWithListCache(roster, validation, 879);

  assert.notEqual(cached, roster);
  assert.equal(roster.listSummary, undefined);
  assert.equal(cached.dataVersion, 879);
  assert.deepEqual(cached.listSummary, {
    detachmentPoints: 2,
    pointsTotal: 110,
    validationState: "valid",
  });
  assert.equal(rosterCachedPointsTotal(cached), 110);
  assert.equal(rosterListCacheIsFresh(cached, 879), true);
  assert.equal(rosterListCacheIsFresh(cached, 880), false);
});

test("roster list cache does not recompute totals on the roster list", () => {
  assert.equal(rosterCachedPointsTotal({
    listSummary: { pointsTotal: 0 },
    units: [{ points: 90 }],
  }), 0);
  assert.equal(rosterCachedPointsTotal({
    units: [{ points: 40 }, { points: 25 }],
  }), 0);
});

test("roster list cache freshness requires the current data version and complete summary", () => {
  assert.equal(rosterListCacheIsFresh({
    dataVersion: 879,
    listSummary: {
      detachmentPoints: 0,
      pointsTotal: 0,
      validationState: "invalid",
    },
  }, 879), true);
  assert.equal(rosterListCacheIsFresh({
    dataVersion: 878,
    listSummary: {
      detachmentPoints: 0,
      pointsTotal: 0,
      validationState: "invalid",
    },
  }, 879), false);
  assert.equal(rosterListCacheIsFresh({
    dataVersion: 879,
    listSummary: {
      pointsTotal: 0,
      validationState: "invalid",
    },
  }, 879), false);
});
