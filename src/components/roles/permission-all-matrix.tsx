"use client";

import {
  BarChart2,
  Check,
  ClipboardCheck,
  FileText,
  LayoutGrid,
  Package,
  Receipt,
  Search as SearchIcon,
  User,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import roleStyles from "@/app/(authenticated)/roles/roles.module.css";
import {
  PERMISSION_TABS,
  permissionKey,
  type PermissionAction,
  type PermissionsState,
} from "@/lib/role-modules";

const TAB_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutGrid,
  user: User,
  products: Package,
  leads: BarChart2,
  customers: User,
  workflow: FileText,
  services: ClipboardCheck,
  payables: Wallet,
  invoices: Receipt,
};

const SCOPE_ICONS: Record<string, LucideIcon> = {
  surveys: ClipboardCheck,
  quotations: Receipt,
  installation: Zap,
  inspection: SearchIcon,
  sales_person: User,
  sales_manager: User,
  contractor: User,
};

interface PermissionAllMatrixProps {
  permissions: PermissionsState;
  onToggle: (key: string, action: PermissionAction) => void;
  readOnly?: boolean;
}

function PermissionCheckbox({
  checked,
  disabled,
  onClick,
}: {
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={`${roleStyles.permCheckbox} ${checked ? roleStyles.permCheckboxChecked : ""} ${disabled ? roleStyles.permCheckboxDisabled : ""}`}
    >
      {checked && <Check size={14} color="white" strokeWidth={3} />}
    </div>
  );
}

function PermissionRow({
  label,
  icon: Icon,
  permKey,
  allowed,
  permissions,
  readOnly,
  onToggle,
}: {
  label: string;
  icon: LucideIcon;
  permKey: string;
  allowed: PermissionAction[];
  permissions: PermissionsState;
  readOnly: boolean;
  onToggle: (key: string, action: PermissionAction) => void;
}) {
  const rowPerms = permissions[permKey] || { view: false, edit: false };

  return (
    <div className={roleStyles.permRow}>
      <div className={roleStyles.permRowLabel}>
        <div className={roleStyles.permRowIcon}>
          <Icon size={18} />
        </div>
        <span>{label}</span>
      </div>

      {(["view", "edit"] as PermissionAction[]).map((action) => (
        <div key={action} className={roleStyles.permRowAction}>
          {allowed.includes(action) ? (
            <PermissionCheckbox
              checked={rowPerms[action]}
              disabled={readOnly}
              onClick={() => onToggle(permKey, action)}
            />
          ) : (
            <span className={roleStyles.permDash}>—</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function PermissionAllMatrix({
  permissions,
  onToggle,
  readOnly = false,
}: PermissionAllMatrixProps) {
  return (
    <div className={roleStyles.permAllMatrix}>
      <div className={roleStyles.permGridHeader}>
        <div>MODULE / SCOPE</div>
        <div>VIEW</div>
        <div>EDIT</div>
      </div>

      <div className={roleStyles.permAllSections}>
        {PERMISSION_TABS.map((tab) => {
          const TabIcon = TAB_ICONS[tab.id] || User;

          return (
            <div key={tab.id} className={roleStyles.permSection}>
              <div className={roleStyles.permSectionTitle}>
                <div className={roleStyles.permRowIcon}>
                  <TabIcon size={18} />
                </div>
                <span>{tab.name}</span>
              </div>

              <div className={roleStyles.permRows}>
                {tab.scopes?.length ? (
                  tab.scopes.map((scope) => (
                    <PermissionRow
                      key={scope.id}
                      label={scope.name}
                      icon={SCOPE_ICONS[scope.id] || User}
                      permKey={permissionKey(tab.id, scope.id)}
                      allowed={scope.allowed}
                      permissions={permissions}
                      readOnly={readOnly}
                      onToggle={onToggle}
                    />
                  ))
                ) : (
                  <PermissionRow
                    label={tab.name}
                    icon={TabIcon}
                    permKey={tab.id}
                    allowed={tab.allowed}
                    permissions={permissions}
                    readOnly={readOnly}
                    onToggle={onToggle}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

