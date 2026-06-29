export type PermissionAction = "view" | "edit";

export interface PermissionScopeDefinition {
  id: string;
  name: string;
  allowed: PermissionAction[];
}

export interface PermissionTabDefinition {
  id: string;
  name: string;
  allowed: PermissionAction[];
  scopes?: PermissionScopeDefinition[];
}

export const SYSTEM_ROLE_NAMES = ["Admin", "Sales Manager", "Project Manager", "Sales Person"] as const;

/** Mobile-only roles — hidden from admin Roles & Permissions table */
export const MOBILE_USER_ROLE_NAMES = ["Contractor", "Contractors"] as const;

export const PERMISSION_TABS: PermissionTabDefinition[] = [
  { id: "dashboard", name: "Dashboard", allowed: ["view"] },
  { id: "user", name: "User", allowed: ["view", "edit"] },
  { id: "products", name: "Products", allowed: ["view", "edit"] },
  { id: "leads", name: "Leads", allowed: ["view", "edit"] },
  { id: "customers", name: "Customers", allowed: ["view", "edit"] },
  {
    id: "workflow",
    name: "Workflow",
    allowed: [],
    scopes: [
      { id: "surveys", name: "Surveys", allowed: ["view", "edit"] },
      { id: "quotations", name: "Quotations", allowed: ["view", "edit"] },
      { id: "installation", name: "Installation", allowed: ["view", "edit"] },
      { id: "inspection", name: "Inspection", allowed: ["view", "edit"] },
    ],
  },
  { id: "services", name: "Services", allowed: ["view", "edit"] },
  {
    id: "payables",
    name: "Payables",
    allowed: [],
    scopes: [
      { id: "sales_person", name: "Sales Person", allowed: ["view", "edit"] },
      { id: "sales_manager", name: "Sales Manager", allowed: ["view", "edit"] },
      { id: "contractor", name: "Contractor", allowed: ["view", "edit"] },
    ],
  },
  { id: "invoices", name: "Invoices", allowed: ["view", "edit"] },
];

/** Maps payables page tab labels to permission scope ids */
export const PAYABLES_TAB_SCOPE_MAP = {
  "Sales Persons": "sales_person",
  "Sales Manager": "sales_manager",
  Contractors: "contractor",
} as const;

export type PayablesTabLabel = keyof typeof PAYABLES_TAB_SCOPE_MAP;

export type PermissionsState = Record<string, Record<PermissionAction, boolean>>;

function emptyActions(): Record<PermissionAction, boolean> {
  return { view: false, edit: false };
}

export function permissionKey(tabId: string, scopeId?: string): string {
  return scopeId ? `${tabId}:${scopeId}` : tabId;
}

export function buildEmptyPermissionsState(): PermissionsState {
  const state: PermissionsState = {};

  PERMISSION_TABS.forEach((tab) => {
    if (tab.scopes?.length) {
      tab.scopes.forEach((scope) => {
        state[permissionKey(tab.id, scope.id)] = emptyActions();
      });
      return;
    }
    state[tab.id] = emptyActions();
  });

  return state;
}

function toApiActionFlags(
  actions: Record<PermissionAction, boolean>,
  allowed: PermissionAction[]
): Record<PermissionAction, number> {
  return {
    view: allowed.includes("view") && actions.view ? 1 : 0,
    edit: allowed.includes("edit") && actions.edit ? 1 : 0,
  };
}

export function formatPermissionsForApi(
  permissions: PermissionsState
): Record<string, Record<string, Record<PermissionAction, number>> | Record<PermissionAction, number>> {
  const formatted: Record<string, unknown> = {};

  PERMISSION_TABS.forEach((tab) => {
    if (tab.scopes?.length) {
      const nested: Record<string, Record<PermissionAction, number>> = {};
      tab.scopes.forEach((scope) => {
        const key = permissionKey(tab.id, scope.id);
        nested[scope.name] = toApiActionFlags(permissions[key] || emptyActions(), scope.allowed);
      });
      formatted[tab.name] = nested;
      return;
    }

    formatted[tab.name] = toApiActionFlags(permissions[tab.id] || emptyActions(), tab.allowed);
  });

  return formatted as Record<string, Record<string, Record<PermissionAction, number>> | Record<PermissionAction, number>>;
}

function readLegacyFlat(
  apiPermissions: Record<string, Record<string, number>>,
  names: string[]
): Record<string, number> | undefined {
  for (const name of names) {
    const perms = apiPermissions[name];
    if (perms && typeof perms.view === "number") {
      return perms;
    }
  }
  return undefined;
}

function applyFlatPerms(
  target: Record<PermissionAction, boolean>,
  source: Record<string, number> | undefined,
  allowed: PermissionAction[]
) {
  if (!source) return;
  if (allowed.includes("view")) {
    target.view = source.view === 1;
  }
  if (allowed.includes("edit")) {
    target.edit = source.edit === 1 || source.create === 1;
  }
}

function applyNestedPerms(
  parsed: PermissionsState,
  tab: PermissionTabDefinition,
  nestedSource: Record<string, Record<string, number>> | undefined,
  legacyFlat?: Record<string, Record<string, number>>
) {
  if (!tab.scopes) return;

  tab.scopes.forEach((scope) => {
    const key = permissionKey(tab.id, scope.id);
    const fromNested = nestedSource?.[scope.name];
    const legacyNames: Record<string, string[]> = {
      surveys: ["Surveys"],
      quotations: ["Quotations", "Surveys"],
      installation: ["Installation", "Installations"],
      inspection: ["Inspection", "Inspections"],
      sales_person: ["Sales Person", "Sales Persons"],
      sales_manager: ["Sales Manager"],
      contractor: ["Contractor", "Contractors"],
    };
    const fromLegacy = legacyFlat
      ? readLegacyFlat(legacyFlat, legacyNames[scope.id] || [])
      : undefined;

    parsed[key] = emptyActions();
    applyFlatPerms(parsed[key], fromNested, scope.allowed);
    if (!fromNested && fromLegacy) {
      applyFlatPerms(parsed[key], fromLegacy, scope.allowed);
    }
  });

  const legacyPayables = legacyFlat?.Payables || legacyFlat?.Commission;
  if (tab.id === "payables" && legacyPayables && !nestedSource) {
    tab.scopes.forEach((scope) => {
      const key = permissionKey(tab.id, scope.id);
      applyFlatPerms(parsed[key], legacyPayables, scope.allowed);
    });
  }
}

export function parsePermissionsFromApi(
  apiPermissions: Record<string, unknown> = {}
): PermissionsState {
  const parsed = buildEmptyPermissionsState();
  const flat = apiPermissions as Record<string, unknown>;

  PERMISSION_TABS.forEach((tab) => {
    if (tab.scopes?.length) {
      const nested = flat[tab.name] as Record<string, Record<string, number>> | undefined;
      const hasNestedShape =
        nested && typeof nested === "object" && !("view" in nested);
      applyNestedPerms(
        parsed,
        tab,
        hasNestedShape ? nested : undefined,
        flat as Record<string, Record<string, number>>
      );
      return;
    }

    const legacyNames =
      tab.id === "user"
        ? ["User", "Users"]
        : tab.id === "products"
          ? ["Products", "Product"]
          : [tab.name];
    const modulePerms = readLegacyFlat(flat as Record<string, Record<string, number>>, legacyNames);
    parsed[tab.id] = emptyActions();
    applyFlatPerms(parsed[tab.id], modulePerms, tab.allowed);
  });

  return parsed;
}

export function isSystemRoleName(roleName: string): boolean {
  return SYSTEM_ROLE_NAMES.some(
    (name) => name.toLowerCase() === roleName.trim().toLowerCase()
  );
}

export function isMobileUserRoleName(roleName: string): boolean {
  const normalized = roleName.trim().toLowerCase().replace(/_/g, " ");
  const hidden = new Set(["contractor", "contractors"]);
  return hidden.has(normalized);
}

/** @deprecated Use PERMISSION_TABS — kept for any stale imports */
export const ROLE_MODULE_DEFINITIONS = PERMISSION_TABS;
