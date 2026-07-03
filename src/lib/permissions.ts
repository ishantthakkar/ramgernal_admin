
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

import {
  USER_SCOPE_NAMES,
  USER_TAB_SCOPE_MAP,
  getUserScopeFromRole,
  type UserRoleTabLabel,
  type UserScopeName,
} from "@/lib/role-modules";

const WORKFLOW_MODULES = ["Surveys", "Quotations", "Installation", "Inspection"] as const;
const USER_SCOPES = USER_SCOPE_NAMES;
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

function getUserScope(
  permissions: UserPermissions,
  scopeName: string
): NestedPermissionScope | undefined {
  const userPerms = permissions.User || permissions.Users;
  if (isNestedScope(userPerms)) {
    return userPerms[scopeName];
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

export function getUserInfo(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user_info");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeUserRole(role?: string): string {
  return (role || "").trim().toLowerCase().replace(/_/g, " ");
}

export function isSalesPersonUser(): boolean {
  const userRole = (getUserInfo()?.userRole as string | undefined) ?? undefined;
  return normalizeUserRole(userRole) === "sales person";
}

export function isSalesManagerUser(): boolean {
  const userRole = (getUserInfo()?.userRole as string | undefined) ?? undefined;
  return normalizeUserRole(userRole) === "sales manager";
}

export function isAdminUser(): boolean {
  const role = normalizeUserRole((getUserInfo()?.userRole as string | undefined) ?? undefined);
  return role === "admin";
}

/** Workflow survey Verify — Super Admin, Admin, or Sales Manager only */
export function canVerifyWorkflowSurvey(): boolean {
  return isSuperAdmin() || isAdminUser() || isSalesManagerUser();
}

/** Workflow survey Reopen — Super Admin, Admin, or Sales Manager only */
export function canReopenWorkflowSurvey(): boolean {
  return isSuperAdmin() || isAdminUser() || isSalesManagerUser();
}

function isQuotationWorkflowRole(): boolean {
  return isSuperAdmin() || isAdminUser() || isSalesManagerUser() || isSalesPersonUser();
}

/** Workflow Quotations tab / list — role-based or Workflow › Quotations view permission */
export function canAccessWorkflowQuotations(): boolean {
  return isQuotationWorkflowRole() || hasWorkflowScopePermission("Quotations", "view");
}

/** Generate quotation PDF — Admin, Sales Manager, Sales Person, or Workflow › Quotations edit */
export function canGenerateQuotation(): boolean {
  return isQuotationWorkflowRole() || hasWorkflowScopePermission("Quotations", "edit");
}

/** Edit quotation SKUs, upload signed PDF — same as generate */
export function canManageWorkflowQuotation(): boolean {
  return canGenerateQuotation();
}

/** Approve / verify quotation — Super Admin or Admin only */
export function canApproveQuotation(): boolean {
  return isSuperAdmin() || isAdminUser();
}

/** Proposed Fixtures SKU table on quotation page — Super Admin or Admin only */
export function canViewQuotationFixtureTable(): boolean {
  return isSuperAdmin() || isAdminUser();
}

export function canViewDashboardRecentActivities(): boolean {
  if (isSuperAdmin()) return true;
  return !isSalesManagerUser() && !isSalesPersonUser();
}

export function getCurrentUserId(): string | null {
  const info = getUserInfo();
  const id =
    (info?._id as string | undefined) ??
    (info?.id as string | undefined) ??
    (info?.userId as string | undefined);
  return id ? String(id) : null;
}

/** Site Details area reorder — super admin, Admin role, or Sales Person only */
export function canReorderSiteDetails(): boolean {
  if (isSuperAdmin()) return true;
  const role = normalizeUserRole((getUserInfo()?.userRole as string | undefined) ?? undefined);
  return role === "sales person" || role === "admin";
}

export function canManageCustomerSurveys(): boolean {
  if (isSuperAdmin()) return true;
  const role = normalizeUserRole((getUserInfo()?.userRole as string | undefined) ?? undefined);
  if (role === "admin") return true;
  return isSalesPersonUser() || hasWorkflowScopePermission("Surveys", "edit");
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

export function hasUserScopePermission(
  scopeName: UserScopeName,
  action: "view" | "create" | "edit" | "delete"
): boolean {
  if (isSuperAdmin()) return true;
  const permissions = getPermissions();
  if (!permissions) return false;
  const normalized = normalizeAction(action);
  const scopePerms = getUserScope(permissions, scopeName);
  if (scopePerms) {
    return scopeHasAction(scopePerms, normalized);
  }
  return flatHasAction(resolveFlatModule("User", permissions), normalized);
}

export function canViewUserTab(tab: keyof typeof USER_TAB_SCOPE_MAP): boolean {
  return hasUserScopePermission(USER_TAB_SCOPE_MAP[tab], "view");
}

export function canEditUserTab(tab: keyof typeof USER_TAB_SCOPE_MAP): boolean {
  return hasUserScopePermission(USER_TAB_SCOPE_MAP[tab], "edit");
}

export function canEditUserByRole(role?: string): boolean {
  if (hasUserScopePermission("All Users", "edit")) return true;
  const scope = getUserScopeFromRole(role);
  if (!scope) return hasPermission("User", "edit");
  return hasUserScopePermission(scope, "edit");
}

export function canViewUserByRole(role?: string): boolean {
  if (hasUserScopePermission("All Users", "view")) return true;
  const scope = getUserScopeFromRole(role);
  if (!scope) return hasPermission("User", "view");
  return hasUserScopePermission(scope, "view");
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

  if (moduleName === "User") {
    const userPerms = permissions.User || permissions.Users;
    if (isNestedScope(userPerms)) {
      if (normalized === "view") {
        return USER_SCOPES.some((scope) => hasUserScopePermission(scope, "view"));
      }
      return USER_SCOPES.some((scope) => hasUserScopePermission(scope, "edit"));
    }
    return flatHasAction(resolveFlatModule("User", permissions), normalized);
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
