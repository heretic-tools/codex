import { siteHref, state } from "./builder_state.js";

function cssImageUrl(src) {
  return `url(${JSON.stringify(src)})`;
}

function addClass(node, className) {
  if (!node || !className) {
    return;
  }
  if (node.classList?.add) {
    node.classList.add(className);
    return;
  }
  const classes = new Set(String(node.className || "").split(/\s+/).filter(Boolean));
  classes.add(className);
  node.className = Array.from(classes).join(" ");
}

function applyBackgroundArt(node, src, className = "") {
  if (!node || !src) {
    return false;
  }
  addClass(node, "has-background-art");
  addClass(node, className);
  if (node.style?.setProperty) {
    node.style.setProperty("--background-art", cssImageUrl(src));
  } else {
    node.setAttribute?.("style", `--background-art: ${cssImageUrl(src)}`);
  }
  return true;
}

function unitImageSrc(datasheetId) {
  const filename = state.catalog.unitImagesByDatasheetId?.get(datasheetId);
  return filename ? siteHref(`/assets/unit-images/${filename}`) : "";
}

function applyUnitBackgroundArt(node, datasheetId, className = "") {
  const src = unitImageSrc(datasheetId);
  return applyBackgroundArt(node, src, className || "has-unit-image");
}

function factionImageSrcByFilename(filename) {
  return filename ? siteHref(`/assets/faction-images/${filename}`) : "";
}

function factionImageSrc(factionKeywordId) {
  const faction = (state.catalog?.factions || []).find((row) => row.id === factionKeywordId);
  return factionImageSrcByFilename(faction?.factionImageFilename);
}

function applyFactionBackgroundArt(node, factionKeywordIdOrFilename, className = "") {
  const src = String(factionKeywordIdOrFilename || "").includes("__")
    ? factionImageSrcByFilename(factionKeywordIdOrFilename)
    : factionImageSrc(factionKeywordIdOrFilename);
  return applyBackgroundArt(node, src, className || "has-faction-image");
}

export {
  applyBackgroundArt,
  applyFactionBackgroundArt,
  applyUnitBackgroundArt,
  cssImageUrl,
  factionImageSrc,
  factionImageSrcByFilename,
  unitImageSrc,
};
