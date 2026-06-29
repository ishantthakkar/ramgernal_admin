
export interface Permission {
  view: number;
  edit: number;
  create?: number;
  delete?: number;
}

export interface NestedPermissionScope {
  view: number;
  edit: number;
  create?: number;
}

export interface UserPermissions {
  [module: string]: Permission | Record<string, NestedPermissionScope>;
}

const WORKFLOW_MODULES = ["Surveys", "Quotations", "Installation", "Inspection"] as const;
const PAYABLES_SCOPES = ["Sales Person", "Sales Manager", "Contractor"] as const;

function isNestedScope(value: unknown): value is Record<string, NestedPermissionScope> {
  return Boolean(value && typeof value === "object" && !("view" in value));
}

function normalizeAction(action: "view" | "create" | "edit" | "delete"): "view" | "edit" {
  if (action === "view") return "view";
  return "edit";
}

function scopeHasAction(
  scope: NestedPermissionScope | undefined,
  action: "view" | "edit"
): boolean {
  if (!scope) return false;
  if (action === "view") return scope.view === 1;
  return scope.edit === 1 || scope.create === 1;
}

function flatHasAction(modulePerms: Permission | undefined, action: "view" | "edit"): boolean {
  if (!modulePerms || isNestedScope(modulePerms)) return false;
  if (action === "view") return modulePerms.view === 1;
  return modulePerms.edit === 1 || modulePerms.create === 1 || modulePerms.delete === 1;
}

function getWorkflowScope(
  permissions: UserPermissions,
  scopeName: string
): NestedPermissionScope | undefined {
  const workflow = permissions.Workflow;
  if (isNestedScope(workflow)) {
    return workflow[scopeName];
  }
  const legacy = permissions[scopeName];
  if (legacy && !isNestedScope(legacy)) {
    return legacy as NestedPermissionScope;
  }
  return undefined;
}

function getPayablesScope(
  permissions: UserPermissions,
  scopeName: string
): NestedPermissionScope | undefined {
  const payables = permissions.Payables || permissions.Commission;
  if (isNestedScope(payables)) {
    return payables[scopeName];
  }
  if (payables && !isNestedScope(payables)) {
    return payables as NestedPermissionScope;
  }
  return undefined;
}

function resolveFlatModule(moduleName: string, permissions: UserPermissions): Permission | undefined {
  if (moduleName === "User") {
    const userPerms = permissions.User || permissions.Users;
    return userPerms && !isNestedScope(userPerms) ? userPerms : undefined;
  }
  const perms = permissions[moduleName];
  return perms && !isNestedScope(perms) ? perms : undefined;
}

export function getPermissions(): UserPermissions | null {
  if (typeof window === "undefined") return null;
  const perms = localStorage.getItem("user_permissions");
  return perms ? JSON.parse(perms) : null;
}

export function isSuperAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("is_super_admin") === "true";
}

export function getUserInfo(): { userRole?: string; fullName?: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user_info");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { userRole?: string; fullName?: string };
  } catch {
    return null;
  }
}

function normalizeUserRole(role?: string): string {
  return (role || "").trim().toLowerCase().replace(/_/g, " ");
}

export function isSalesPersonUser(): boolean {
  return normalizeUserRole(getUserInfo()?.userRole) === "sales person";
}

/** Site Details area reorder — super admin, Admin role, or Sales Person only */
export function canReorderSiteDetails(): boolean {
  if (isSuperAdmin()) return true;
  const role = normalizeUserRole(getUserInfo()?.userRole);
  return role === "sales person" || role === "admin";
}

export function hasWorkflowScopePermission(
  scopeName: (typeof WORKFLOW_MODULES)[number],
  action: "view" | "create" | "edit" | "delete"
): boolean {
  if (isSuperAdmin()) return true;
  const permissions = getPermissions();
  if (!permissions) return false;
  const normalized = normalizeAction(action);
  return scopeHasAction(getWorkflowScope(permissions, scopeName), normalized);
}

export function hasPayablesScopePermission(
  scopeName: (typeof PAYABLES_SCOPES)[number],
  action: "view" | "create" | "edit" | "delete"
): boolean {
  if (isSuperAdmin()) return true;
  const permissions = getPermissions();
  if (!permissions) return false;
  const normalized = normalizeAction(action);
  return scopeHasAction(getPayablesScope(permissions, scopeName), normalized);
}

export function canViewPayablesTab(tab: "Sales Persons" | "Sales Manager" | "Contractors"): boolean {
  const scopeMap = {
    "Sales Persons": "Sales Person" as const,
    "Sales Manager": "Sales Manager" as const,
    Contractors: "Contractor" as const,
  };
  return hasPayablesScopePermission(scopeMap[tab], "view");
}

export function hasPermission(moduleName: string, action: "view" | "create" | "edit" | "delete"): boolean {
  if (isSuperAdmin()) return true;

  const permissions = getPermissions();
  if (!permissions) return false;

  const normalized = normalizeAction(action);

  if ((WORKFLOW_MODULES as readonly string[]).includes(moduleName)) {
    return scopeHasAction(getWorkflowScope(permissions, moduleName), normalized);
  }

  if (moduleName === "Payables" || moduleName === "Commission") {
    if (normalized === "view") {
      return PAYABLES_SCOPES.some((scope) => hasPayablesScopePermission(scope, "view"));
    }
    return PAYABLES_SCOPES.some((scope) => hasPayablesScopePermission(scope, "edit"));
  }

  if (moduleName === "Workflow") {
    if (normalized === "view") {
      return WORKFLOW_MODULES.some((scope) => hasWorkflowScopePermission(scope, "view"));
    }
    return WORKFLOW_MODULES.some((scope) => hasWorkflowScopePermission(scope, "edit"));
  }

  if (moduleName === "Audit") {
    return flatHasAction(resolveFlatModule("Audit", permissions), normalized);
  }

  return flatHasAction(resolveFlatModule(moduleName, permissions), normalized);
}

export function canViewModule(moduleName: string): boolean {
  return hasPermission(moduleName, "view");
}
