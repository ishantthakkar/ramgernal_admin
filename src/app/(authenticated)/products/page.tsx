"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import styles from "./products.module.css";
import dashboardStyles from "../dashboard.module.css";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  Save,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  ProductFormModal,
  type ProductFormData,
} from "@/components/modals/AddProductModal";
import { adminApi } from "@/lib/api";
import {
  downloadProductTemplate,
  exportProductsToExcel,
  isMongoObjectId,
  parseProductExcelFile,
} from "@/lib/product-excel";

interface Product {
  id: string;
  sku: string;
  name: string;
  salesPrice: number;
  commission: number;
  installationCost: number;
}

type DataSource = "api" | "upload";

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

function mapUploadRow(
  row: ProductFormData & { rowNumber: number },
  index: number
): Product {
  return {
    id: `upload-${row.rowNumber}-${index}`,
    sku: row.sku,
    name: row.name,
    salesPrice: row.salesPrice,
    commission: row.commission,
    installationCost: row.installationCost,
  };
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>("api");
  const [uploadErrors, setUploadErrors] = useState<
    { rowNumber: number; message: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [bulkSaveProgress, setBulkSaveProgress] = useState("");
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getProducts();
      const list = (response.products || []).map((p: Record<string, unknown>) =>
        mapProduct(p)
      );
      setProducts(list);
      setDataSource("api");
      setUploadErrors([]);
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

  const hasUnsavedUpload = dataSource === "upload";
  const unsavedCount = products.filter((p) => !isMongoObjectId(p.id)).length;

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
    if (!isMongoObjectId(product.id)) {
      toast.info("Save imported products to the server before editing.");
      return;
    }
    setEditingProduct(product);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditingProduct(null);
  }

  function handleDownloadTemplate() {
    downloadProductTemplate();
    toast.success("Template downloaded.");
  }

  function handleExport() {
    if (products.length === 0) {
      toast.warn("No products to export.");
      return;
    }
    const payload: ProductFormData[] = products.map(
      ({ sku, name, salesPrice, commission, installationCost }) => ({
        sku,
        name,
        salesPrice,
        commission,
        installationCost,
      })
    );
    const suffix = new Date().toISOString().slice(0, 10);
    exportProductsToExcel(payload, `products-export-${suffix}.xlsx`);
    toast.success("Products exported to Excel.");
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Please upload an .xlsx, .xls, or .csv file.");
      return;
    }

    setIsImporting(true);
    try {
      const { rows, errors } = await parseProductExcelFile(file);

      if (rows.length === 0) {
        setUploadErrors(errors);
        toast.error(
          errors[0]?.message ?? "Could not read any valid rows from the file."
        );
        return;
      }

      setProducts(rows.map(mapUploadRow));
      setDataSource("upload");
      setUploadErrors(errors);
      setCurrentPage(1);
      setSearchQuery("");

      if (errors.length > 0) {
        toast.warn(
          `Loaded ${rows.length} product(s). ${errors.length} row(s) had errors.`
        );
      } else {
        toast.success(`Loaded ${rows.length} product(s) from Excel.`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to read Excel file.";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }

  async function handleSaveBulkToServer() {
    const toSave = products.filter((p) => !isMongoObjectId(p.id));
    if (toSave.length === 0) {
      toast.info("No new products to save. Reload from server or upload a sheet.");
      return;
    }

    setIsSavingBulk(true);
    let created = 0;
    let failed = 0;
    const failDetails: string[] = [];

    for (let i = 0; i < toSave.length; i++) {
      const product = toSave[i];
      setBulkSaveProgress(`${i + 1} / ${toSave.length}`);

      try {
        await adminApi.createProduct({
          sku: product.sku,
          name: product.name,
          salesPrice: product.salesPrice,
          commission: product.commission,
          installationCost: product.installationCost,
        });
        created += 1;
      } catch (err: unknown) {
        failed += 1;
        const message = err instanceof Error ? err.message : "Failed to save";
        failDetails.push(`${product.sku}: ${message}`);
      }
    }

    setBulkSaveProgress("");
    setIsSavingBulk(false);

    if (created > 0) {
      toast.success(`Saved ${created} product(s) to the server.`);
      await fetchProducts();
    }

    if (failed > 0) {
      toast.error(
        `${failed} product(s) could not be saved. ${failDetails.slice(0, 3).join(" ")}`
      );
    }
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
        <h1 className={styles.directoryTitle}>Products</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleDownloadTemplate}
          >
            <Download size={18} /> Template
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleExport}
            disabled={products.length === 0}
          >
            <FileSpreadsheet size={18} /> Export
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            Upload Sheet
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className={styles.hiddenFileInput}
            onChange={handleFileUpload}
          />
          {hasUnsavedUpload && unsavedCount > 0 && (
            <button
              type="button"
              className={dashboardStyles.addBtn}
              onClick={handleSaveBulkToServer}
              disabled={isSavingBulk}
            >
              {isSavingBulk ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSavingBulk
                ? `Saving ${bulkSaveProgress}`
                : `Save ${unsavedCount} to Server`}
            </button>
          )}
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={fetchProducts}
            disabled={loading || isSavingBulk}
            title="Reload products from server"
          >
            <RefreshCw size={18} /> Reload
          </button>
          <button
            type="button"
            className={dashboardStyles.addBtn}
            onClick={openAddModal}
          >
            <Plus size={20} /> Add Product
          </button>
        </div>
      </div>

      {dataSource === "upload" && (
        <div className={styles.uploadBanner}>
          <span>
            Showing <strong>{products.length}</strong> product(s) from your uploaded
            sheet.
            {unsavedCount > 0
              ? ` Click "Save ${unsavedCount} to Server" when ready.`
              : ""}
          </span>
        </div>
      )}

      {uploadErrors.length > 0 && (
        <div className={styles.uploadErrors}>
          <p className={styles.uploadErrorsTitle}>
            Rows skipped during import ({uploadErrors.length})
          </p>
          <ul>
            {uploadErrors.slice(0, 8).map((err) => (
              <li key={`${err.rowNumber}-${err.message}`}>
                {err.rowNumber > 0 ? `Row ${err.rowNumber}: ` : ""}
                {err.message}
              </li>
            ))}
            {uploadErrors.length > 8 && (
              <li>…and {uploadErrors.length - 8} more</li>
            )}
          </ul>
        </div>
      )}

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
              {loading && dataSource === "api" ? (
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
                currentItems.map((product) => {
                  const isUnsaved = !isMongoObjectId(product.id);
                  return (
                    <tr key={product.id}>
                      <td className={styles.skuCell}>
                        {product.sku}
                        {isUnsaved && (
                          <span className={styles.unsavedBadge}>New</span>
                        )}
                      </td>
                      <td className={styles.nameCell}>{product.name}</td>
                      <td className={styles.priceCell}>{formatMoney(product.salesPrice)}</td>
                      <td className={styles.moneyCell}>{formatMoney(product.commission)}</td>
                      <td className={styles.moneyCell}>{formatMoney(product.installationCost)}</td>
                      <td>
                        <button
                          type="button"
                          className={dashboardStyles.assignBtn}
                          onClick={() => openEditModal(product)}
                          disabled={isUnsaved}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={dashboardStyles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {filteredProducts.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} results
            {dataSource === "upload" ? " (from upload)" : ""}
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
