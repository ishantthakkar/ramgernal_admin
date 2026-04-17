"use client";

import { useState } from "react";
import styles from "./customers.module.css";
import { 
  UserPlus, 
  Filter, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { useRouter } from "next/navigation";
import dashboardStyles from "../dashboard.module.css";

export default function CustomersPage() {
  const router = useRouter();
  const [activePage, setActivePage] = useState(1);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const customers = [
    { 
      id: "#VC-92410", 
      name: "Robert Millhouse", 
      mobile: "+1 235 1254 2214", 
      email: "r.mill@gridtech.com", 
      company: "GridTech Solutions", 
      status: "Active" 
    },
    { 
      id: "#VC-92411", 
      name: "Sarah Chen", 
      mobile: "+1 235 1254 2214", 
      email: "s.chen@voltcore.io", 
      company: "GridTech Solutions", 
      status: "Active" 
    },
    { 
      id: "#VC-92415", 
      name: "David Abrahams", 
      mobile: "+1 235 1254 2214", 
      email: "david.a@independent.net", 
      company: "GridTech Solutions", 
      status: "Deactivated" 
    },
    { 
      id: "#VC-92420", 
      name: "Marcus Aurelius", 
      mobile: "+1 235 1254 2214", 
      email: "m.aurelius@gridtech.com", 
      company: "GridTech Solutions", 
      status: "Active" 
    },
  ];

  return (
    <div className={styles.customersPage} onClick={() => setOpenActionId(null)}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span> 
        <span style={{ color: "#0076ce" }}>COSTUMERS</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Costumers</h1>
        <button className={styles.addBtn}>
          <UserPlus size={20} />
          Add Costumer
        </button>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {/* Toolbar */}
        <div className={styles.tableToolbar}>
          <div className={styles.filterBtn}>
            <Filter size={18} />
            Filters
          </div>
          <div className={styles.showingCount}>
            Showing <span>1-10</span> of 1,284 users
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>COSTUMER NAME</th>
                <th>MOBILE NUMBER</th>
                <th>EMAIL</th>
                <th>COMPANY</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={index}>
                  <td className={styles.idCell}>{customer.id}</td>
                  <td className={styles.nameCell}>{customer.name}</td>
                  <td>{customer.mobile}</td>
                  <td>{customer.email}</td>
                  <td>{customer.company}</td>
                  <td>
                    <div className={styles.statusIndicator}>
                      <div className={customer.status === "Active" ? styles.dotActive : styles.dotDeactivated}></div>
                      {customer.status}
                    </div>
                  </td>
                  <td className={styles.actionsCell} style={{ textAlign: "right", position: "relative", overflow: "visible" }}>
                    <div onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionId(openActionId === customer.id ? null : customer.id);
                    }}>
                      <MoreVertical size={20} style={{ cursor: "pointer" }} />
                    </div>

                    {openActionId === customer.id && (
                      <div className={styles.actionDropdown}>
                        <div 
                          className={styles.dropdownItem}
                          onClick={() => router.push(`/customers/${customer.id.replace('#', '')}/edit`)}
                        >
                          Edit
                        </div>
                        <div className={styles.dropdownDivider}></div>
                        <div 
                          className={styles.dropdownItem}
                          onClick={() => router.push(`/customers/${customer.id.replace('#', '')}`)}
                        >
                          View
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className={styles.tableFooter}>
          <div className={styles.entriesInfo}>
            Showing 1 to 4 of 1,284 entries
          </div>
          <div className={styles.pagination}>
            <div className={styles.pageNav}><ChevronLeft size={18} /></div>
            <div 
              className={`${styles.pageBtn} ${activePage === 1 ? styles.pageActive : ""}`}
              onClick={() => setActivePage(1)}
            >
              1
            </div>
            <div 
              className={`${styles.pageBtn} ${activePage === 2 ? styles.pageActive : ""}`}
              onClick={() => setActivePage(2)}
            >
              2
            </div>
            <div 
              className={`${styles.pageBtn} ${activePage === 3 ? styles.pageActive : ""}`}
              onClick={() => setActivePage(3)}
            >
              3
            </div>
            <div className={styles.pageDots}>...</div>
            <div 
              className={`${styles.pageBtn} ${activePage === 128 ? styles.pageActive : ""}`}
              onClick={() => setActivePage(128)}
            >
              128
            </div>
            <div className={styles.pageNav}><ChevronRight size={18} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
