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
  });
});
