"use client";

import {
  LayoutGrid,
  BarChart2,
  User,
  ClipboardCheck,
  Zap,
  Search as SearchIcon,
  History,
  Check,
  Wallet,
  Package,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import {
  ROLE_MODULE_DEFINITIONS,
  type PermissionAction,
} from "@/lib/role-modules";

const MODULE_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutGrid,
  users: User,
  products: Package,
  leads: BarChart2,
  customers: User,
  surveys: ClipboardCheck,
  installation: Zap,
  inspection: SearchIcon,
  services: ClipboardCheck,
  payables: Wallet,
  invoices: Receipt,
  audit: History,
};

interface PermissionMatrixProps {
  permissions: Record<string, Record<PermissionAction, boolean>>;
  onToggle: (moduleId: string, action: PermissionAction) => void;
  readOnly?: boolean;
}

export function PermissionMatrix({
  permissions,
  onToggle,
  readOnly = false,
}: PermissionMatrixProps) {
  return (
    <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem", padding: "0 1rem" }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#94a3b8" }}>MODULE / SCOPE</div>
        {["VIEW", "CREATE", "EDIT"].map((action) => (
          <div key={action} style={{ fontSize: "0.65rem", fontWeight: 800, color: "#94a3b8", textAlign: "center" }}>
            {action}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {ROLE_MODULE_DEFINITIONS.map((module) => {
          const Icon = MODULE_ICONS[module.id] || User;

          return (
            <div
              key={module.id}
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "0.75rem 1rem",
                display: "grid",
                gridTemplateColumns: "2fr repeat(3, 1fr)",
                alignItems: "center",
                gap: "1rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ background: "#f1f5f9", padding: "0.5rem", borderRadius: "8px", color: "#0076ce" }}>
                  <Icon size={18} />
                </div>
                <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>{module.name}</span>
              </div>

              {(["view", "create", "edit"] as PermissionAction[]).map((action) => (
                <div key={action} style={{ display: "flex", justifyContent: "center" }}>
                  {module.allowed.includes(action) ? (
                    <div
                      onClick={() => {
                        if (!readOnly) onToggle(module.id, action);
                      }}
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "4px",
                        border: permissions[module.id][action] ? "none" : "2px solid #e2e8f0",
                        background: permissions[module.id][action] ? "#0076ce" : "transparent",
                        cursor: readOnly ? "default" : "pointer",
                        opacity: readOnly ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      {permissions[module.id][action] && <Check size={14} color="white" strokeWidth={3} />}
                    </div>
                  ) : (
                    <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontWeight: 700 }}>
                      -
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
