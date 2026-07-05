import { siteHref, state } from "./builder_state.js";

function unitImageSrc(datasheetId) {
  const filename = state.catalog.unitImagesByDatasheetId?.get(datasheetId);
  return filename ? siteHref(`/assets/unit-images/${filename}`) : "";
}

function unitImageNode(datasheetId, className = "") {
  const src = unitImageSrc(datasheetId);
  if (!src) {
    return null;
  }
  const frame = document.createElement("span");
  frame.className = ["unit-art-frame", "roster-unit-art-frame", className].filter(Boolean).join(" ");
  frame.setAttribute("aria-hidden", "true");
  const image = document.createElement("img");
  image.className = "unit-art roster-unit-art";
  image.alt = "";
  image.loading = "lazy";
  image.src = src;
  frame.appendChild(image);
  return frame;
}

export { unitImageNode, unitImageSrc };
