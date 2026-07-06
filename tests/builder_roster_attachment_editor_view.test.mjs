import assert from "node:assert/strict";
import test from "node:test";

import { withCatalog } from "./builder_validation_helpers.mjs";

const {
  attachmentControlsAvailable,
  attachmentUnavailableMessage,
} = await import("../HereticBuilder/static/builder_roster_attachment_editor_view.js");
const {
  createAttachmentControlSelects,
} = await import("../HereticBuilder/static/builder_roster_attachment_control_create.js");
const {
  addAttachmentFromControls,
  attachmentControlField,
} = await import("../HereticBuilder/static/builder_roster_attachment_controls.js");
const {
  removeAttachmentFromRow,
} = await import("../HereticBuilder/static/builder_roster_attachment_rows.js");
const {
  removeAttachmentMemberFromRow,
} = await import("../HereticBuilder/static/builder_roster_attachment_member_view.js");

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

test("attached unit controls render only when a valid bodyguard exists", () => {
  assert.equal(attachmentControlsAvailable([]), false);
  assert.equal(attachmentControlsAvailable([{ id: "bodyguard" }]), true);
});

test("attached unit controls label their select controls", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: (tagName) => ({
      attributes: new Map(),
      dataset: {},
      setAttribute(name, value) {
        this.attributes.set(name, value);
      },
      tagName,
      title: "",
    }),
  };

  try {
    const controls = createAttachmentControlSelects();

    assert.equal(controls.bodyguard.title, "Choose bodyguard unit");
    assert.equal(controls.bodyguard.attributes.get("aria-label"), "Choose bodyguard unit");
    assert.equal(controls.type.title, "Choose attachment type");
    assert.equal(controls.type.attributes.get("aria-label"), "Choose attachment type");
    assert.equal(controls.attached.title, "Choose attached unit");
    assert.equal(controls.attached.attributes.get("aria-label"), "Choose attached unit");
  } finally {
    global.document = previousDocument;
  }
});

test("attached unit control fields expose visible labels", () => {
  const previousDocument = global.document;
  global.document = {
    createElement: (tagName) => ({
      children: [],
      className: "",
      tagName,
      textContent: "",
      append(...nodes) {
        this.children.push(...nodes);
      },
    }),
  };

  try {
    const select = { tagName: "select" };
    const field = attachmentControlField("Bodyguard", select);

    assert.equal(field.className, "field attachment-control-field");
    assert.equal(field.children[0].textContent, "Bodyguard");
    assert.equal(field.children[1], select);
  } finally {
    global.document = previousDocument;
  }
});

test("attached unit add control emits an undoable roster update", async () => {
  const roster = {
    attachments: [],
    detachmentIds: ["pactbound"],
    factionKeywordId: "faction",
  };
  const units = [
    { id: "leader", name: "Leader", datasheetId: "leader-datasheet", keywordIds: ["nurgle"] },
    { id: "bodyguard", name: "Bodyguard", datasheetId: "bodyguard-datasheet", keywordIds: ["nurgle"] },
  ];
  let event = null;

  await withCatalog(attachmentCatalog(), () => addAttachmentFromControls(
    roster,
    {
      attachedUnitId: "leader",
      attachmentId: "attachment-1",
      attachmentType: "leader",
      bodyguardUnitId: "bodyguard",
      units,
    },
    () => {},
    (value) => {
      event = value;
    }
  ));

  assert.equal(event.message, "Attached unit added");
  assert.equal(event.previousRoster, roster);
  assert.deepEqual(event.nextRoster.attachments, [{
    id: "attachment-1",
    members: [
      { attachmentType: "leader", rosterUnitId: "leader" },
      { attachmentType: "bodyguard", rosterUnitId: "bodyguard" },
    ],
  }]);
});

test("attached unit removal emits an undoable roster update", async () => {
  const roster = {
    attachments: [
      {
        id: "attachment-1",
        members: [
          { attachmentType: "bodyguard", rosterUnitId: "bodyguard-1" },
          { attachmentType: "leader", rosterUnitId: "leader-1" },
        ],
      },
    ],
    units: [],
  };
  const members = [
    { attachmentType: "bodyguard", unit: { name: "Chosen" } },
    { attachmentType: "leader", unit: { name: "Lord" } },
  ];
  let event = null;

  await removeAttachmentFromRow(
    roster,
    roster.attachments[0],
    members,
    0,
    () => {},
    (value) => {
      event = value;
    }
  );

  assert.equal(event.message, "Chosen removed");
  assert.equal(event.previousRoster, roster);
  assert.deepEqual(event.nextRoster.attachments, []);
});

test("attached unit member removal emits an undoable roster update", async () => {
  const roster = {
    attachments: [
      {
        id: "attachment-1",
        members: [
          { attachmentType: "bodyguard", rosterUnitId: "bodyguard-1" },
          { attachmentType: "leader", rosterUnitId: "leader-1" },
        ],
      },
    ],
    units: [],
  };
  let event = null;

  await removeAttachmentMemberFromRow(
    roster,
    roster.attachments[0],
    { attachmentType: "leader", rosterUnitId: "leader-1" },
    { name: "Lord" },
    () => {},
    (value) => {
      event = value;
    }
  );

  assert.equal(event.message, "Lord removed from attached unit");
  assert.equal(event.previousRoster, roster);
  assert.deepEqual(event.nextRoster.attachments, []);
});
