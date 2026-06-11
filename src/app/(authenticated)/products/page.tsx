"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import productStyles from "./products.module.css";
import styles from "../dashboard.module.css";
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
import {
  ProductUploadDuplicateModal,
  type DuplicateUploadItem,
} from "@/components/modals/ProductUploadDuplicateModal";
import { adminApi } from "@/lib/api";
import {
  downloadProductTemplate,
  exportProductsToExcel,
  parseProductExcelFile,
  type ProductExcelRow,
  type ProductExcelParseError,
} from "@/lib/product-excel";
import {
  PRODUCT_FIXTURE_TABS,
  fixtureTypeSlug,
  parseProductTabFromParam,
  type ProductFixtureType,
} from "@/lib/product-fixture-types";

interface Product {
  id: string;
  sku: string;
  name: string;
  salesPrice: number;
  commission: number;
  installationCost: number;
  productType: ProductFixtureType;
  pendingUpload?: "create" | "add-also" | "overwrite";
}

interface PendingUpload {
  rows: ProductExcelRow[];
  errors: ProductExcelParseError[];
  duplicates: DuplicateUploadItem[];
  newRows: ProductExcelRow[];
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

function mapProduct(
  raw: Record<string, unknown>,
  fallbackType: ProductFixtureType
): Product {
  const productType = String(raw.productType || fallbackType) as ProductFixtureType;
  return {
    id: String(raw._id ?? raw.id),
    sku: String(raw.sku),
    name: String(raw.name),
    salesPrice: Number(raw.salesPrice ?? 0),
    commission: Number(raw.commission ?? 0),
    installationCost: Number(raw.installationCost ?? 0),
    productType: PRODUCT_FIXTURE_TABS.includes(productType)
      ? productType
      : fallbackType,
  };
}

function mapUploadRow(
  row: ProductFormData & { rowNumber: number },
  index: number,
  productType: ProductFixtureType
): Product {
  return {
    id: `upload-${row.rowNumber}-${index}`,
    sku: row.sku,
    name: row.name,
    salesPrice: row.salesPrice,
    commission: row.commission,
    installationCost: row.installationCost,
    productType,
    pendingUpload: "create",
  };
}

function mapDuplicateAddAlsoRow(
  item: DuplicateUploadItem,
  index: number,
  productType: ProductFixtureType
): Product {
  return {
    id: `upload-add-also-${item.rowNumber}-${index}`,
    sku: item.sku,
    name: item.uploadedName,
    salesPrice: item.salesPrice,
    commission: item.commission,
    installationCost: item.installationCost,
    productType,
    pendingUpload: "add-also",
  };
}

function mapDuplicateOverwriteRow(
  item: DuplicateUploadItem,
  productType: ProductFixtureType
): Product {
  return {
    id: item.existingId,
    sku: item.sku,
    name: item.uploadedName,
    salesPrice: item.salesPrice,
    commission: item.commission,
    installationCost: item.installationCost,
    productType,
    pendingUpload: "overwrite",
  };
}

type DuplicateResolution = "skip" | "add-also" | "overwrite";

function buildSkuLookup(products: Product[]): Map<string, Product> {
  return new Map(products.map((product) => [product.sku.trim().toLowerCase(), product]));
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProductFixtureType>(() =>
    parseProductTabFromParam(searchParams.get("tab"))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [serverProducts, setServerProducts] = useState<Product[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>("api");
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateQueueIndex, setDuplicateQueueIndex] = useState(0);
  const [duplicateResolutions, setDuplicateResolutions] = useState<
    Map<string, DuplicateResolution>
  >(new Map());
  const [uploadErrors, setUploadErrors] = useState<
    { rowNumber: number; message: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [bulkSaveProgress, setBulkSaveProgress] = useState("");
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;

  const fetchProducts = useCallback(async (fixtureType: ProductFixtureType) => {
    setLoading(true);
    try {
      const response = await adminApi.getProducts(fixtureType);
      const list = (response.products || []).map((p: Record<string, unknown>) =>
        mapProduct(p, fixtureType)
      );
      setProducts(list);
      setServerProducts(list);
      setDataSource("api");
      setUploadErrors([]);
      setPendingUpload(null);
      setDuplicateModalOpen(false);
      setDuplicateQueueIndex(0);
      setDuplicateResolutions(new Map());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load products";
      toast.error(message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setActiveTab(parseProductTabFromParam(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    fetchProducts(activeTab);
  }, [activeTab, fetchProducts]);

  function handleTabChange(tab: ProductFixtureType) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSearchQuery("");
    setCurrentPage(1);
    setUploadErrors([]);
    setPendingUpload(null);
    setDuplicateModalOpen(false);
    setDuplicateQueueIndex(0);
    setDuplicateResolutions(new Map());
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }

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
  const unsavedCount = products.filter((p) => p.pendingUpload).length;

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
    if (product.pendingUpload) {
      toast.info("Save uploaded products to the server before editing.");
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
    const slug = fixtureTypeSlug(activeTab);
    downloadProductTemplate(`${slug}-template.xlsx`);
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
    exportProductsToExcel(
      payload,
      `${fixtureTypeSlug(activeTab)}-export-${suffix}.xlsx`
    );
    toast.success("Products exported to Excel.");
  }

  function applyUploadedProducts(
    newRows: ProductExcelRow[],
    addAlsoDuplicates: DuplicateUploadItem[],
    overwriteDuplicates: DuplicateUploadItem[],
    skippedDuplicates: DuplicateUploadItem[],
    errors: ProductExcelParseError[]
  ) {
    const uploadedProducts: Product[] = [];
    const includedExistingIds = new Set<string>();

    newRows.forEach((row, index) => {
      uploadedProducts.push(mapUploadRow(row, index, activeTab));
    });

    addAlsoDuplicates.forEach((item, index) => {
      const existing = serverProducts.find((product) => product.id === item.existingId);
      if (existing && !includedExistingIds.has(existing.id)) {
        uploadedProducts.push({ ...existing });
        includedExistingIds.add(existing.id);
      }
      uploadedProducts.push(mapDuplicateAddAlsoRow(item, index, activeTab));
    });

    overwriteDuplicates.forEach((item) => {
      uploadedProducts.push(mapDuplicateOverwriteRow(item, activeTab));
    });

    const skippedErrors = skippedDuplicates.map((item) => ({
      rowNumber: item.rowNumber,
      message: `SKU "${item.sku}" was not added (not-add).`,
    }));

    setProducts(uploadedProducts);
    setDataSource("upload");
    setUploadErrors([...errors, ...skippedErrors]);
    setCurrentPage(1);
    setSearchQuery("");
    setPendingUpload(null);
    setDuplicateModalOpen(false);
    setDuplicateQueueIndex(0);
    setDuplicateResolutions(new Map());

    const totalLoaded = uploadedProducts.length;
    if (totalLoaded === 0) {
      toast.warn("No products were loaded from the sheet.");
      return;
    }

    const parts: string[] = [`Loaded ${totalLoaded} product(s) from Excel.`];
    if (addAlsoDuplicates.length > 0) {
      parts.push(`${addAlsoDuplicates.length} duplicate product(s) set to add-also.`);
    }
    if (overwriteDuplicates.length > 0) {
      parts.push(`${overwriteDuplicates.length} product(s) marked to overwrite.`);
    }
    if (skippedDuplicates.length > 0) {
      parts.push(`${skippedDuplicates.length} existing product(s) were skipped.`);
    }
    if (errors.length > 0) {
      parts.push(`${errors.length} row(s) had errors.`);
    }

    if (errors.length > 0 || skippedDuplicates.length > 0) {
      toast.warn(parts.join(" "));
    } else {
      toast.success(parts.join(" "));
    }
  }

  function finishDuplicateUpload(resolutions: Map<string, DuplicateResolution>) {
    if (!pendingUpload) return;

    const addAlsoDuplicates: DuplicateUploadItem[] = [];
    const overwriteDuplicates: DuplicateUploadItem[] = [];
    const skippedDuplicates: DuplicateUploadItem[] = [];

    for (const duplicate of pendingUpload.duplicates) {
      const action = resolutions.get(duplicate.sku.trim().toLowerCase()) ?? "skip";
      if (action === "add-also") {
        addAlsoDuplicates.push(duplicate);
      } else if (action === "overwrite") {
        overwriteDuplicates.push(duplicate);
      } else {
        skippedDuplicates.push(duplicate);
      }
    }

    applyUploadedProducts(
      pendingUpload.newRows,
      addAlsoDuplicates,
      overwriteDuplicates,
      skippedDuplicates,
      pendingUpload.errors
    );
  }

  function resolveCurrentDuplicate(action: DuplicateResolution) {
    if (!pendingUpload) return;

    const current = pendingUpload.duplicates[duplicateQueueIndex];
    if (!current) return;

    const nextResolutions = new Map(duplicateResolutions);
    nextResolutions.set(current.sku.trim().toLowerCase(), action);
    setDuplicateResolutions(nextResolutions);

    const nextIndex = duplicateQueueIndex + 1;
    if (nextIndex < pendingUpload.duplicates.length) {
      setDuplicateQueueIndex(nextIndex);
      return;
    }

    finishDuplicateUpload(nextResolutions);
  }

  function handleDuplicateNo() {
    resolveCurrentDuplicate("skip");
  }

  function handleDuplicateAddAlso() {
    resolveCurrentDuplicate("add-also");
  }

  function handleDuplicateOverwrite() {
    resolveCurrentDuplicate("overwrite");
  }

  function handleDuplicateUploadCancel() {
    setPendingUpload(null);
    setDuplicateModalOpen(false);
    setDuplicateQueueIndex(0);
    setDuplicateResolutions(new Map());
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

    setIsUploading(true);
    try {
      const { rows, errors } = await parseProductExcelFile(file);

      if (rows.length === 0) {
        setUploadErrors(errors);
        toast.error(
          errors[0]?.message ?? "Could not read any valid rows from the file."
        );
        return;
      }

      const serverBySku = buildSkuLookup(serverProducts);
      const duplicates: DuplicateUploadItem[] = [];
      const newRows: ProductExcelRow[] = [];

      for (const row of rows) {
        const existing = serverBySku.get(row.sku.trim().toLowerCase());
        if (existing) {
          duplicates.push({
            rowNumber: row.rowNumber,
            sku: row.sku,
            uploadedName: row.name,
            existingName: existing.name,
            salesPrice: row.salesPrice,
            commission: row.commission,
            installationCost: row.installationCost,
            existingId: existing.id,
          });
        } else {
          newRows.push(row);
        }
      }

      if (duplicates.length > 0) {
        setPendingUpload({ rows, errors, duplicates, newRows });
        setDuplicateQueueIndex(0);
        setDuplicateResolutions(new Map());
        setDuplicateModalOpen(true);
        return;
      }

      applyUploadedProducts(newRows, [], [], [], errors);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to read Excel file.";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSaveBulkToServer() {
    const toSave = products.filter((p) => p.pendingUpload);
    if (toSave.length === 0) {
      toast.info("No new products to save. Reload from server or upload a sheet.");
      return;
    }

    setIsSavingBulk(true);
    let created = 0;
    let updated = 0;
    let failed = 0;
    const failDetails: string[] = [];

    for (let i = 0; i < toSave.length; i++) {
      const product = toSave[i];
      setBulkSaveProgress(`${i + 1} / ${toSave.length}`);

      const payload = {
        sku: product.sku,
        name: product.name,
        salesPrice: product.salesPrice,
        commission: product.commission,
        installationCost: product.installationCost,
        productType: activeTab,
      };

      try {
        if (product.pendingUpload === "overwrite") {
          await adminApi.updateProduct(product.id, payload);
          updated += 1;
        } else {
          await adminApi.createProduct(payload);
          created += 1;
        }
      } catch (err: unknown) {
        failed += 1;
        const message = err instanceof Error ? err.message : "Failed to save";
        failDetails.push(`${product.sku}: ${message}`);
      }
    }

    setBulkSaveProgress("");
    setIsSavingBulk(false);

    if (created > 0 || updated > 0) {
      const parts: string[] = [];
      if (created > 0) parts.push(`${created} created`);
      if (updated > 0) parts.push(`${updated} updated`);
      toast.success(`Saved ${parts.join(" and ")} on the server.`);
      await fetchProducts(activeTab);
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
      const existing = buildSkuLookup(serverProducts).get(
        data.sku.trim().toLowerCase()
      );

      if (existing) {
        toast.error(
          `SKU "${data.sku}" already exists. Edit the product or upload a sheet to overwrite.`
        );
        return;
      }

      await adminApi.createProduct({ ...data, productType: activeTab });
      closeModal();
      setCurrentPage(1);
      toast.success("Product added successfully.");
      await fetchProducts(activeTab);
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
      await adminApi.updateProduct(editingProduct.id, {
        ...data,
        productType: editingProduct.productType,
      });
      closeModal();
      toast.success("Product updated successfully.");
      await fetchProducts(activeTab);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update product";
      toast.error(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={productStyles.productsPage}>
      <div className={styles.breadcrumb}>
        ADMIN <span style={{ color: "#cbd5e1", margin: "0 0.5rem" }}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>PRODUCTS</span>
      </div>

      <div className={productStyles.pageHeader}>
        <h1 className={styles.welcomeText}>Products</h1>
        <div className={productStyles.headerActions}>
          <button
            type="button"
            className={productStyles.secondaryBtn}
            onClick={handleDownloadTemplate}
          >
            <Download size={18} /> Template
          </button>
          <button
            type="button"
            className={productStyles.secondaryBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
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
            className={productStyles.hiddenFileInput}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            className={productStyles.secondaryBtn}
            onClick={() => fetchProducts(activeTab)}
            disabled={loading || isSavingBulk || isUploading}
            title="Reload products from server"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            Reload
          </button>
          <button
            type="button"
            className={productStyles.secondaryBtn}
            onClick={handleExport}
            disabled={products.length === 0}
          >
            <FileSpreadsheet size={18} /> Export
          </button>
          {hasUnsavedUpload && unsavedCount > 0 && (
            <button
              type="button"
              className={styles.addBtn}
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
          <button type="button" className={styles.addBtn} onClick={openAddModal}>
            <Plus size={20} /> Add Product
          </button>
        </div>
      </div>

      {dataSource === "upload" && (
        <div className={productStyles.uploadBanner}>
          <span>
            Showing <strong>{products.length}</strong> product(s) from your uploaded
            sheet
            {products.some((p) => p.pendingUpload === "overwrite")
              ? " (including products to overwrite)"
              : ""}
            .
            {unsavedCount > 0
              ? ` Click "Save ${unsavedCount} to Server" when ready.`
              : ""}
          </span>
        </div>
      )}

      {uploadErrors.length > 0 && (
        <div className={productStyles.uploadErrors}>
          <p className={productStyles.uploadErrorsTitle}>
            Rows skipped during upload ({uploadErrors.length})
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

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={productStyles.productsTabs}>
            {PRODUCT_FIXTURE_TABS.map((tab) => (
              <div
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className={styles.searchUsers}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search products..."
              className={styles.searchInputSmall}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className={styles.userTableContainer}>
          <table className={styles.userTable}>
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
                    <div className={productStyles.loadingWrap}>
                      <Loader2 size={32} className={styles.spinner} />
                      <span style={{ fontWeight: 600 }}>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableColSpan}
                    style={{ textAlign: "center", padding: "4rem", color: "#94a3b8", fontWeight: 600 }}
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                currentItems.map((product) => {
                  const isPendingCreate = product.pendingUpload === "create";
                  const isPendingAddAlso = product.pendingUpload === "add-also";
                  const isPendingOverwrite = product.pendingUpload === "overwrite";
                  return (
                    <tr key={product.id}>
                      <td className={productStyles.skuCell}>
                        {product.sku}
                        {isPendingCreate && (
                          <span className={productStyles.unsavedBadge}>New</span>
                        )}
                        {isPendingAddAlso && (
                          <span className={productStyles.unsavedBadge}>Add Also</span>
                        )}
                        {isPendingOverwrite && (
                          <span className={productStyles.updateBadge}>Overwrite</span>
                        )}
                      </td>
                      <td className={productStyles.nameCell}>{product.name}</td>
                      <td className={productStyles.priceCell}>{formatMoney(product.salesPrice)}</td>
                      <td className={productStyles.moneyCell}>{formatMoney(product.commission)}</td>
                      <td className={productStyles.moneyCell}>{formatMoney(product.installationCost)}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.assignBtn}
                          onClick={() => openEditModal(product)}
                          disabled={Boolean(product.pendingUpload)}
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

        <div className={styles.tableFooter}>
          <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            Showing {filteredProducts.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} results
            {dataSource === "upload" ? " (from upload)" : ""}
          </div>
          <div className={styles.pagination}>
            <div
              className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabled : ""}`}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </div>
            {[...Array(totalPages)].map((_, i) => (
              <div
                key={i}
                className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.pageActive : ""}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </div>
            ))}
            <div
              className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabled : ""}`}
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

      <ProductUploadDuplicateModal
        isOpen={duplicateModalOpen}
        duplicate={pendingUpload?.duplicates[duplicateQueueIndex] ?? null}
        currentIndex={duplicateQueueIndex}
        totalCount={pendingUpload?.duplicates.length ?? 0}
        onNotAdd={handleDuplicateNo}
        onAddAlso={handleDuplicateAddAlso}
        onOverwrite={handleDuplicateOverwrite}
        onCancel={handleDuplicateUploadCancel}
      />
    </div>
  );
}
