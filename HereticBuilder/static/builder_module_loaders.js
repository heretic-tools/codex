import { lazyModule } from "./builder_lazy_module.js";

const loadRules = lazyModule(() => import("./builder_rules.js"));
const loadCreateView = lazyModule(() => import("./builder_roster_create_view.js"));
const loadDetailView = lazyModule(() => import("./builder_roster_detail_view.js"));
const loadListView = lazyModule(() => import("./builder_roster_list_view.js"));
const loadNotFoundView = lazyModule(() => import("./builder_not_found_view.js"));
const loadTransfer = lazyModule(() => import("./builder_roster_transfer.js"));
const loadUnitView = lazyModule(() => import("./builder_roster_unit_detail_view.js"));

export {
  loadCreateView,
  loadDetailView,
  loadListView,
  loadNotFoundView,
  loadRules,
  loadTransfer,
  loadUnitView,
};
