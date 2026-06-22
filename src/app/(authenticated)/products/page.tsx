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
import { canViewModule, hasPermission } from "@/lib/permissions";
import {
  ProductFormModal,
  type ExistingProductFormData,
  type ProposedProductFormData,
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
  isProposedExcelRow,
  type ParsedProductExcelRow,
  type ProductExcelParseError,
} from "@/lib/product-excel";
import {
  PRODUCT_FIXTURE_TABS,
  fixtureTypeSlug,
  isExistingFixtureType,
  parseProductTabFromParam,
  type ProductFixtureType,
} from "@/lib/product-fixture-types";

interface Product {
  id: string;
  sku: string;
  name: string;
  utilityPrice: number;
  directPrice: number;
  agentCommission: number;
  managerCommission: number;
  installationCost: number;
  productType: ProductFixtureType;
  pendingUpload?: "create" | "add-also" | "overwrite";
}

interface PendingUpload {
  rows: ParsedProductExcelRow[];
  errors: ProductExcelParseError[];
  duplicates: DuplicateUploadItem[];
  newRows: ParsedProductExcelRow[];
}

type DataSource = "api" | "upload";

const PROPOSED_TABLE_COLUMNS = [
  "SKU",
  "Name",
  "Utility Price",
  "Direct Price",
  "Agent Commission",
  "Manager Commission",
  "Installation Cost",
  "Actions",
] as const;

const EXISTING_TABLE_COLUMNS = ["Name", "Actions"] as const;

function getTableColumns(fixtureType: ProductFixtureType) {
  return isExistingFixtureType(fixtureType)
    ? EXISTING_TABLE_COLUMNS
    : PROPOSED_TABLE_COLUMNS;
}

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
    utilityPrice: Number(raw.utilityPrice ?? raw.salesPrice ?? 0),
    directPrice: Number(raw.directPrice ?? 0),
    agentCommission: Number(raw.agentCommission ?? raw.commission ?? 0),
    managerCommission: Number(raw.managerCommission ?? 0),
    installationCost: Number(raw.installationCost ?? 0),
    productType: PRODUCT_FIXTURE_TABS.includes(productType)
      ? productType
      : fallbackType,
  };
}

function mapUploadRow(
  row: ParsedProductExcelRow,
  index: number,
  productType: ProductFixtureType
): Product {
  if (isProposedExcelRow(row)) {
    return {
      id: `upload-${row.rowNumber}-${index}`,
      sku: row.sku,
      name: row.name,
      utilityPrice: row.utilityPrice,
      directPrice: row.directPrice,
      agentCommission: row.agentCommission,
      managerCommission: row.managerCommission,
      installationCost: row.installationCost,
      productType,
      pendingUpload: "create",
    };
  }

  return {
    id: `upload-${row.rowNumber}-${index}`,
    sku: "",
    name: row.name,
    utilityPrice: 0,
    directPrice: 0,
    agentCommission: 0,
    managerCommission: 0,
    installationCost: 0,
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
    utilityPrice: item.utilityPrice,
    directPrice: item.directPrice,
    agentCommission: item.agentCommission,
    managerCommission: item.managerCommission,
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
    utilityPrice: item.utilityPrice,
    directPrice: item.directPrice,
    agentCommission: item.agentCommission,
    managerCommission: item.managerCommission,
    installationCost: item.installationCost,
    productType,
    pendingUpload: "overwrite",
  };
}

type DuplicateResolution = "skip" | "add-also" | "overwrite";

function buildProductLookup(
  products: Product[],
  fixtureType: ProductFixtureType
): Map<string, Product> {
  if (isExistingFixtureType(fixtureType)) {
    return new Map(
      products.map((product) => [product.name.trim().toLowerCase(), product])
    );
  }

  return new Map(products.map((product) => [product.sku.trim().toLowerCase(), product]));
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canCreateProducts = hasPermission("Products", "create");
  const canEditProducts = hasPermission("Products", "edit");

  useEffect(() => {
    if (!canViewModule("Products")) {
      toast.error("You do not have permission to view products.");
      router.push("/dashboard");
    }
  }, [router]);
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

  const tableColumns = useMemo(() => getTableColumns(activeTab), [activeTab]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      if (isExistingFixtureType(activeTab)) {
        return product.name.toLowerCase().includes(query);
      }

      return (
        product.sku.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        formatMoney(product.utilityPrice).toLowerCase().includes(query) ||
        formatMoney(product.directPrice).toLowerCase().includes(query) ||
        formatMoney(product.agentCommission).toLowerCase().includes(query) ||
        formatMoney(product.managerCommission).toLowerCase().includes(query) ||
        formatMoney(product.installationCost).toLowerCase().includes(query)
      );
    });
  }, [activeTab, searchQuery, products]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const tableColSpan = tableColumns.length;

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
    downloadProductTemplate(`${slug}-template.xlsx`, activeTab);
    toast.success("Template downloaded.");
  }

  function handleExport() {
    if (products.length === 0) {
      toast.warn("No products to export.");
      return;
    }

    const payload = isExistingFixtureType(activeTab)
      ? products.map(({ name }) => ({ name }))
      : products.map(
          ({
            sku,
            name,
            utilityPrice,
            directPrice,
            agentCommission,
            managerCommission,
            installationCost,
          }) => ({
            sku,
            name,
            utilityPrice,
            directPrice,
            agentCommission,
            managerCommission,
            installationCost,
          })
        );

    const suffix = new Date().toISOString().slice(0, 10);
    exportProductsToExcel(
      payload,
      `${fixtureTypeSlug(activeTab)}-export-${suffix}.xlsx`,
      activeTab
    );
    toast.success("Products exported to Excel.");
  }

  function applyUploadedProducts(
    newRows: ParsedProductExcelRow[],
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
      message: isExistingFixtureType(activeTab)
        ? `Name "${item.uploadedName}" was not added (not-add).`
        : `SKU "${item.sku}" was not added (not-add).`,
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
      const duplicateKey = isExistingFixtureType(activeTab)
        ? duplicate.uploadedName.trim().toLowerCase()
        : duplicate.sku.trim().toLowerCase();
      const action = resolutions.get(duplicateKey) ?? "skip";
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

    const duplicateKey = isExistingFixtureType(activeTab)
      ? current.uploadedName.trim().toLowerCase()
      : current.sku.trim().toLowerCase();
    const nextResolutions = new Map(duplicateResolutions);
    nextResolutions.set(duplicateKey, action);
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
      const { rows, errors } = await parseProductExcelFile(file, activeTab);

      if (rows.length === 0) {
        setUploadErrors(errors);
        toast.error(
          errors[0]?.message ?? "Could not read any valid rows from the file."
        );
        return;
      }

      const serverLookup = buildProductLookup(serverProducts, activeTab);
      const duplicates: DuplicateUploadItem[] = [];
      const newRows: ParsedProductExcelRow[] = [];

      for (const row of rows) {
        const rowName = isProposedExcelRow(row) ? row.name : row.name;
        const rowKey = isExistingFixtureType(activeTab)
          ? rowName.trim().toLowerCase()
          : isProposedExcelRow(row)
            ? row.sku.trim().toLowerCase()
            : rowName.trim().toLowerCase();
        const existing = serverLookup.get(rowKey);

        if (existing) {
          duplicates.push({
            rowNumber: row.rowNumber,
            sku: isProposedExcelRow(row) ? row.sku : rowName,
            uploadedName: rowName,
            existingName: existing.name,
            utilityPrice: isProposedExcelRow(row) ? row.utilityPrice : 0,
            directPrice: isProposedExcelRow(row) ? row.directPrice : 0,
            agentCommission: isProposedExcelRow(row) ? row.agentCommission : 0,
            managerCommission: isProposedExcelRow(row) ? row.managerCommission : 0,
            installationCost: isProposedExcelRow(row) ? row.installationCost : 0,
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

      try {
        if (isExistingFixtureType(activeTab)) {
          const existingPayload = { name: product.name, productType: activeTab };
          if (product.pendingUpload === "overwrite") {
            await adminApi.updateProduct(product.id, existingPayload);
            updated += 1;
          } else {
            await adminApi.createProduct(existingPayload);
            created += 1;
          }
        } else {
          const proposedPayload = {
            sku: product.sku,
            name: product.name,
            utilityPrice: product.utilityPrice,
            directPrice: product.directPrice,
            agentCommission: product.agentCommission,
            managerCommission: product.managerCommission,
            installationCost: product.installationCost,
            productType: activeTab,
          };
          if (product.pendingUpload === "overwrite") {
            await adminApi.updateProduct(product.id, proposedPayload);
            updated += 1;
          } else {
            await adminApi.createProduct(proposedPayload);
            created += 1;
          }
        }
      } catch (err: unknown) {
        failed += 1;
        const message = err instanceof Error ? err.message : "Failed to save";
        failDetails.push(
          `${isExistingFixtureType(activeTab) ? product.name : product.sku}: ${message}`
        );
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

  async function handleAddProduct(data: ProposedProductFormData | ExistingProductFormData) {
    setIsSubmitting(true);
    try {
      if (isExistingFixtureType(activeTab)) {
        const existingData = data as ExistingProductFormData;
        const existing = buildProductLookup(serverProducts, activeTab).get(
          existingData.name.trim().toLowerCase()
        );

        if (existing) {
          toast.error(
            `Name "${existingData.name}" already exists. Edit the product or upload a sheet to overwrite.`
          );
          return;
        }

        await adminApi.createProduct({
          name: existingData.name,
          productType: activeTab,
        });
      } else {
        const proposedData = data as ProposedProductFormData;
        const existing = buildProductLookup(serverProducts, activeTab).get(
          proposedData.sku.trim().toLowerCase()
        );

        if (existing) {
          toast.error(
            `SKU "${proposedData.sku}" already exists. Edit the product or upload a sheet to overwrite.`
          );
          return;
        }

        await adminApi.createProduct({ ...proposedData, productType: activeTab });
      }
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

  async function handleEditProduct(data: ProposedProductFormData | ExistingProductFormData) {
    if (!editingProduct) return;

    setIsSubmitting(true);
    try {
      if (isExistingFixtureType(editingProduct.productType)) {
        await adminApi.updateProduct(editingProduct.id, {
          name: (data as ExistingProductFormData).name,
          productType: editingProduct.productType,
        });
      } else {
        await adminApi.updateProduct(editingProduct.id, {
          ...(data as ProposedProductFormData),
          productType: editingProduct.productType,
        });
      }
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
            disabled={isUploading || !canCreateProducts}
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
          {hasUnsavedUpload && unsavedCount > 0 && canCreateProducts && (
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
          {canCreateProducts && (
          <button type="button" className={styles.addBtn} onClick={openAddModal}>
            <Plus size={20} /> Add Product
          </button>
          )}
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
                {tableColumns.map((header) => (
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
                  const statusBadges = (
                    <>
                      {isPendingCreate && (
                        <span className={productStyles.unsavedBadge}>New</span>
                      )}
                      {isPendingAddAlso && (
                        <span className={productStyles.unsavedBadge}>Add Also</span>
                      )}
                      {isPendingOverwrite && (
                        <span className={productStyles.updateBadge}>Overwrite</span>
                      )}
                    </>
                  );

                  return (
                    <tr key={product.id}>
                      {isExistingFixtureType(activeTab) ? (
                        <td className={productStyles.nameCell}>
                          {product.name}
                          {statusBadges}
                        </td>
                      ) : (
                        <>
                          <td className={productStyles.skuCell}>
                            {product.sku}
                            {statusBadges}
                          </td>
                          <td className={productStyles.nameCell}>{product.name}</td>
                          <td className={productStyles.priceCell}>
                            {formatMoney(product.utilityPrice)}
                          </td>
                          <td className={productStyles.moneyCell}>
                            {formatMoney(product.directPrice)}
                          </td>
                          <td className={productStyles.moneyCell}>
                            {formatMoney(product.agentCommission)}
                          </td>
                          <td className={productStyles.moneyCell}>
                            {formatMoney(product.managerCommission)}
                          </td>
                          <td className={productStyles.moneyCell}>
                            {formatMoney(product.installationCost)}
                          </td>
                        </>
                      )}
                      <td>
                        {canEditProducts && (
                        <button
                          type="button"
                          className={styles.assignBtn}
                          onClick={() => openEditModal(product)}
                          disabled={Boolean(product.pendingUpload)}
                        >
                          Edit
                        </button>
                        )}
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
        fixtureType={activeTab}
        onClose={closeModal}
        onSubmit={handleAddProduct}
        isSubmitting={isSubmitting}
      />

      <ProductFormModal
        isOpen={modalMode === "edit"}
        mode="edit"
        fixtureType={editingProduct?.productType ?? activeTab}
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
        matchByName={isExistingFixtureType(activeTab)}
        onNotAdd={handleDuplicateNo}
        onAddAlso={handleDuplicateAddAlso}
        onOverwrite={handleDuplicateOverwrite}
        onCancel={handleDuplicateUploadCancel}
      />
    </div>
  );
}
