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
}

export interface SurveyDetailsFields {
  surveyName: string;
  salesPerson: string;
  surveyDate: string | null;
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
  product?: { name?: string; salesPrice?: number; price?: number };
  product_id?: string;
}

export interface NoteEntry {
  id: string;
  text: string;
  timestamp: string | null;
  source: "survey" | "customer";
  title?: string;
  authorName?: string;
}

interface SurveyRecord {
  _id: string;
  surveyDate?: string;
  createdAt?: string;
  updatedAt?: string;
  areaName?: string;
  status?: string;
  note?: string;
  notes?: string;
  areas?: SurveyArea[];
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

function formatHeightValue(value: string | undefined): string {
  const text = (value || "").trim();
  return text || "N/A";
}

function resolveAreaName(survey: SurveyRecord, area: SurveyArea, index: number): string {
  const name = (area.areaName || survey.areaName || "").trim();
  return name || `Area ${index + 1}`;
}

export function resolveSurveyName(survey: SurveyRecord, surveyIndex: number): string {
  const surveyLevelName = (survey.areaName || "").trim();
  if (surveyLevelName) return surveyLevelName;

  const firstAreaName = (survey.areas?.[0]?.areaName || "").trim();
  if (firstAreaName) return firstAreaName;

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

export function mapSurveyDetails(
  customer: {
    user_id?: { fullName?: string; name?: string };
    leadId?: { leadName?: string; name?: string } | string;
    name?: string;
  },
  surveys: SurveyRecord[]
): SurveyDetailsFields {
  const latest = surveys[0];
  const lead =
    customer.leadId && typeof customer.leadId === "object" ? customer.leadId : null;
  const customerName =
    customer.name?.trim() ||
    lead?.leadName ||
    lead?.name ||
    "N/A";

  return {
    surveyName: customerName,
    salesPerson:
      customer.user_id?.fullName || customer.user_id?.name || "N/A",
    surveyDate: latest?.surveyDate || latest?.createdAt || null,
  };
}

function mapSurveyAreas(survey: SurveyRecord): SiteDetailRow[] {
  const areas = survey.areas || [];

  if (!areas.length) {
    return [
      {
        _id: `${survey._id}-0`,
        area: survey.areaName || "General",
        heightFt: "N/A",
        heightIn: "N/A",
        existingFixtureType: "N/A",
        existingBulbs: "N/A",
        existingQuantity: "—",
        proposedFixture: "—",
        proposedQuantity: "—",
        pricePerUnit: "—",
        totalPrice: "—",
        note: survey.note || survey.notes || "",
        images: [],
      },
    ];
  }

  return areas.map((area, index) => {
    const qty = parseFloat(area.proposedQty || "0") || 0;
    const unitPrice =
      parseFloat(area.price || "0") ||
      Number(area.product?.salesPrice) ||
      Number(area.product?.price) ||
      0;
    const total = qty * unitPrice;

    return {
      _id: `${survey._id}-${index}`,
      area: resolveAreaName(survey, area, index),
      heightFt: formatHeightValue(area.heightFt),
      heightIn: formatHeightValue(area.heightIn),
      existingFixtureType: area.existingFixtureType || "N/A",
      existingBulbs: area.existingBulbs || "N/A",
      existingQuantity: area.existingQty ?? "0",
      proposedFixture: area.product?.name || area.existingFixtureType || "N/A",
      proposedQuantity: area.proposedQty ?? "0",
      pricePerUnit: formatMoney(unitPrice),
      totalPrice: formatMoney(total),
      note: area.note || "",
      images: toImageUrls(area.images),
    };
  });
}

export interface SiteDetailSurveyGroup {
  surveyId: string;
  surveyIndex: number;
  surveyName: string;
  surveyDate: string | null;
  status: string;
  areasSummary: string;
  areas: SiteDetailRow[];
}

export function mapSiteDetailGroups(surveys: SurveyRecord[]): SiteDetailSurveyGroup[] {
  return surveys.map((survey, surveyIndex) => {
    const areas = mapSurveyAreas(survey);
    return {
      surveyId: survey._id,
      surveyIndex,
      surveyName: resolveSurveyName(survey, surveyIndex),
      surveyDate: survey.surveyDate || survey.createdAt || null,
      status: survey.status || "Draft",
      areasSummary: buildAreasSummary(areas),
      areas,
    };
  });
}

export function mapSiteDetails(surveys: SurveyRecord[]): SiteDetailRow[] {
  return surveys.flatMap((survey) => mapSurveyAreas(survey));
}

function surveyNoteTimestamp(survey: SurveyRecord): string | null {
  return survey.updatedAt || survey.surveyDate || survey.createdAt || null;
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
    const ts = surveyNoteTimestamp(survey);
    if (survey.notes?.trim()) {
      add({
        id: `${survey._id}-notes`,
        text: survey.notes.trim(),
        timestamp: ts,
        source: "survey",
        title: "Survey Notes",
        authorName: defaultAuthor || undefined,
      });
    }
    if (survey.note?.trim() && survey.note.trim() !== survey.notes?.trim()) {
      add({
        id: `${survey._id}-note`,
        text: survey.note.trim(),
        timestamp: ts,
        source: "survey",
        title: "Survey Note",
        authorName: defaultAuthor || undefined,
      });
    }
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
