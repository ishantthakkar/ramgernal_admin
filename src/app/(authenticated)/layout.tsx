"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import {
  LayoutDashboard,
  Users,
  Handshake,
  Workflow,
  ShieldCheck,
  FileSearch,
  Settings,
  LogOut,
  Search,
  PanelLeft,
  Wallet,
  Package,
  User,
  Receipt,
} from "lucide-react";
import { toast } from "react-toastify";
import { canViewModule, isSuperAdmin } from "@/lib/permissions";

function getDisplayName(userInfo: { fullName?: string } | null, isAdmin: boolean): string {
  if (isAdmin) return "Super Admin";
  return userInfo?.fullName || "User";
}

function getCustomAvatarUrl(userInfo: Record<string, unknown> | null): string | null {
  const custom =
    (userInfo?.profileImage as string) ||
    (userInfo?.avatar as string) ||
    (userInfo?.avatarUrl as string);
  return custom || null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/");
    } else {
      setIsAuthChecking(false);
      const savedInfo = localStorage.getItem("user_info");
      if (savedInfo) {
        setUserInfo(JSON.parse(savedInfo));
      }
    }
  }, [router]);

  if (isAuthChecking) {
    return null; // or a loading spinner
  }

  const allNavItems = [
    { name: "Users", icon: Users, path: "/users", module: "User" },
    { name: "Products", icon: Package, path: "/products", isVisible: true },
    { name: "Leads", icon: Search, path: "/leads", module: "Leads" },
    { name: "Customers", icon: Handshake, path: "/customers", module: "Customers" },
    { 
      name: "Workflow", 
      icon: Workflow, 
      path: "/workflow", 
      isVisible: canViewModule("Surveys") || canViewModule("Installation") || canViewModule("Inspection") 
    },
    { name: "Services", icon: Settings, path: "/services", module: "Services" },
    { name: "Payables", icon: Wallet, path: "/commissions", module: "Payables" },
    { name: "Invoices", icon: Receipt, path: "/invoices", isVisible: true },
    { name: "Roles & Permissions", icon: ShieldCheck, path: "/roles", isVisible: isSuperAdmin() },
    { name: "Audit Logs", icon: FileSearch, path: "/audit", module: "Audit" },
  ];

  const filteredNavItems = allNavItems.filter(item => item.isVisible !== undefined ? item.isVisible : canViewModule(item.module || ""));
  const canViewDashboard = canViewModule("Dashboard");
  const displayName = getDisplayName(userInfo, isSuperAdmin());
  const customAvatarUrl = getCustomAvatarUrl(userInfo);

  return (
    <div className={`${styles.layout} ${isSidebarCollapsed ? styles.collapsed : ""}`}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
        <div className={styles.logoArea}>
          <Image
            src="/ram-logo.png"
            alt="RAM"
            width={isSidebarCollapsed ? 40 : 180}
            height={60}
            className={`${styles.logoImg} ${styles.logoImgSidebar}`}
            priority
          />
        </div>

        <nav className={styles.nav}>
          {/* Dashboard - First Item */}
          {canViewDashboard && (
            <Link
              href="/dashboard"
              className={`${styles.navItem} ${pathname === "/dashboard" ? styles.navActive : ""}`}
              title={isSidebarCollapsed ? "Dashboard" : ""}
            >
              <LayoutDashboard size={22} strokeWidth={2.5} />
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </Link>
          )}

          {/* Other Nav Items */}
          {filteredNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`${styles.navItem} ${pathname === item.path || ((item.path === "/users" || item.path === "/products" || item.path === "/leads" || item.path === "/customers" || item.path === "/workflow" || item.path === "/services" || item.path === "/commissions" || item.path === "/roles" || item.path === "/audit") && pathname.startsWith(item.path)) ? styles.navActive : ""}`}
              title={isSidebarCollapsed ? item.name : ""}
            >
              <item.icon size={22} strokeWidth={2.5} />
              {!isSidebarCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={`${styles.navItem} ${styles.logoutBtn}`}
            onClick={() => {
              localStorage.removeItem("auth_token");
              localStorage.removeItem("user_info");
              localStorage.removeItem("user_permissions");
              localStorage.removeItem("is_super_admin");
              toast.success("Logout successful. See you soon!");
              router.push("/");
            }}
            title={isSidebarCollapsed ? "Logout" : ""}
          >
            <LogOut size={22} strokeWidth={2.5} className={styles.logoutIcon} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className={styles.mainContent}>
        {/* Top Navbar */}
        <header className={styles.navbar}>
          <div className={styles.navLeft}>
            <button
              type="button"
              className={styles.sidebarToggle}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              aria-label="Toggle sidebar"
            >
              <PanelLeft size={22} />
            </button>
          </div>

          <div className={styles.navActions}>
            <div className={styles.userProfile}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{displayName}</span>
              </div>
              <div className={styles.avatar} title={displayName}>
                {customAvatarUrl ? (
                  <Image
                    src={customAvatarUrl}
                    alt={displayName}
                    width={42}
                    height={42}
                    className={styles.avatarImg}
                  />
                ) : (
                  <User size={22} strokeWidth={2} className={styles.avatarIcon} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
