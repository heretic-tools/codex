import assert from "node:assert/strict";
import test from "node:test";
import {
  groupedMessages,
  validationScopeLabels,
  validationForAttachment,
  validationForDetachment,
  validationForTarget,
  validationForUnit,
} from "../HereticBuilder/static/builder_validation_view.js";

test("validationForUnit keeps only diagnostics scoped to the selected unit", () => {
  const validation = {
    state: "invalid",
    messages: [
      { level: "error", code: "unit.direct", text: "direct", scope: { unitId: "unit-1" } },
      { level: "error", code: "unit.group", text: "group", scope: { unitIds: ["unit-2", "unit-1"] } },
      { level: "warning", code: "unit.datasheet", text: "datasheet", scope: { datasheetId: "datasheet-1" } },
      { level: "warning", code: "unit.datasheet_group", text: "datasheet group", scope: { datasheetIds: ["datasheet-2", "datasheet-1"] } },
      { level: "error", code: "unit.target", text: "target", scope: { targetId: "model-1" } },
      { level: "error", code: "unit.target_group", text: "target group", scope: { targetIds: ["model-2", "model-1"] } },
      { level: "error", code: "other.unit", text: "other unit", scope: { unitId: "unit-2" } },
      { level: "error", code: "roster.global", text: "global" },
    ],
  };

  const filtered = validationForUnit(validation, {
    id: "unit-1",
    datasheetId: "datasheet-1",
    miniatures: [{ rosterUnitMiniatureId: "model-1" }],
  });

  assert.equal(filtered.state, "invalid");
  assert.deepEqual(filtered.messages.map((message) => message.code), [
    "unit.direct",
    "unit.group",
    "unit.datasheet",
    "unit.datasheet_group",
    "unit.target",
    "unit.target_group",
  ]);
});

test("validationForUnit reports valid when the selected unit has no scoped errors", () => {
  const filtered = validationForUnit({
    state: "invalid",
    messages: [
      { level: "error", code: "roster.global", text: "global" },
      { level: "warning", code: "unit.warning", text: "warning", scope: { unitId: "unit-1" } },
    ],
  }, { id: "unit-1", datasheetId: "datasheet-1" });

  assert.equal(filtered.state, "valid");
  assert.deepEqual(filtered.messages.map((message) => message.code), ["unit.warning"]);
});

test("validationForDetachment keeps only diagnostics scoped to the selected detachment", () => {
  const validation = {
    state: "invalid",
    messages: [
      { level: "error", code: "detachment.direct", text: "direct", scope: { detachmentId: "detachment-1" } },
      { level: "error", code: "detachment.group", text: "group", scope: { detachmentIds: ["detachment-2", "detachment-1"] } },
      { level: "warning", code: "other.detachment", text: "other", scope: { detachmentId: "detachment-2" } },
      { level: "error", code: "roster.global", text: "global" },
    ],
  };

  const filtered = validationForDetachment(validation, "detachment-1");

  assert.equal(filtered.state, "invalid");
  assert.deepEqual(filtered.messages.map((message) => message.code), [
    "detachment.direct",
    "detachment.group",
  ]);
});

test("validationForAttachment keeps diagnostics scoped to a group or its members", () => {
  const attachment = {
    id: "attachment-1",
    members: [
      { rosterUnitId: "leader-1", attachmentType: "leader" },
      { rosterUnitId: "bodyguard-1", attachmentType: "bodyguard" },
    ],
  };
  const validation = {
    state: "invalid",
    messages: [
      { level: "error", code: "attachment.direct", text: "direct", scope: { attachmentId: "attachment-1" } },
      { level: "error", code: "attachment.group", text: "group", scope: { attachmentIds: ["attachment-2", "attachment-1"] } },
      { level: "error", code: "attachment.member", text: "member", scope: { unitIds: ["leader-1"] } },
      { level: "error", code: "attachment.single_member", text: "single member", scope: { unitId: "bodyguard-1" } },
      { level: "error", code: "attachment.target", text: "target", scope: { targetId: "leader-model-1" } },
      { level: "error", code: "attachment.target_group", text: "target group", scope: { targetIds: ["other-model", "bodyguard-model-1"] } },
      { level: "error", code: "other.attachment", text: "other", scope: { attachmentId: "attachment-2" } },
      { level: "error", code: "roster.global", text: "global" },
    ],
  };

  const filtered = validationForAttachment(validation, attachment, new Map([
    ["leader-1", { miniatures: [{ rosterUnitMiniatureId: "leader-model-1" }] }],
    ["bodyguard-1", { miniatures: [{ rosterUnitMiniatureId: "bodyguard-model-1" }] }],
  ]));

  assert.equal(filtered.state, "invalid");
  assert.deepEqual(filtered.messages.map((message) => message.code), [
    "attachment.direct",
    "attachment.group",
    "attachment.member",
    "attachment.single_member",
    "attachment.target",
    "attachment.target_group",
  ]);
});

test("validationForTarget keeps only diagnostics scoped to the selected model target", () => {
  const validation = {
    state: "invalid",
    messages: [
      { level: "error", code: "target.direct", text: "direct", scope: { targetId: "model-1" } },
      { level: "warning", code: "target.group", text: "group", scope: { targetIds: ["model-2", "model-1"] } },
      { level: "error", code: "unit.only", text: "unit", scope: { unitId: "unit-1" } },
      { level: "error", code: "roster.global", text: "global" },
    ],
  };

  const filtered = validationForTarget(validation, "model-1");

  assert.equal(filtered.state, "invalid");
  assert.deepEqual(filtered.messages.map((message) => message.code), [
    "target.direct",
    "target.group",
  ]);
});

test("validationScopeLabels renders names from validation context", () => {
  const labels = validationScopeLabels({
    scope: {
      attachmentId: "attachment-1",
      datasheetIds: ["datasheet-1"],
      detachmentIds: ["detachment-1"],
      targetId: "model-1",
      unitIds: ["unit-1", "unit-2"],
    },
  }, {
    attachmentsById: new Map([["attachment-1", "Chosen"]]),
    datasheetsById: new Map([["datasheet-1", { name: "Abaddon the Despoiler" }]]),
    detachmentsById: new Map([["detachment-1", { name: "Pactbound Zealots" }]]),
    targetsById: new Map([["model-1", "Abaddon the Despoiler / Abaddon the Despoiler"]]),
    unitsById: new Map([
      ["unit-1", "Abaddon the Despoiler"],
      ["unit-2", "Chosen"],
    ]),
  });

  assert.deepEqual(labels, [
    "Unit: Abaddon the Despoiler",
    "Unit: Chosen",
    "Model: Abaddon the Despoiler / Abaddon the Despoiler",
    "Detachment: Pactbound Zealots",
    "Attached: Chosen",
    "Datasheet: Abaddon the Despoiler",
  ]);
});

test("groupedMessages carries datasheet ids for validation actions", () => {
  const groups = groupedMessages([
    {
      level: "error",
      code: "detachment.datasheets_missing",
      text: "missing one",
      scope: { datasheetId: "datasheet-1", targetId: "target-1" },
    },
    {
      level: "error",
      code: "detachment.datasheets_missing",
      text: "missing two",
      scope: { datasheetIds: ["datasheet-2", "datasheet-1"], targetIds: ["target-2", "target-1"] },
    },
  ]);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].datasheetIds, ["datasheet-1", "datasheet-2"]);
  assert.deepEqual(groups[0].targetIds, ["target-1", "target-2"]);
});

test("groupedMessages carries detachment ids for validation badges and actions", () => {
  const groups = groupedMessages([
    {
      level: "error",
      code: "enhancement.combat_patrol_required",
      text: "missing default",
      scope: { detachmentId: "detachment-1" },
    },
    {
      level: "error",
      code: "enhancement.combat_patrol_required",
      text: "missing another default",
      scope: { detachmentIds: ["detachment-2", "detachment-1"] },
    },
  ]);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].detachmentIds, ["detachment-1", "detachment-2"]);
});
