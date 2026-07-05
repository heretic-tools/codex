let createViewPromise = null;
let detailViewPromise = null;
let listViewPromise = null;
let notFoundViewPromise = null;
let rulesPromise = null;
let transferPromise = null;
let unitViewPromise = null;

function loadRules() {
  if (!rulesPromise) {
    rulesPromise = import("./builder_rules.js");
  }
  return rulesPromise;
}

function loadCreateView() {
  if (!createViewPromise) {
    createViewPromise = import("./builder_roster_create_view.js");
  }
  return createViewPromise;
}

function loadDetailView() {
  if (!detailViewPromise) {
    detailViewPromise = import("./builder_roster_detail_view.js");
  }
  return detailViewPromise;
}

function loadListView() {
  if (!listViewPromise) {
    listViewPromise = import("./builder_roster_list_view.js");
  }
  return listViewPromise;
}

function loadNotFoundView() {
  if (!notFoundViewPromise) {
    notFoundViewPromise = import("./builder_not_found_view.js");
  }
  return notFoundViewPromise;
}

function loadTransfer() {
  if (!transferPromise) {
    transferPromise = import("./builder_roster_transfer.js");
  }
  return transferPromise;
}

function loadUnitView() {
  if (!unitViewPromise) {
    unitViewPromise = import("./builder_roster_unit_detail_view.js");
  }
  return unitViewPromise;
}

export {
  loadCreateView,
  loadDetailView,
  loadListView,
  loadNotFoundView,
  loadRules,
  loadTransfer,
  loadUnitView,
};
