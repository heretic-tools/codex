function createAttachmentControlSelects() {
  const bodyguard = document.createElement("select");
  bodyguard.dataset.focusTarget = "true";
  return {
    attached: document.createElement("select"),
    bodyguard,
    type: document.createElement("select"),
  };
}

export { createAttachmentControlSelects };
