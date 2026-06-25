/** Maps GET /customer/:id response to workflow survey view (no backend changes). */

export interface SiteDetailRow {
  _id: string;
  area: string;
  heightFt: string;
  heightIn: string;
  existingFixtureType: string;
  existingBulbs: string;
  existingQuantity: string;
  proposedFixture: string;
  proposedQuantity: string;
  pricePerUnit: string;
  totalPrice: string;
  note: string;
  images: string[];
  _sourceAreaIndex?: number;
}

export interface SurveyDetailsFields {
  surveyName: string;
  salesPerson: string;
  surveyDate: string | null;
}

interface SurveyProduct {
  name?: string;
  utilityPrice?: number;
  salesPrice?: number;
  price?: number;
}

interface SurveyFixture {
  heightFt?: string;
  heightIn?: string;
  existingBulbs?: string;
  existingFixtureType?: string;
  existingQty?: string;
  proposedQty?: string;
  price?: string;
  note?: string;
  images?: string[];
  product?: SurveyProduct;
  product_id?: string;
}

interface SurveyArea {
  areaName?: string;
  heightFt?: string;
  heightIn?: string;
  existingBulbs?: string;
  existingFixtureType?: string;
  existingQty?: string;
  proposedQty?: string;
  price?: string;
  note?: string;
  images?: string[];
  product?: SurveyProduct;
  product_id?: string;
  fixtures?: SurveyFixture[];
}

export interface NoteEntry {
  id: string;
  text: string;
  timestamp: string | null;
  source: "survey" | "customer";
  title?: string;
  authorName?: string;
}

interface SurveyNoteRecord {
  _id?: string;
  note?: string;
  title?: string;
  createdAt?: unknown;
  writtenByName?: string;
}

export interface SurveyRecord {
  _id?: string;
  id?: string;
  surveyName?: string;
  surveyDate?: unknown;
  confirmDate?: unknown;
  quotationApprovedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  areaName?: string;
  status?: string;
  note?: unknown;
  notes?: unknown;
  areas?: SurveyArea[];
}

interface CustomerDateContext {
  confirmDate?: unknown;
}

function surveyUploadsBase(): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  return `${base}/uploads/surveys/`;
}

function toImageUrls(images: string[] | undefined): string[] {
  const uploadBase = surveyUploadsBase();
  return (images || []).map((img) =>
    img.startsWith("http") ? img : `${uploadBase}${img.replace(/^\//, "")}`
  );
}

function parseApiDate(value: unknown): string | null {
  if (value == null || value === "") return null;

  if (typeof value === "object" && value !== null && "$date" in value) {
    const raw = (value as { $date: string | number }).$date;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function resolveSurveyId(survey: SurveyRecord): string {
  const raw = survey._id ?? survey.id;
  if (!raw) return "";
  if (typeof raw === "object" && raw !== null && "$oid" in raw) {
    return String((raw as { $oid: string }).$oid);
  }
  return String(raw);
}

export function resolveSurveyDate(
  survey: SurveyRecord,
  customer?: CustomerDateContext
): string | null {
  const candidates = [
    survey.surveyDate,
    survey.confirmDate,
    survey.quotationApprovedAt,
    survey.createdAt,
    survey.updatedAt,
    customer?.confirmDate,
  ];

  for (const candidate of candidates) {
    const parsed = parseApiDate(candidate);
    if (parsed) return parsed;
  }

  return null;
}

function formatHeightValue(value: string | undefined): string {
  const text = (value || "").trim();
  return text || "N/A";
}

function flattenAreaFixtures(area: SurveyArea): SurveyFixture[] {
  if (Array.isArray(area.fixtures) && area.fixtures.length > 0) {
    return area.fixtures;
  }

  if (
    area.product_id ||
    area.existingFixtureType ||
    area.heightFt ||
    area.heightIn ||
    area.existingBulbs ||
    area.proposedQty ||
    area.existingQty
  ) {
    return [area];
  }

  return [];
}

function resolveAreaName(
  survey: SurveyRecord,
  area: SurveyArea,
  areaIndex: number,
  fixtureIndex: number
): string {
  const name = (area.areaName || survey.areaName || "").trim();
  if (name) {
    const fixtures = flattenAreaFixtures(area);
    if (fixtures.length > 1) {
      return `${name} (${fixtureIndex + 1})`;
    }
    return name;
  }
  return `Area ${areaIndex + 1}`;
}

export function resolveSurveyName(survey: SurveyRecord, surveyIndex: number): string {
  const surveyLevelName = (survey.surveyName || survey.areaName || "").trim();
  if (surveyLevelName) return surveyLevelName;

  const firstAreaName = (survey.areas?.[0]?.areaName || "").trim();
  if (firstAreaName) return firstAreaName;

  const firstFixtureType = survey.areas?.[0]?.fixtures?.[0]?.existingFixtureType?.trim();
  if (firstFixtureType) return firstFixtureType;

  return `Room${surveyIndex + 1}`;
}

function buildAreasSummary(rows: SiteDetailRow[]): string {
  const names = rows
    .map((row) => row.area.trim())
    .filter((name) => name && !/^area\s+\d+$/i.test(name));
  return [...new Set(names)].join(", ");
}

function formatMoney(value: number): string {
  if (!value || Number.isNaN(value)) return "—";
  return value.toFixed(2);
}

function mapFixtureToRow(
  survey: SurveyRecord,
  area: SurveyArea,
  fixture: SurveyFixture,
  areaIndex: number,
  fixtureIndex: number,
  rowIndex: number
): SiteDetailRow {
  const qty = parseFloat(fixture.proposedQty || "0") || 0;
  const unitPrice =
    parseFloat(fixture.price || "0") ||
    Number(fixture.product?.utilityPrice) ||
    Number(fixture.product?.salesPrice) ||
    Number(fixture.product?.price) ||
    0;
  const total = qty * unitPrice;
  const surveyId = resolveSurveyId(survey);

  const images = [
    ...toImageUrls(area.images),
    ...toImageUrls(fixture.images),
  ];

  return {
    _id: `${surveyId}-${rowIndex}`,
    _sourceAreaIndex: areaIndex,
    area: resolveAreaName(survey, area, areaIndex, fixtureIndex),
    heightFt: formatHeightValue(fixture.heightFt),
    heightIn: formatHeightValue(fixture.heightIn),
    existingFixtureType: fixture.existingFixtureType || "N/A",
    existingBulbs: fixture.existingBulbs || "N/A",
    existingQuantity: fixture.existingQty ?? "0",
    proposedFixture: fixture.product?.name || fixture.existingFixtureType || "N/A",
    proposedQuantity: fixture.proposedQty ?? "0",
    pricePerUnit: formatMoney(unitPrice),
    totalPrice: formatMoney(total),
    note: fixture.note || area.note || "",
    images: [...new Set(images)],
  };
}

export function mapSurveyDetails(
  customer: {
    user_id?: { fullName?: string; name?: string };
    leadId?: { leadName?: string; name?: string } | string;
    name?: string;
    confirmDate?: unknown;
  },
  surveys: SurveyRecord[]
): SurveyDetailsFields {
  const lead =
    customer.leadId && typeof customer.leadId === "object" ? customer.leadId : null;
  const customerName =
    customer.name?.trim() ||
    lead?.leadName ||
    lead?.name ||
    "N/A";

  const latest = [...surveys].sort((a, b) => {
    const timeA = new Date(resolveSurveyDate(a, customer) || 0).getTime();
    const timeB = new Date(resolveSurveyDate(b, customer) || 0).getTime();
    return timeB - timeA;
  })[0];

  return {
    surveyName: customerName,
    salesPerson:
      customer.user_id?.fullName || customer.user_id?.name || "N/A",
    surveyDate: latest ? resolveSurveyDate(latest, customer) : null,
  };
}

function mapSurveyAreas(survey: SurveyRecord): SiteDetailRow[] {
  const areas = survey.areas || [];
  const surveyId = resolveSurveyId(survey);

  if (!areas.length) {
    return [
      {
        _id: `${surveyId}-0`,
        area: survey.areaName || survey.surveyName || "General",
        heightFt: "N/A",
        heightIn: "N/A",
        existingFixtureType: "N/A",
        existingBulbs: "N/A",
        existingQuantity: "—",
        proposedFixture: "—",
        proposedQuantity: "—",
        pricePerUnit: "—",
        totalPrice: "—",
        note: resolveSurveyLevelNote(survey),
        images: [],
      },
    ];
  }

  const rows: SiteDetailRow[] = [];
  let rowIndex = 0;

  areas.forEach((area, areaIndex) => {
    const fixtures = flattenAreaFixtures(area);

    if (!fixtures.length) {
      rows.push({
        _id: `${surveyId}-${rowIndex}`,
        _sourceAreaIndex: areaIndex,
        area: resolveAreaName(survey, area, areaIndex, 0),
        heightFt: "N/A",
        heightIn: "N/A",
        existingFixtureType: "N/A",
        existingBulbs: "N/A",
        existingQuantity: "—",
        proposedFixture: "—",
        proposedQuantity: "—",
        pricePerUnit: "—",
        totalPrice: "—",
        note: area.note || "",
        images: toImageUrls(area.images),
      });
      rowIndex += 1;
      return;
    }

    fixtures.forEach((fixture, fixtureIndex) => {
      rows.push(
        mapFixtureToRow(survey, area, fixture, areaIndex, fixtureIndex, rowIndex)
      );
      rowIndex += 1;
    });
  });

  return rows;
}

export function normalizeSurveyStatus(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ");
}

export function isSurveyVerified(survey: SurveyRecord): boolean {
  if (survey.confirmDate) {
    const date = new Date(survey.confirmDate as string | number | Date);
    if (!Number.isNaN(date.getTime())) {
      return true;
    }
  }

  const status = normalizeSurveyStatus(survey.status);
  return status === "completed" || status === "verified";
}

export function resolveSurveyWorkflowDisplayStatus(survey: SurveyRecord): string {
  if (isSurveyVerified(survey)) {
    return "Verified";
  }

  const status = normalizeSurveyStatus(survey.status);
  if (status === "submitted") return "Submitted";
  if (status === "in progress") return "In Progress";
  if (status === "reopen" || status === "reopened") return "Reopened";
  if (status === "pending edit approval") return "Pending Approval";
  if (!status || status === "draft" || status === "pending") return "Pending";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export interface SiteDetailSurveyGroup {
  surveyId: string;
  surveyIndex: number;
  surveyName: string;
  surveyDate: string | null;
  status: string;
  isVerified: boolean;
  areasSummary: string;
  areas: SiteDetailRow[];
}

export function mapSiteDetailGroups(
  surveys: SurveyRecord[],
  customer?: CustomerDateContext
): SiteDetailSurveyGroup[] {
  return surveys.map((survey, surveyIndex) => {
    const areas = mapSurveyAreas(survey);
    return {
      surveyId: resolveSurveyId(survey),
      surveyIndex,
      surveyName: resolveSurveyName(survey, surveyIndex),
      surveyDate: resolveSurveyDate(survey, customer),
      status: survey.status || "Draft",
      isVerified: isSurveyVerified(survey),
      areasSummary: buildAreasSummary(areas),
      areas,
    };
  });
}

export function mapSiteDetails(surveys: SurveyRecord[]): SiteDetailRow[] {
  return surveys.flatMap((survey) => mapSurveyAreas(survey));
}

function surveyNoteTimestamp(
  survey: SurveyRecord,
  customer?: CustomerDateContext
): string | null {
  return resolveSurveyDate(survey, customer);
}

function resolveDefaultAuthor(customer: {
  user_id?: { fullName?: string; name?: string };
}): string {
  return (
    customer.user_id?.fullName?.trim() ||
    customer.user_id?.name?.trim() ||
    ""
  );
}

function normalizeNoteText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

function resolveSurveyLevelNote(survey: SurveyRecord): string {
  const single = normalizeNoteText(survey.note);
  if (single) return single;

  const notesValue = survey.notes;
  if (Array.isArray(notesValue)) {
    for (const item of notesValue) {
      if (!item || typeof item !== "object") continue;
      const text = normalizeNoteText((item as SurveyNoteRecord).note);
      if (text) return text;
    }
    return "";
  }

  return normalizeNoteText(notesValue);
}

function addSurveyNotes(
  survey: SurveyRecord,
  customer: CustomerDateContext,
  defaultAuthor: string,
  add: (entry: NoteEntry) => void
) {
  const surveyId = resolveSurveyId(survey);
  const fallbackTs = surveyNoteTimestamp(survey, customer);
  const notesValue = survey.notes;

  if (Array.isArray(notesValue)) {
    notesValue.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const record = item as SurveyNoteRecord;
      const noteText = normalizeNoteText(record.note);
      if (!noteText) return;

      add({
        id: record._id || `${surveyId}-notes-${index}`,
        text: noteText,
        timestamp: parseApiDate(record.createdAt) || fallbackTs,
        source: "survey",
        title: normalizeNoteText(record.title) || "Survey Notes",
        authorName: normalizeNoteText(record.writtenByName) || defaultAuthor || undefined,
      });
    });
    return;
  }

  const notesText = normalizeNoteText(notesValue);
  if (!notesText) return;

  add({
    id: `${surveyId}-notes`,
    text: notesText,
    timestamp: fallbackTs,
    source: "survey",
    title: "Survey Notes",
    authorName: defaultAuthor || undefined,
  });
}

function addSurveySingleNote(
  survey: SurveyRecord,
  customer: CustomerDateContext,
  defaultAuthor: string,
  add: (entry: NoteEntry) => void
) {
  const surveyId = resolveSurveyId(survey);
  const singleNote = normalizeNoteText(survey.note);
  if (!singleNote) return;

  const notesValue = survey.notes;
  if (Array.isArray(notesValue)) {
    const duplicate = notesValue.some(
      (item) =>
        item &&
        typeof item === "object" &&
        normalizeNoteText((item as SurveyNoteRecord).note) === singleNote
    );
    if (duplicate) return;
  } else {
    const notesText = normalizeNoteText(notesValue);
    if (singleNote === notesText) return;
  }

  add({
    id: `${surveyId}-note`,
    text: singleNote,
    timestamp: surveyNoteTimestamp(survey, customer),
    source: "survey",
    title: "Survey Note",
    authorName: defaultAuthor || undefined,
  });
}

/** Survey-level + customer notes with timestamps for display. */
export function mapNotes(
  surveys: SurveyRecord[],
  customer: {
    notes?: {
      _id?: string;
      note?: string;
      title?: string;
      createdAt?: string;
      writtenByName?: string;
    }[];
    user_id?: { fullName?: string; name?: string };
    confirmDate?: unknown;
  }
): NoteEntry[] {
  const entries: NoteEntry[] = [];
  const seen = new Set<string>();
  const defaultAuthor = resolveDefaultAuthor(customer);

  const add = (entry: NoteEntry) => {
    const key = `${entry.source}:${entry.text}:${entry.timestamp || ""}`;
    if (!entry.text.trim() || seen.has(key)) return;
    seen.add(key);
    entries.push(entry);
  };

  for (const survey of surveys) {
    addSurveyNotes(survey, customer, defaultAuthor, add);
    addSurveySingleNote(survey, customer, defaultAuthor, add);
  }

  for (const entry of customer.notes || []) {
    if (!entry.note?.trim()) continue;
    const author =
      entry.writtenByName?.trim() || defaultAuthor || undefined;
    add({
      id: entry._id || `customer-${entry.createdAt || entries.length}`,
      text: entry.note.trim(),
      timestamp: entry.createdAt || null,
      source: "customer",
      title: entry.title?.trim() || "Customer Note",
      authorName: author,
    });
  }

  return entries.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });
}

const SITE_ROW_KEY = /^([a-f0-9]{24})-(\d+)$/i;

export function parseSiteRowKey(rowId: string): { surveyId: string; index: number } | null {
  const match = String(rowId || "").trim().match(SITE_ROW_KEY);
  if (!match) return null;
  return { surveyId: match[1], index: Number.parseInt(match[2], 10) };
}

export function getSourceAreaIndex(row: SiteDetailRow): number {
  if (Number.isFinite(row._sourceAreaIndex)) {
    return Number(row._sourceAreaIndex);
  }
  return parseSiteRowKey(row._id)?.index ?? 0;
}

export function reindexSurveySiteRows(
  rows: SiteDetailRow[],
  surveyId: string,
  fromIndex: number,
  toIndex: number
): SiteDetailRow[] {
  const surveyRowIndexes: number[] = [];
  const surveyRows: SiteDetailRow[] = [];

  rows.forEach((row, idx) => {
    if (parseSiteRowKey(row._id)?.surveyId === surveyId) {
      surveyRowIndexes.push(idx);
      surveyRows.push(row);
    }
  });

  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= surveyRows.length ||
    toIndex >= surveyRows.length ||
    fromIndex === toIndex
  ) {
    return rows;
  }

  const next = [...surveyRows];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);

  const reindexed = next.map((row, newIndex) => ({
    ...row,
    _sourceAreaIndex: getSourceAreaIndex(row),
    _id: `${surveyId}-${newIndex}`,
  }));

  const result = [...rows];
  surveyRowIndexes.forEach((originalIdx, i) => {
    result[originalIdx] = reindexed[i];
  });

  return result;
}
