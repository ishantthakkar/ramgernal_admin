export type PermissionAction = "view" | "create" | "edit";

export interface RoleModuleDefinition {
  id: string;
  name: string;
  allowed: PermissionAction[];
}

export const SYSTEM_ROLE_NAMES = ["Admin", "Sales Manager", "Project Manager"] as const;

/** Mobile-app roles — hidden from admin Roles & Permissions table */
export const MOBILE_USER_ROLE_NAMES = ["Contractor", "Contractors", "Sales Person"] as const;

export function isMobileUserRoleName(roleName: string): boolean {
  const normalized = roleName.trim().toLowerCase().replace(/_/g, " ");
  const hidden = new Set(["contractor", "contractors", "sales person"]);
  return hidden.has(normalized);
}

export const ROLE_MODULE_DEFINITIONS: RoleModuleDefinition[] = [
  { id: "dashboard", name: "Dashboard", allowed: ["view"] },
  { id: "users", name: "User", allowed: ["view", "create", "edit"] },
  { id: "products", name: "Products", allowed: ["view", "create", "edit"] },
  { id: "leads", name: "Leads", allowed: ["view", "create", "edit"] },
  { id: "customers", name: "Customers", allowed: ["view", "create", "edit"] },
  { id: "surveys", name: "Surveys", allowed: ["view", "create", "edit"] },
  { id: "installation", name: "Installation", allowed: ["view", "create", "edit"] },
  { id: "inspection", name: "Inspection", allowed: ["view", "create", "edit"] },
  { id: "services", name: "Services", allowed: ["view", "create", "edit"] },
  { id: "payables", name: "Payables", allowed: ["view", "create", "edit"] },
  { id: "invoices", name: "Invoices", allowed: ["view", "create", "edit"] },
  { id: "audit", name: "Audit", allowed: ["view"] },
];

export function buildEmptyPermissionsState(): Record<string, Record<PermissionAction, boolean>> {
  return ROLE_MODULE_DEFINITIONS.reduce(
    (acc, module) => ({
      ...acc,
      [module.id]: { view: false, create: false, edit: false },
    }),
    {} as Record<string, Record<PermissionAction, boolean>>
  );
}

export function formatPermissionsForApi(
  permissions: Record<string, Record<PermissionAction, boolean>>
): Record<string, Record<PermissionAction, number>> {
  const formatted: Record<string, Record<PermissionAction, number>> = {};

  ROLE_MODULE_DEFINITIONS.forEach((module) => {
    formatted[module.name] = {
      view: permissions[module.id]?.view ? 1 : 0,
      create: permissions[module.id]?.create ? 1 : 0,
      edit: permissions[module.id]?.edit ? 1 : 0,
    };
  });

  return formatted;
}

export function parsePermissionsFromApi(
  apiPermissions: Record<string, Record<string, number>> = {}
): Record<string, Record<PermissionAction, boolean>> {
  const parsed = buildEmptyPermissionsState();

  ROLE_MODULE_DEFINITIONS.forEach((module) => {
    const legacyPerms =
      module.id === "payables" ? apiPermissions.Commission : undefined;
    const modulePerms = apiPermissions[module.name] || legacyPerms || {};

    parsed[module.id] = {
      view: modulePerms.view === 1,
      create: modulePerms.create === 1,
      edit: modulePerms.edit === 1,
    };
  });

  return parsed;
}

export function isSystemRoleName(roleName: string): boolean {
  return SYSTEM_ROLE_NAMES.some(
    (name) => name.toLowerCase() === roleName.trim().toLowerCase()
  );
}
