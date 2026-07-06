import assert from "node:assert/strict";
import test from "node:test";
import { realCatalog, withCatalog } from "./builder_validation_helpers.mjs";
import {
  rosterWithAddedAttachment,
  rosterWithRemovedAttachment,
  rosterWithRemovedAttachmentMember,
  rosterWithRemovedUnit,
} from "../HereticBuilder/static/builder_roster_actions.js";

test("builder roster actions manage current-shape attachment groups", () => {
  const roster = {
    id: "attachment-roster",
    attachments: [],
    units: [
      { id: "leader-1", datasheetId: "leader" },
      { id: "support-1", datasheetId: "support" },
      { id: "bodyguard-1", datasheetId: "bodyguard" },
    ],
  };

  const withLeader = rosterWithAddedAttachment(roster, {
    attachedUnitId: "leader-1",
    attachmentId: "attachment-1",
    attachmentType: "leader",
    bodyguardUnitId: "bodyguard-1",
  });
  assert.deepEqual(withLeader.attachments, [{
    id: "attachment-1",
    members: [
      { rosterUnitId: "leader-1", attachmentType: "leader" },
      { rosterUnitId: "bodyguard-1", attachmentType: "bodyguard" },
    ],
  }]);

  const withSupport = rosterWithAddedAttachment(withLeader, {
    attachedUnitId: "support-1",
    attachmentId: "ignored-new-id",
    attachmentType: "support",
    bodyguardUnitId: "bodyguard-1",
  });
  assert.equal(withSupport.attachments.length, 1);
  assert.deepEqual(withSupport.attachments[0].members, [
    { rosterUnitId: "leader-1", attachmentType: "leader" },
    { rosterUnitId: "bodyguard-1", attachmentType: "bodyguard" },
    { rosterUnitId: "support-1", attachmentType: "support" },
  ]);

  assert.equal(rosterWithAddedAttachment(withSupport, {
    attachedUnitId: "leader-1",
    attachmentId: "attachment-2",
    attachmentType: "leader",
    bodyguardUnitId: "support-1",
  }).attachments.length, 1);

  const withoutSupport = rosterWithRemovedAttachmentMember(withSupport, "attachment-1", "support-1");
  assert.deepEqual(withoutSupport.attachments[0].members, [
    { rosterUnitId: "leader-1", attachmentType: "leader" },
    { rosterUnitId: "bodyguard-1", attachmentType: "bodyguard" },
  ]);

  const withoutLeader = rosterWithRemovedAttachmentMember(withoutSupport, "attachment-1", "leader-1");
  assert.deepEqual(withoutLeader.attachments, []);

  assert.deepEqual(rosterWithRemovedAttachment(withSupport, "attachment-1").attachments, []);
  assert.deepEqual(rosterWithRemovedUnit(withSupport, "bodyguard-1").attachments, []);
  assert.deepEqual(rosterWithRemovedUnit(withSupport, "leader-1").attachments, []);
  assert.deepEqual(rosterWithRemovedUnit(withSupport, "unattached-unit").attachments, withSupport.attachments);
});

test("builder roster action rejects invalid attachment pairs when summaries are supplied", () => {
  const catalog = {
    ...realCatalog,
    datasheetBodyguardGroupsByDatasheetId: new Map([["leader-datasheet", [{
      id: "leader-bodyguard-group",
      datasheetId: "leader-datasheet",
      bodyguardType: "leader",
      factionKeywordId: "",
      excludedDetachmentId: "",
      requiredDetachmentId: "",
      requiresAllUnitsHaveKeywordId: "",
    }]]]),
    datasheetBodyguardGroupDatasheetsByGroupId: new Map([
      ["leader-bodyguard-group", [{ datasheetId: "bodyguard-datasheet" }]],
    ]),
    datasheetBodyguardGroupKeywordsByGroupId: new Map(),
  };
  const roster = {
    id: "attachment-guard-roster",
    factionKeywordId: "faction",
    detachmentIds: [],
    attachments: [],
  };
  const units = [
    { id: "leader", name: "Leader", datasheetId: "leader-datasheet", keywordIds: [] },
    { id: "bodyguard", name: "Bodyguard", datasheetId: "bodyguard-datasheet", keywordIds: [] },
    { id: "wrong-bodyguard", name: "Wrong Bodyguard", datasheetId: "wrong-datasheet", keywordIds: [] },
  ];

  withCatalog(catalog, () => {
    const invalid = rosterWithAddedAttachment(roster, {
      attachedUnitId: "leader",
      attachmentId: "invalid-attachment",
      attachmentType: "leader",
      bodyguardUnitId: "wrong-bodyguard",
      units,
    });
    assert.equal(invalid, roster);

    const valid = rosterWithAddedAttachment(roster, {
      attachedUnitId: "leader",
      attachmentId: "valid-attachment",
      attachmentType: "leader",
      bodyguardUnitId: "bodyguard",
      units,
    });
    assert.deepEqual(valid.attachments, [{
      id: "valid-attachment",
      members: [
        { rosterUnitId: "leader", attachmentType: "leader" },
        { rosterUnitId: "bodyguard", attachmentType: "bodyguard" },
      ],
    }]);
  });
});
