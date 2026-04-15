"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = [
    { name: "Users", icon: Users, path: "/dashboard/users" },
    { name: "Customers", icon: Handshake, path: "/dashboard/customers" },
    { name: "Workflow", icon: Workflow, path: "/dashboard/workflow" },
    { name: "Roles & Permissions", icon: ShieldCheck, path: "/dashboard/roles" },
    { name: "Audit Logs", icon: FileSearch, path: "/dashboard/audit" },
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
              className={`${styles.navItem} ${pathname === item.path || (item.path === "/dashboard/users" && pathname.startsWith("/dashboard/users")) ? styles.navActive : ""}`}
              title={isSidebarCollapsed ? item.name : ""}
            >
              <item.icon size={22} strokeWidth={2.5} />
              {!isSidebarCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUser}>
            <div className={styles.avatar} style={{ width: 40, height: 40, border: 'none', boxShadow: 'none', flexShrink: 0 }}>
              <Image 
                src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&h=100&auto=format&fit=crop" 
                alt="User" 
                width={40} 
                height={40}
                className={styles.avatarImg}
              />
            </div>
            {!isSidebarCollapsed && (
              <div className={styles.userInfoSidebar}>
                <div className={styles.sidebarUserName}>Alex Sterling</div>
                <div className={styles.sidebarUserRole}>System Admin</div>
              </div>
            )}
          </div>
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
            <div className={styles.searchBar}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search industrial assets, leads, or projects..." 
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.navActions}>
            <div className={styles.iconBtn}>
              <Bell size={22} />
              <span className={styles.notification}></span>
            </div>
            <div className={styles.iconBtn}>
              <Settings size={22} />
            </div>
            <div className={styles.divider}></div>
            <div className={styles.userProfile}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>Admin User</div>
                <div className={styles.userRole}>HEAD OF OPERATIONS</div>
              </div>
              <div className={styles.avatar}>
                <Image 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100&h=100&auto=format&fit=crop" 
                  alt="Admin" 
                  width={40} 
                  height={40}
                  className={styles.avatarImg}
                />
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
