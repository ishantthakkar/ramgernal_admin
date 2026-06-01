"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./products.module.css";
import dashboardStyles from "../dashboard.module.css";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Package,
  Zap,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { AddProductModal, type AddProductFormData } from "@/components/modals/AddProductModal";
import { adminApi } from "@/lib/api";

type CategoryTab = "all" | "PSE&G" | "JCP&L" | "ATLANTIC CITY ENERGY";

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: Exclude<CategoryTab, "all">;
}

interface ProductCounts {
  total: number;
  "PSE&G": number;
  "JCP&L": number;
  "ATLANTIC CITY ENERGY": number;
}

const TABS: CategoryTab[] = ["all", "PSE&G", "JCP&L", "ATLANTIC CITY ENERGY"];

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function mapProduct(raw: Record<string, unknown>): Product {
  return {
    id: String(raw._id ?? raw.id),
    sku: String(raw.sku),
    name: String(raw.name),
    price: Number(raw.price),
    category: raw.category as Product["category"],
  };
}

function getCategoryBadgeClass(category: Product["category"]): string {
  if (category === "PSE&G") return styles.badgePseg;
  if (category === "JCP&L") return styles.badgeJcpl;
  return styles.badgeAtlantic;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const initialTab: CategoryTab = TABS.includes(tabParam as CategoryTab)
    ? (tabParam as CategoryTab)
    : "all";
  const [activeTab, setActiveTab] = useState<CategoryTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [counts, setCounts] = useState<ProductCounts>({
    total: 0,
    "PSE&G": 0,
    "JCP&L": 0,
    "ATLANTIC CITY ENERGY": 0,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const itemsPerPage = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getProducts();
      const list = (response.products || []).map((p: Record<string, unknown>) => mapProduct(p));
      setProducts(list);
      if (response.counts) {
        setCounts({
          total: response.counts.total ?? list.length,
          "PSE&G": response.counts["PSE&G"] ?? 0,
          "JCP&L": response.counts["JCP&L"] ?? 0,
          "ATLANTIC CITY ENERGY": response.counts["ATLANTIC CITY ENERGY"] ?? 0,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load products";
      toast.error(message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesTab = activeTab === "all" || product.category === activeTab;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        product.sku.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        formatPrice(product.price).toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery, products]);

  const stats = useMemo(
    () => [
      {
        label: "All Products",
        value: counts.total,
        icon: Package,
        color: "#0076ce",
        bg: "#eff6ff",
      },
      {
        label: "PSE&G",
        value: counts["PSE&G"],
        icon: Zap,
        color: "#1d4ed8",
        bg: "#dbeafe",
      },
      {
        label: "JCP&L",
        value: counts["JCP&L"],
        icon: Zap,
        color: "#854d0e",
        bg: "#fef3c7",
      },
      {
        label: "Atlantic City Energy",
        value: counts["ATLANTIC CITY ENERGY"],
        icon: Zap,
        color: "#166534",
        bg: "#dcfce7",
      },
    ],
    [counts]
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  function handleTabChange(tab: CategoryTab) {
    setActiveTab(tab);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }

  async function handleAddProduct(data: AddProductFormData) {
    setIsSubmitting(true);
    try {
      await adminApi.createProduct({
        sku: data.sku,
        name: data.name,
        price: data.price,
        category: data.category,
      });
      setIsAddModalOpen(false);
      setCurrentPage(1);
      toast.success("Product added successfully.");
      await fetchProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add product";
      toast.error(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.productsPage}>
      <div className={dashboardStyles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span style={{ color: "#0076ce" }}>PRODUCTS</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.directoryTitle}>Products Directory</h1>
        <button
          type="button"
          className={dashboardStyles.addBtn}
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: stat.bg,
                color: stat.color,
                marginBottom: "1rem",
              }}
            >
              <stat.icon size={22} />
            </div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={dashboardStyles.tableCard}>
        <div className={dashboardStyles.tableHeader}>
          <div className={dashboardStyles.tabs}>
            {TABS.map((tab) => (
              <div
                key={tab}
                className={`${dashboardStyles.tab} ${activeTab === tab ? dashboardStyles.tabActive : ""}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab === "all" ? "All" : tab}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div className={dashboardStyles.searchUsers}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by SKU, name, or price..."
                className={dashboardStyles.searchInputSmall}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500 }}>
              Showing {currentItems.length} of {filteredProducts.length} products
            </div>
          </div>
        </div>

        <div className={dashboardStyles.userTableContainer}>
          <table className={dashboardStyles.userTable}>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Price</th>
                {activeTab === "all" && <th>Utility/Electric Company</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === "all" ? 4 : 3} style={{ textAlign: "center", padding: "4rem" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1rem",
                        color: "#94a3b8",
                      }}
                    >
                      <Loader2 size={32} className="animate-spin" />
                      <span style={{ fontWeight: 600 }}>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "all" ? 4 : 3}
                    style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}
                  >
                    No products found matching your criteria.
                  </td>
                </tr>
              ) : (
                currentItems.map((product) => (
                  <tr key={product.id}>
                    <td className={styles.skuCell}>{product.sku}</td>
                    <td className={styles.nameCell}>{product.name}</td>
                    <td className={styles.priceCell}>{formatPrice(product.price)}</td>
                    {activeTab === "all" && (
                      <td>
                        <span className={`${styles.utilityBadge} ${getCategoryBadgeClass(product.category)}`}>
                          {product.category}
                        </span>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={dashboardStyles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {filteredProducts.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} results
          </div>
          <div className={dashboardStyles.pagination}>
            <div
              className={`${dashboardStyles.pageBtn} ${currentPage === 1 ? dashboardStyles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </div>
            {[...Array(totalPages)].map((_, i) => (
              <div
                key={i}
                className={`${dashboardStyles.pageBtn} ${currentPage === i + 1 ? dashboardStyles.pageActive : ""}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </div>
            ))}
            <div
              className={`${dashboardStyles.pageBtn} ${currentPage === totalPages ? dashboardStyles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddProduct}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
