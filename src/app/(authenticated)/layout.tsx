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
  Bell,
  PanelLeft,
  Wallet,
  User,
} from "lucide-react";
import { toast } from "react-toastify";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/");
    } else {
      setIsAuthChecking(false);
    }
  }, [router]);

  if (isAuthChecking) {
    return null; // or a loading spinner
  }

  const navItems = [
    { name: "Users", icon: Users, path: "/users" },
    { name: "Leads", icon: Search, path: "/leads" },
    { name: "Customers", icon: Handshake, path: "/customers" },
    { name: "Workflow", icon: Workflow, path: "/workflow" },
    { name: "Commissions", icon: Wallet, path: "/commissions" },
    { name: "Roles & Permissions", icon: ShieldCheck, path: "/roles" },
    { name: "Audit Logs", icon: FileSearch, path: "/audit" },
  ];

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
            className={styles.logoImg}
            priority
          />
        </div>

        <nav className={styles.nav}>
          {/* Dashboard - First Item */}
          <Link
            href="/dashboard"
            className={`${styles.navItem} ${pathname === "/dashboard" ? styles.navActive : ""}`}
            title={isSidebarCollapsed ? "Dashboard" : ""}
          >
            <LayoutDashboard size={22} strokeWidth={2.5} />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </Link>

          {/* Other Nav Items */}
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`${styles.navItem} ${pathname === item.path || ((item.path === "/users" || item.path === "/leads" || item.path === "/customers" || item.path === "/workflow" || item.path === "/commissions" || item.path === "/roles" || item.path === "/audit") && pathname.startsWith(item.path)) ? styles.navActive : ""}`}
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
              toast.success("Logout successful. See you soon!");
              router.push("/");
            }}
            title={isSidebarCollapsed ? "Logout" : ""}
          >
            <LogOut size={22} strokeWidth={2.5} color="#f87171" className={styles.logoutIcon} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className={styles.mainContent}>
        {/* Top Navbar */}
        <header className={styles.navbar}>
          <div className={styles.navLeft}>
            <div className={styles.sidebarToggle} onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              <PanelLeft size={22} />
            </div>
          </div>

          <div className={styles.navActions}>
            <div className={styles.userProfile}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>Super Admin</div>
              </div>
              <div className={styles.avatar}>
                <User size={24} color="#64748b" />
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
