export function normalizeAssignRole(userRole?: string): string {
  return (userRole || "").trim().toLowerCase().replace(/_/g, " ");
}

function resolvePopulatedUser(user: unknown): Record<string, unknown> | null {
  if (user && typeof user === "object") return user as Record<string, unknown>;
  return null;
}

export function resolveSurveyContractorName(survey: Record<string, unknown> | null): string {
  if (!survey) return "";
  const contractorUser = resolvePopulatedUser(survey.assignToContractor);
  if (contractorUser?.fullName) return String(contractorUser.fullName).trim();
  const assignedTo = resolvePopulatedUser(survey.assignedTo);
  if (assignedTo && normalizeAssignRole(assignedTo.userRole as string) === "contractor") {
    return String(assignedTo.fullName || "").trim();
  }
  return "";
}

export function resolveSurveyProjectManagerName(survey: Record<string, unknown> | null): string {
  if (!survey) return "";
  const assignedTo = resolvePopulatedUser(survey.assignedTo);
  if (assignedTo && normalizeAssignRole(assignedTo.userRole as string) === "project manager") {
    return String(assignedTo.fullName || "").trim();
  }
  return "";
}

export function resolveSurveySalesPersonName(
  survey: Record<string, unknown> | null,
  customer?: Record<string, unknown> | null
): string {
  const surveyUser = resolvePopulatedUser(survey?.user_id);
  const surveyName = String(surveyUser?.fullName || surveyUser?.name || "").trim();
  if (surveyName) return surveyName;
  const customerUser = resolvePopulatedUser(customer?.user_id);
  return String(customerUser?.fullName || customerUser?.name || "").trim();
}

export function resolveUploadsBaseUrl(): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (!base) return "";
  return base.replace(/\/api\/?$/i, "");
}

export function resolveMaterialImageUrl(value: string): string {
  const filename = String(value || "").replace(/^\//, "");
  if (!filename) return "";
  if (filename.startsWith("http")) return filename;
  const base = resolveUploadsBaseUrl();
  if (!base) return filename;
  return `${base}/uploads/materials/${filename}`;
}

export function normalizeDeliveryStatus(value: string): string {
  return String(value || "").trim().toLowerCase();
}

export function getDeliveryStatusStyle(value: string): { color: string; bg: string } {
  const status = normalizeDeliveryStatus(value);
  if (status === "delivered") return { color: "#16a34a", bg: "#dcfce7" };
  if (status === "scheduled") return { color: "#2563eb", bg: "#dbeafe" };
  if (status === "approved") return { color: "#0ea5e9", bg: "#e0f2fe" };
  if (status === "cancelled") return { color: "#ef4444", bg: "#fee2e2" };
  return { color: "#64748b", bg: "#f1f5f9" };
}

export function formatDeliveryStatusLabel(value: string): string {
  const status = normalizeDeliveryStatus(value);
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

export function resolveInstallationSurvey(surveyRecords: Record<string, unknown>[]) {
  const sorted = [...surveyRecords].sort((a, b) => {
    const timeA = new Date(
      String(a.quotationApprovedAt || a.createdAt || "")
    ).getTime();
    const timeB = new Date(
      String(b.quotationApprovedAt || b.createdAt || "")
    ).getTime();
    return timeB - timeA;
  });

  return (
    sorted.find(
      (survey) => String(survey?.quotationStatus || "").toLowerCase() === "approved"
    ) ||
    sorted[0] ||
    null
  );
}

export function buildMaterialSummaryFromSurvey(survey: Record<string, unknown> | null) {
  const deliveries = Array.isArray(survey?.materialDelivery) ? survey.materialDelivery : [];
  const issuedBySku = new Map<string, number>();
  const usedBySku = new Map<string, number>();

  for (const delivery of deliveries) {
    const deliveryRecord = delivery as { items?: { sku?: string; issued_qty?: number; issuedQty?: number }[] };
    for (const item of deliveryRecord?.items || []) {
      const sku = String(item?.sku ?? "").trim();
      if (!sku) continue;
      const issuedQty = Number(item?.issued_qty ?? item?.issuedQty ?? 0) || 0;
      issuedBySku.set(sku, (issuedBySku.get(sku) || 0) + issuedQty);
    }
  }

  const areas = Array.isArray(survey?.areas) ? survey.areas : [];
  for (const area of areas) {
    const areaRecord = area as {
      fixtures?: {
        product?: { sku?: string; name?: string };
        existingFixtureType?: string;
        report?: { installed_qty?: number };
      }[];
    };
    for (const fixture of areaRecord?.fixtures || []) {
      const sku = String(
        fixture?.product?.sku ??
          fixture?.product?.name ??
          fixture?.existingFixtureType ??
          ""
      ).trim();
      if (!sku) continue;
      const installedQty = Number(fixture?.report?.installed_qty ?? 0) || 0;
      usedBySku.set(sku, (usedBySku.get(sku) || 0) + installedQty);
    }
  }

  const allSkus = new Set([...issuedBySku.keys(), ...usedBySku.keys()]);
  return Array.from(allSkus).map((sku) => {
    const issued = issuedBySku.get(sku) || 0;
    const used = usedBySku.get(sku) || 0;
    const remaining = Math.max(issued - used, 0);
    return { sku, issued, used, remaining };
  });
}

export function isMaterialsVerified(survey: Record<string, unknown> | null): boolean {
  const deliveries = Array.isArray(survey?.materialDelivery) ? survey.materialDelivery : [];
  if (!deliveries.length) return false;
  return deliveries.some(
    (delivery) =>
      normalizeDeliveryStatus(String((delivery as { deliveryStatus?: string }).deliveryStatus || "")) ===
      "delivered"
  );
}

export function extractSkuOptions(survey: Record<string, unknown> | null): string[] {
  const skus = new Set<string>();
  const areas = Array.isArray(survey?.areas) ? survey.areas : [];

  for (const area of areas) {
    const areaRecord = area as {
      fixtures?: {
        product?: { sku?: string; name?: string };
        proposedFixture?: string;
        existingFixtureType?: string;
      }[];
    };
    for (const fixture of areaRecord?.fixtures || []) {
      const candidates = [
        fixture?.product?.sku,
        fixture?.product?.name,
        fixture?.proposedFixture,
        fixture?.existingFixtureType,
      ];
      for (const candidate of candidates) {
        const value = String(candidate || "").trim();
        if (value) skus.add(value);
      }
    }
  }

  return Array.from(skus);
}
