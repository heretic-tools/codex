import assert from "node:assert/strict";
import test from "node:test";
import {
  state,
  costForDetachment,
  defaultMiniatures,
  defaultWargear,
  factionScope,
  validateAllegianceAbilities,
  validateAlliedUnits,
  validateAttachedUnits,
  validateEnhancements,
  validateDetachmentDatasheets,
  validateDetachmentUniqueKeywords,
  validateKeywordRestrictions,
  validateSuccessorChapterEpicHeroes,
  validateUnitCompositions,
  validateRoster,
  validateWargearLoadouts,
  validateWarlord,
  realCatalog,
  withCatalog,
  messageCodes,
  rowNamed,
  factionNamed,
  battleSizeNamed,
  detachmentNamed,
  keywordNamed,
  miniatureNamed,
  datasheetNamed,
  combatPatrolDatasheetNamed,
  rosterUnitRef,
  rosterUnitFromDatasheetId,
  enhancementNamed,
  miniatureNamedForDatasheet,
  datasheetNamedForAlly,
  keywordIdsForDatasheet,
  alliedFactionWithParent,
  alliedFactionForRosterAndParent,
  alliedUnit,
  alliedUnitWarlord,
  allegianceGroup,
  allegianceAbility,
  allegianceAbilityWithRequiredWargear,
  allegianceUnit,
  defaultCompositionForDatasheet,
  defaultWargearUnit,
  miniatureInUnit,
  optionIdForMiniatureItem,
  setMiniatureWargear,
  enhancementTargetUnit,
  withMiniatureEnhancement,
  datasheetIdForEnhancementBodyguard
} from "./builder_validation_helpers.mjs";

function countBy(rows, key) {
  const counts = {};
  for (const row of rows) {
    counts[String(row[key])] = (counts[String(row[key])] || 0) + 1;
  }
  return counts;
}

function outsideFactionId(requiredFactionId) {
  if (!requiredFactionId) {
    return factionNamed("Adeptus Astartes").id;
  }
  const faction = realCatalog.factionKeywords.find((row) => !factionScope(row.id).includes(requiredFactionId));
  assert.ok(faction, `Expected faction outside ${requiredFactionId}`);
  return faction.id;
}

function outsideDatasheetId(excludedIds) {
  const excluded = new Set(excludedIds || []);
  const datasheet = realCatalog.datasheets.find((row) => !excluded.has(row.id));
  assert.ok(datasheet, `Expected datasheet outside ${[...excluded].join(", ")}`);
  return datasheet.id;
}

function catalogWithOnlyDatasheetBodyguardGroup(group) {
  const datasheetRows = realCatalog.datasheetBodyguardGroupDatasheetsByGroupId.get(group.id) || [];
  const keywordRows = realCatalog.datasheetBodyguardGroupKeywordsByGroupId.get(group.id) || [];
  return {
    ...realCatalog,
    datasheetBodyguardGroupsByDatasheetId: new Map([[group.datasheetId, [group]]]),
    datasheetBodyguardGroupDatasheetsByGroupId: datasheetRows.length ? new Map([[group.id, datasheetRows]]) : new Map(),
    datasheetBodyguardGroupKeywordsByGroupId: keywordRows.length ? new Map([[group.id, keywordRows]]) : new Map(),
  };
}

function detachmentListForGroup(group, options = {}) {
  const ids = [];
  if (group.requiredDetachmentId && !options.missingRequiredDetachment) {
    ids.push(group.requiredDetachmentId);
  }
  if (group.excludedDetachmentId && options.withExcludedDetachment) {
    ids.push(group.excludedDetachmentId);
  }
  return ids.map((id) => realCatalog.detachmentById.get(id)).filter(Boolean);
}

function attachmentFixtureForGroup(group, options = {}) {
  const datasheetRows = realCatalog.datasheetBodyguardGroupDatasheetsByGroupId.get(group.id) || [];
  const keywordRows = realCatalog.datasheetBodyguardGroupKeywordsByGroupId.get(group.id) || [];
  const allowedDatasheetIds = datasheetRows.map((row) => row.datasheetId);
  const bodyguardDatasheetId = options.wrongDatasheet
    ? outsideDatasheetId(allowedDatasheetIds)
    : (allowedDatasheetIds[0] || datasheetNamed("Intercessor Squad").id);
  const allowedKeywordIds = keywordRows.map((row) => row.keywordId);
  const sharedKeywordId = group.requiresAllUnitsHaveKeywordId;
  const attachedKeywordIds = [];
  if (sharedKeywordId && !options.missingSharedKeywordOnAttached) {
    attachedKeywordIds.push(sharedKeywordId);
  }
  const bodyguardKeywordIds = [];
  if (allowedKeywordIds.length && !options.missingBodyguardKeyword) {
    bodyguardKeywordIds.push(allowedKeywordIds[0]);
  }
  if (sharedKeywordId && !options.missingSharedKeywordOnBodyguard) {
    bodyguardKeywordIds.push(sharedKeywordId);
  }
  const attached = {
    id: `${group.id}:attached`,
    name: realCatalog.datasheetById.get(group.datasheetId)?.name || "Attached",
    datasheetId: group.datasheetId,
    allyType: "native",
    keywordIds: attachedKeywordIds,
    keywordNames: [],
  };
  const bodyguard = {
    id: `${group.id}:bodyguard:${options.wrongDatasheet ? "wrong" : "valid"}`,
    name: realCatalog.datasheetById.get(bodyguardDatasheetId)?.name || "Bodyguard",
    datasheetId: bodyguardDatasheetId,
    allyType: "native",
    keywordIds: bodyguardKeywordIds,
    keywordNames: [],
  };
  return {
    roster: {
      factionKeywordId: options.wrongFaction
        ? outsideFactionId(group.factionKeywordId)
        : (group.factionKeywordId || factionNamed("Adeptus Astartes").id),
      attachments: options.withoutBodyguard ? [{
        id: `${group.id}:attachment-without-bodyguard`,
        members: [
          { rosterUnitId: attached.id, attachmentType: options.attachmentType || group.bodyguardType },
        ],
      }] : [{
        id: `${group.id}:attachment`,
        members: [
          { rosterUnitId: attached.id, attachmentType: options.attachmentType || group.bodyguardType },
          { rosterUnitId: bodyguard.id, attachmentType: "bodyguard" },
        ],
      }],
    },
    detachments: detachmentListForGroup(group, options),
    units: [attached, bodyguard],
  };
}

function validateDatasheetBodyguardGroup(group, options = {}) {
  const fixture = attachmentFixtureForGroup(group, options);
  const messages = [];
  withCatalog(catalogWithOnlyDatasheetBodyguardGroup(group), () => {
    validateAttachedUnits(fixture.roster, fixture.detachments, fixture.units, messages);
  });
  return messageCodes(messages);
}

test("all live datasheet bodyguard rule tables stay pinned to explicit coverage counts", () => {
  state.catalog = realCatalog;
  const groups = realCatalog.datasheetBodyguardGroups;
  const groupsWithDatasheets = groups.filter((group) => (
    realCatalog.datasheetBodyguardGroupDatasheetsByGroupId.get(group.id) || []
  ).length);
  const groupsWithKeywords = groups.filter((group) => (
    realCatalog.datasheetBodyguardGroupKeywordsByGroupId.get(group.id) || []
  ).length);

  assert.equal(groups.length, 1266);
  assert.equal(realCatalog.datasheetBodyguardGroupDatasheets.length, 1260);
  assert.equal(realCatalog.datasheetBodyguardGroupKeywords.length, 14);
  assert.deepEqual(countBy(groups, "bodyguardType"), {
    leader: 1056,
    support: 210,
  });
  assert.equal(groups.filter((group) => group.factionKeywordId).length, 0);
  assert.equal(groups.filter((group) => group.requiredDetachmentId).length, 305);
  assert.equal(groups.filter((group) => group.excludedDetachmentId).length, 61);
  assert.equal(groups.filter((group) => group.requiresAllUnitsHaveKeywordId).length, 305);
  assert.equal(groupsWithDatasheets.length, 1260);
  assert.equal(groupsWithKeywords.length, 6);
  assert.equal(groups.filter((group) => (
    (realCatalog.datasheetBodyguardGroupDatasheetsByGroupId.get(group.id) || []).length
    && (realCatalog.datasheetBodyguardGroupKeywordsByGroupId.get(group.id) || []).length
  )).length, 0);

  const groupIds = new Set(groups.map((group) => group.id));
  for (const group of groups) {
    assert.ok(realCatalog.datasheetById.has(group.datasheetId), `Missing attached datasheet ${group.datasheetId}`);
    if (group.factionKeywordId) {
      assert.ok(realCatalog.factionKeywordById.has(group.factionKeywordId), `Missing faction keyword ${group.factionKeywordId}`);
    }
    if (group.requiredDetachmentId) {
      assert.ok(realCatalog.detachmentById.has(group.requiredDetachmentId), `Missing required detachment ${group.requiredDetachmentId}`);
    }
    if (group.excludedDetachmentId) {
      assert.ok(realCatalog.detachmentById.has(group.excludedDetachmentId), `Missing excluded detachment ${group.excludedDetachmentId}`);
    }
    if (group.requiresAllUnitsHaveKeywordId) {
      assert.ok(realCatalog.keywordById.has(group.requiresAllUnitsHaveKeywordId), `Missing shared keyword ${group.requiresAllUnitsHaveKeywordId}`);
    }
  }
  for (const row of realCatalog.datasheetBodyguardGroupDatasheets) {
    assert.ok(groupIds.has(row.datasheetBodyguardGroupId), `Missing bodyguard group ${row.datasheetBodyguardGroupId}`);
    assert.ok(realCatalog.datasheetById.has(row.datasheetId), `Missing bodyguard datasheet ${row.datasheetId}`);
  }
  for (const row of realCatalog.datasheetBodyguardGroupKeywords) {
    assert.ok(groupIds.has(row.datasheetBodyguardGroupId), `Missing bodyguard group ${row.datasheetBodyguardGroupId}`);
    assert.ok(realCatalog.keywordById.has(row.keywordId), `Missing bodyguard keyword ${row.keywordId}`);
  }
});

test("all live datasheet bodyguard groups require their configured leader or support type", () => {
  state.catalog = realCatalog;
  const groups = realCatalog.datasheetBodyguardGroups;
  let leaderRows = 0;
  let supportRows = 0;
  let validRows = 0;
  let wrongTypeRows = 0;

  assert.equal(groups.length, 1266);
  assert.equal(groups.filter((group) => group.bodyguardType === "leader").length, 1056);
  assert.equal(groups.filter((group) => group.bodyguardType === "support").length, 210);

  for (const group of groups) {
    if (group.bodyguardType === "leader") {
      leaderRows += 1;
    } else if (group.bodyguardType === "support") {
      supportRows += 1;
    } else {
      assert.fail(`Unexpected bodyguard type ${group.bodyguardType}`);
    }

    const validCodes = validateDatasheetBodyguardGroup(group, { attachmentType: group.bodyguardType });
    assert.ok(
      !validCodes.includes("attached_unit.missing_requirements"),
      `Expected datasheet bodyguard group ${group.id} to accept ${group.bodyguardType} member`
    );
    validRows += 1;

    const wrongType = group.bodyguardType === "leader" ? "support" : "leader";
    const wrongCodes = validateDatasheetBodyguardGroup(group, { attachmentType: wrongType });
    assert.ok(
      wrongCodes.includes("attached_unit.missing_requirements"),
      `Expected datasheet bodyguard group ${group.id} to reject ${wrongType} member`
    );
    wrongTypeRows += 1;
  }

  assert.equal(leaderRows, 1056);
  assert.equal(supportRows, 210);
  assert.equal(validRows, 1266);
  assert.equal(wrongTypeRows, 1266);
});

test("all live datasheet bodyguard groups accept configured bodyguards and reject invalid bodyguards", () => {
  state.catalog = realCatalog;
  const groups = realCatalog.datasheetBodyguardGroups;

  assert.equal(groups.length, 1266);

  for (const group of groups) {
    const validCodes = validateDatasheetBodyguardGroup(group);
    assert.ok(
      !validCodes.includes("attached_unit.missing_requirements"),
      `Expected datasheet bodyguard group ${group.id} to accept configured bodyguard`
    );

    const hasDatasheetRows = (realCatalog.datasheetBodyguardGroupDatasheetsByGroupId.get(group.id) || []).length > 0;
    const invalidCodes = validateDatasheetBodyguardGroup(group, hasDatasheetRows
      ? { wrongDatasheet: true }
      : { missingBodyguardKeyword: true });
    assert.ok(
      invalidCodes.includes("attached_unit.missing_requirements"),
      `Expected datasheet bodyguard group ${group.id} to reject invalid bodyguard`
    );
  }
});

test("all live datasheet bodyguard detachment and shared-keyword conditions reject missing states", () => {
  state.catalog = realCatalog;
  const requiredDetachmentGroups = realCatalog.datasheetBodyguardGroups.filter((group) => group.requiredDetachmentId);
  const excludedDetachmentGroups = realCatalog.datasheetBodyguardGroups.filter((group) => group.excludedDetachmentId);
  const sharedKeywordGroups = realCatalog.datasheetBodyguardGroups.filter((group) => group.requiresAllUnitsHaveKeywordId);
  const keywordGroups = realCatalog.datasheetBodyguardGroups.filter((group) => (
    realCatalog.datasheetBodyguardGroupKeywordsByGroupId.get(group.id) || []
  ).length);

  assert.equal(requiredDetachmentGroups.length, 305);
  assert.equal(excludedDetachmentGroups.length, 61);
  assert.equal(sharedKeywordGroups.length, 305);
  assert.equal(keywordGroups.length, 6);

  for (const group of requiredDetachmentGroups) {
    const codes = validateDatasheetBodyguardGroup(group, { missingRequiredDetachment: true });
    assert.ok(
      codes.includes("attached_unit.missing_requirements"),
      `Expected datasheet bodyguard group ${group.id} to reject missing required detachment`
    );
  }

  for (const group of excludedDetachmentGroups) {
    const codes = validateDatasheetBodyguardGroup(group, { withExcludedDetachment: true });
    assert.ok(
      codes.includes("attached_unit.missing_requirements"),
      `Expected datasheet bodyguard group ${group.id} to reject excluded detachment`
    );
  }

  for (const group of sharedKeywordGroups) {
    const missingAttachedCodes = validateDatasheetBodyguardGroup(group, { missingSharedKeywordOnAttached: true });
    assert.ok(
      missingAttachedCodes.includes("attached_unit.missing_requirements"),
      `Expected datasheet bodyguard group ${group.id} to reject attached unit missing shared keyword`
    );

    const missingBodyguardCodes = validateDatasheetBodyguardGroup(group, { missingSharedKeywordOnBodyguard: true });
    assert.ok(
      missingBodyguardCodes.includes("attached_unit.missing_requirements"),
      `Expected datasheet bodyguard group ${group.id} to reject bodyguard missing shared keyword`
    );
  }

  for (const group of keywordGroups) {
    const codes = validateDatasheetBodyguardGroup(group, { missingBodyguardKeyword: true });
    assert.ok(
      codes.includes("attached_unit.missing_requirements"),
      `Expected datasheet bodyguard group ${group.id} to reject missing bodyguard keyword`
    );
  }
});

test("data-empty datasheet bodyguard faction gates stay covered", () => {
  assert.equal(realCatalog.datasheetBodyguardGroups.filter((group) => group.factionKeywordId).length, 0);

  const group = {
    id: "faction-gated-datasheet-bodyguard",
    datasheetId: "leader-datasheet",
    bodyguardType: "leader",
    factionKeywordId: factionNamed("Adeptus Astartes").id,
    excludedDetachmentId: "",
    requiredDetachmentId: "",
    requiresAllUnitsHaveKeywordId: "",
  };

  const validCodes = validateDatasheetBodyguardGroup(group);
  assert.ok(!validCodes.includes("attached_unit.missing_requirements"));

  const blockedCodes = validateDatasheetBodyguardGroup(group, { wrongFaction: true });
  assert.ok(blockedCodes.includes("attached_unit.missing_requirements"));
});

test("attachment groups validate incomplete, duplicate, and invalid pairings", () => {
  const catalog = {
    datasheetBodyguardGroupsByDatasheetId: new Map([
      ["leader-datasheet", [{
        id: "leader-bodyguard-group",
        datasheetId: "leader-datasheet",
        bodyguardType: "leader",
        factionKeywordId: "",
        excludedDetachmentId: "",
        requiredDetachmentId: "",
        requiresAllUnitsHaveKeywordId: "",
      }]],
      ["support-datasheet", [{
        id: "support-bodyguard-group",
        datasheetId: "support-datasheet",
        bodyguardType: "support",
        factionKeywordId: "",
        excludedDetachmentId: "",
        requiredDetachmentId: "",
        requiresAllUnitsHaveKeywordId: "",
      }]],
    ]),
    datasheetBodyguardGroupDatasheetsByGroupId: new Map([
      ["leader-bodyguard-group", [{ datasheetId: "bodyguard-datasheet" }]],
      ["support-bodyguard-group", [{ datasheetId: "bodyguard-datasheet" }]],
    ]),
    datasheetBodyguardGroupKeywordsByGroupId: new Map(),
  };
  const units = [
    { id: "leader", name: "Leader", datasheetId: "leader-datasheet", keywordIds: [] },
    { id: "support", name: "Support", datasheetId: "support-datasheet", keywordIds: [] },
    { id: "bodyguard", name: "Bodyguard", datasheetId: "bodyguard-datasheet", keywordIds: [] },
    { id: "wrong-bodyguard", name: "Wrong Bodyguard", datasheetId: "wrong-datasheet", keywordIds: [] },
  ];

  withCatalog(catalog, () => {
    const standaloneMessages = [];
    validateAttachedUnits({
      factionKeywordId: "faction",
      attachments: [],
    }, [], units, standaloneMessages);
    assert.deepEqual(messageCodes(standaloneMessages), []);

    const validMessages = [];
    validateAttachedUnits({
      factionKeywordId: "faction",
      attachments: [{
        id: "valid-group",
        members: [
          { rosterUnitId: "leader", attachmentType: "leader" },
          { rosterUnitId: "bodyguard", attachmentType: "bodyguard" },
        ],
      }],
    }, [], units, validMessages);
    assert.deepEqual(messageCodes(validMessages), []);

    const mustAttachMessages = [];
    validateAttachedUnits({
      factionKeywordId: "faction",
      attachments: [{
        id: "leader-without-bodyguard",
        members: [{ rosterUnitId: "leader", attachmentType: "leader" }],
      }],
    }, [], units, mustAttachMessages);
    assert.ok(messageCodes(mustAttachMessages).includes("attached_unit.must_be_attached"));
    assert.equal(
      mustAttachMessages.find((message) => message.code === "attached_unit.must_be_attached")?.scope?.attachmentId,
      "leader-without-bodyguard"
    );

    const supportMustAttachMessages = [];
    validateAttachedUnits({
      factionKeywordId: "faction",
      attachments: [{
        id: "support-without-bodyguard",
        members: [{ rosterUnitId: "support", attachmentType: "support" }],
      }],
    }, [], units, supportMustAttachMessages);
    assert.ok(messageCodes(supportMustAttachMessages).includes("attached_unit.must_be_attached"));

    const incompleteMessages = [];
    validateAttachedUnits({
      factionKeywordId: "faction",
      attachments: [{
        id: "bodyguard-without-attached-model",
        members: [{ rosterUnitId: "bodyguard", attachmentType: "bodyguard" }],
      }],
    }, [], units, incompleteMessages);
    assert.ok(messageCodes(incompleteMessages).includes("attached_unit.incomplete"));
    assert.equal(
      incompleteMessages.find((message) => message.code === "attached_unit.incomplete")?.scope?.attachmentId,
      "bodyguard-without-attached-model"
    );

    const invalidMessages = [];
    validateAttachedUnits({
      factionKeywordId: "faction",
      attachments: [{
        id: "invalid-group",
        members: [
          { rosterUnitId: "leader", attachmentType: "leader" },
          { rosterUnitId: "wrong-bodyguard", attachmentType: "bodyguard" },
        ],
      }],
    }, [], units, invalidMessages);
    assert.ok(messageCodes(invalidMessages).includes("attached_unit.missing_requirements"));
    assert.equal(
      invalidMessages.find((message) => message.code === "attached_unit.missing_requirements")?.scope?.attachmentId,
      "invalid-group"
    );

    const supportInvalidMessages = [];
    validateAttachedUnits({
      factionKeywordId: "faction",
      attachments: [{
        id: "invalid-support-group",
        members: [
          { rosterUnitId: "support", attachmentType: "support" },
          { rosterUnitId: "wrong-bodyguard", attachmentType: "bodyguard" },
        ],
      }],
    }, [], units, supportInvalidMessages);
    assert.ok(messageCodes(supportInvalidMessages).includes("attached_unit.missing_requirements"));

    const duplicateMessages = [];
    validateAttachedUnits({
      factionKeywordId: "faction",
      attachments: [
        {
          id: "duplicate-a",
          members: [
            { rosterUnitId: "leader", attachmentType: "leader" },
            { rosterUnitId: "bodyguard", attachmentType: "bodyguard" },
          ],
        },
        {
          id: "duplicate-b",
          members: [
            { rosterUnitId: "leader", attachmentType: "leader" },
            { rosterUnitId: "bodyguard", attachmentType: "bodyguard" },
          ],
        },
      ],
    }, [], units, duplicateMessages);
    assert.ok(messageCodes(duplicateMessages).includes("attached_unit.duplicate_membership"));
    assert.deepEqual(
      duplicateMessages.find((message) => message.code === "attached_unit.duplicate_membership")?.scope?.attachmentIds,
      ["duplicate-a", "duplicate-b"]
    );
  });
});
