"use client";

import { useState } from "react";
import {
  LayoutGrid,
  BarChart2,
  User,
  ClipboardCheck,
  Zap,
  Search as SearchIcon,
  Check,
  Wallet,
  Package,
  Receipt,
  Workflow,
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
  workflow: Workflow,
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

interface PermissionTabsMatrixProps {
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

export function PermissionTabsMatrix({
  permissions,
  onToggle,
  readOnly = false,
}: PermissionTabsMatrixProps) {
  const [activeTabId, setActiveTabId] = useState(PERMISSION_TABS[0].id);
  const activeTab = PERMISSION_TABS.find((tab) => tab.id === activeTabId) || PERMISSION_TABS[0];
  const TabIcon = TAB_ICONS[activeTab.id] || User;

  return (
    <div className={roleStyles.permTabsMatrix}>
      <div className={roleStyles.permTabList}>
        {PERMISSION_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id] || User;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${roleStyles.permTabBtn} ${activeTabId === tab.id ? roleStyles.permTabBtnActive : ""}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      <div className={roleStyles.permTabPanel}>
        <div className={roleStyles.permTabPanelHeader}>
          <div className={roleStyles.permTabPanelTitle}>
            <div className={roleStyles.permRowIcon}>
              <TabIcon size={20} />
            </div>
            <div>
              <h3>{activeTab.name}</h3>
              <p>
                {activeTab.scopes?.length
                  ? "Configure view and edit access for each section."
                  : "Configure module access permissions."}
              </p>
            </div>
          </div>
        </div>

        <div className={roleStyles.permGridHeader}>
          <div>MODULE / SCOPE</div>
          <div>VIEW</div>
          <div>EDIT</div>
        </div>

        <div className={roleStyles.permRows}>
          {activeTab.scopes?.length ? (
            activeTab.scopes.map((scope) => (
              <PermissionRow
                key={scope.id}
                label={scope.name}
                icon={SCOPE_ICONS[scope.id] || User}
                permKey={permissionKey(activeTab.id, scope.id)}
                allowed={scope.allowed}
                permissions={permissions}
                readOnly={readOnly}
                onToggle={onToggle}
              />
            ))
          ) : (
            <PermissionRow
              label={activeTab.name}
              icon={TabIcon}
              permKey={activeTab.id}
              allowed={activeTab.allowed}
              permissions={permissions}
              readOnly={readOnly}
              onToggle={onToggle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
