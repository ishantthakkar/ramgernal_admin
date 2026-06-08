
export interface Permission {
  view: number;
  create: number;
  edit: number;
  delete?: number;
}

export interface UserPermissions {
  [module: string]: Permission;
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

function resolveModulePermissions(moduleName: string, permissions: UserPermissions): Permission | undefined {
  if (moduleName === "Payables") {
    return permissions.Payables || permissions.Commission;
  }
  return permissions[moduleName];
}

export function hasPermission(moduleName: string, action: "view" | "create" | "edit" | "delete"): boolean {
  if (isSuperAdmin()) return true;

  const permissions = getPermissions();
  if (!permissions) return false;

  const modulePerms = resolveModulePermissions(moduleName, permissions);
  if (!modulePerms) return false;

  return modulePerms[action] === 1;
}

export function canViewModule(moduleName: string): boolean {
  return hasPermission(moduleName, "view");
}
