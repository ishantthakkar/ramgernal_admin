"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import styles from "./products.module.css";
import dashboardStyles from "../dashboard.module.css";
import { Search, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  ProductFormModal,
  type ProductFormData,
} from "@/components/modals/AddProductModal";
import { adminApi } from "@/lib/api";

interface Product {
  id: string;
  sku: string;
  name: string;
  salesPrice: number;
  commission: number;
  installationCost: number;
}

const TABLE_COLUMNS = [
  "SKU",
  "Name",
  "Sales Price",
  "Commission",
  "Installation Cost",
  "Actions",
] as const;

function formatMoney(value: number): string {
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
    salesPrice: Number(raw.salesPrice ?? 0),
    commission: Number(raw.commission ?? 0),
    installationCost: Number(raw.installationCost ?? 0),
  };
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const itemsPerPage = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getProducts();
      const list = (response.products || []).map((p: Record<string, unknown>) =>
        mapProduct(p)
      );
      setProducts(list);
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
    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      return (
        product.sku.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        formatMoney(product.salesPrice).toLowerCase().includes(query) ||
        formatMoney(product.commission).toLowerCase().includes(query) ||
        formatMoney(product.installationCost).toLowerCase().includes(query)
      );
    });
  }, [searchQuery, products]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const tableColSpan = TABLE_COLUMNS.length;

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }

  function openAddModal() {
    setEditingProduct(null);
    setModalMode("add");
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingProduct(null);
  }

  async function handleAddProduct(data: ProductFormData) {
    setIsSubmitting(true);
    try {
      await adminApi.createProduct(data);
      closeModal();
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

  async function handleEditProduct(data: ProductFormData) {
    if (!editingProduct) return;

    setIsSubmitting(true);
    try {
      await adminApi.updateProduct(editingProduct.id, data);
      closeModal();
      toast.success("Product updated successfully.");
      await fetchProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update product";
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
        <span className={dashboardStyles.breadcrumbCurrent}>PRODUCTS</span>
      </div>

      <div className={styles.pageHeader}>
        <h1 className={styles.directoryTitle}>Products Directory</h1>
        <button
          type="button"
          className={dashboardStyles.addBtn}
          onClick={openAddModal}
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      <div className={dashboardStyles.tableCard}>
        <div className={dashboardStyles.tableHeader}>
          <div className={dashboardStyles.searchUsers}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by SKU, name, sales price, commission..."
              className={dashboardStyles.searchInputSmall}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className={dashboardStyles.userTableContainer}>
          <table className={dashboardStyles.userTable}>
            <thead>
              <tr>
                {TABLE_COLUMNS.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={tableColSpan} style={{ textAlign: "center", padding: "4rem" }}>
                    <div className={styles.loadingWrap}>
                      <Loader2 size={32} className="animate-spin" />
                      <span>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableColSpan}
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
                    <td className={styles.priceCell}>{formatMoney(product.salesPrice)}</td>
                    <td className={styles.moneyCell}>{formatMoney(product.commission)}</td>
                    <td className={styles.moneyCell}>{formatMoney(product.installationCost)}</td>
                    <td>
                      <button
                        type="button"
                        className={dashboardStyles.assignBtn}
                        onClick={() => openEditModal(product)}
                      >
                        Edit
                      </button>
                    </td>
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

      <ProductFormModal
        isOpen={modalMode === "add"}
        mode="add"
        onClose={closeModal}
        onSubmit={handleAddProduct}
        isSubmitting={isSubmitting}
      />

      <ProductFormModal
        isOpen={modalMode === "edit"}
        mode="edit"
        initialData={editingProduct}
        onClose={closeModal}
        onSubmit={handleEditProduct}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
