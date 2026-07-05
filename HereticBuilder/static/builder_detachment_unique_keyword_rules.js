import { state } from "./builder_state.js";
import { validationMessage } from "./builder_validation_messages.js";

function validateDetachmentUniqueKeywords(detachments, messages) {
  if (detachments.length < 2) {
    return;
  }
  const byKeyword = new Map();
  for (const detachment of detachments) {
    for (const row of state.catalog.detachmentUniqueKeywordsByDetachmentId.get(detachment.id) || []) {
      if (!byKeyword.has(row.keywordId)) {
        byKeyword.set(row.keywordId, {
          name: state.catalog.keywordById.get(row.keywordId)?.name || "Unknown",
          detachments: [],
        });
      }
      byKeyword.get(row.keywordId).detachments.push(detachment);
    }
  }
  for (const { name, detachments: items } of byKeyword.values()) {
    if (items.length > 1) {
      messages.push(validationMessage(
        "roster.detachment_unique_keyword_error",
        `Detachments share unique keyword ${name}: ${items.map((detachment) => detachment.name).join(", ")}.`,
        "error",
        { detachmentIds: items.map((detachment) => detachment.id) }
      ));
    }
  }
}

export { validateDetachmentUniqueKeywords };
