import { attachmentRuleConditionFailures } from "./builder_attachment_rule_conditions.js";
import { nameForId } from "./builder_roster_attachment_rule_catalog.js";
import { formatAttachmentList } from "./builder_roster_attachment_list_format.js";

function attachmentRuleFailures(roster, detachmentIds, row, attachedUnit, bodyguardUnit) {
  return attachmentRuleConditionFailures(roster, detachmentIds, row, attachedUnit, bodyguardUnit)
    .map((failure) => {
      if (failure.type === "faction") {
        return {
          type: "faction",
          name: nameForId("factionKeywordById", failure.id, "required faction"),
        };
      }
      if (failure.type === "excluded-detachment") {
        return {
          type: "excluded-detachment",
          name: nameForId("detachmentById", failure.id, "selected detachment"),
        };
      }
      if (failure.type === "required-detachment") {
        return {
          type: "required-detachment",
          name: nameForId("detachmentById", failure.id, "required detachment"),
        };
      }
      if (failure.type === "bodyguard-datasheet") {
        return { type: "bodyguard-datasheet", name: bodyguardUnit.name || "bodyguard" };
      }
      if (failure.type === "bodyguard-keyword") {
        return {
          type: "bodyguard-keyword",
          name: formatAttachmentList((failure.ids || []).map((id) => nameForId("keywordById", id, "required keyword"))),
        };
      }
      return {
        type: "shared-keyword",
        name: nameForId("keywordById", failure.id, "required keyword"),
      };
    });
}

export { attachmentRuleFailures };
