import assert from "node:assert/strict";
import test from "node:test";

import { withCatalog } from "./builder_validation_helpers.mjs";

const { attachmentUnavailableMessage } = await import("../HereticBuilder/static/builder_roster_attachment_editor_view.js");

function attachmentCatalog() {
  return {
    datasheetBodyguardGroupsByDatasheetId: new Map([
      ["leader-datasheet", [
        {
          id: "leader-nurgle-bodyguard",
          datasheetId: "leader-datasheet",
          bodyguardType: "leader",
          factionKeywordId: "",
          excludedDetachmentId: "",
          requiredDetachmentId: "pactbound",
          requiresAllUnitsHaveKeywordId: "nurgle",
        },
        {
          id: "leader-khorne-bodyguard",
          datasheetId: "leader-datasheet",
          bodyguardType: "leader",
          factionKeywordId: "",
          excludedDetachmentId: "",
          requiredDetachmentId: "pactbound",
          requiresAllUnitsHaveKeywordId: "khorne",
        },
      ]],
    ]),
    datasheetBodyguardGroupDatasheetsByGroupId: new Map(),
    datasheetBodyguardGroupKeywordsByGroupId: new Map(),
    detachmentById: new Map([["pactbound", { id: "pactbound", name: "Pactbound Zealots" }]]),
    factionKeywordById: new Map(),
    keywordById: new Map([
      ["nurgle", { id: "nurgle", name: "Nurgle" }],
      ["khorne", { id: "khorne", name: "Khorne" }],
    ]),
  };
}

test("attached unit empty state explains missing shared keywords", () => {
  const roster = {
    attachments: [],
    detachmentIds: ["pactbound"],
    factionKeywordId: "faction",
  };
  const units = [
    { id: "leader", name: "Leader", datasheetId: "leader-datasheet", keywordIds: [] },
    { id: "bodyguard", name: "Bodyguard", datasheetId: "bodyguard-datasheet", keywordIds: [] },
  ];

  withCatalog(attachmentCatalog(), () => {
    assert.equal(
      attachmentUnavailableMessage(roster, units),
      "No valid attached units: requires both units to share Nurgle or Khorne."
    );
  });
});

test("attached unit empty state stays terse when valid pairs exist", () => {
  const roster = {
    attachments: [],
    detachmentIds: ["pactbound"],
    factionKeywordId: "faction",
  };
  const units = [
    { id: "leader", name: "Leader", datasheetId: "leader-datasheet", keywordIds: ["nurgle"] },
    { id: "bodyguard", name: "Bodyguard", datasheetId: "bodyguard-datasheet", keywordIds: ["nurgle"] },
  ];

  withCatalog(attachmentCatalog(), () => {
    assert.equal(attachmentUnavailableMessage(roster, units), "No attached units");
  });
});
