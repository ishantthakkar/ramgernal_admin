/** Maps GET /customer/:id response to workflow survey view (no backend changes). */

export interface SiteDetailRow {
  _id: string;
  area: string;
  heightInInches: string;
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
}

interface SurveyRecord {
  _id: string;
  surveyDate?: string;
  createdAt?: string;
  updatedAt?: string;
  areaName?: string;
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

function formatHeight(area: SurveyArea): string {
  const ft = (area.heightFt || "").trim();
  const inch = (area.heightIn || "").trim();
  const parts: string[] = [];
  if (ft) parts.push(`${ft}'`);
  if (inch) parts.push(`${inch}"`);
  return parts.length ? parts.join(" ") : "";
}

function resolveAreaName(survey: SurveyRecord, area: SurveyArea, index: number): string {
  const name = (area.areaName || survey.areaName || "").trim();
  return name || `Area ${index + 1}`;
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
  return {
    surveyName: lead?.leadName || lead?.name || customer.name || "N/A",
    salesPerson:
      customer.user_id?.fullName || customer.user_id?.name || "N/A",
    surveyDate: latest?.surveyDate || latest?.createdAt || null,
  };
}

export function mapSiteDetails(surveys: SurveyRecord[]): SiteDetailRow[] {
  const rows: SiteDetailRow[] = [];

  for (const survey of surveys) {
    const areas = survey.areas || [];

    if (!areas.length) {
      rows.push({
        _id: `${survey._id}-0`,
        area: survey.areaName || "General",
        heightInInches: "N/A",
        existingFixtureType: "N/A",
        existingBulbs: "N/A",
        existingQuantity: "—",
        proposedFixture: "—",
        proposedQuantity: "—",
        pricePerUnit: "—",
        totalPrice: "—",
        note: survey.note || survey.notes || "",
        images: [],
      });
      continue;
    }

    areas.forEach((area, index) => {
      const qty = parseFloat(area.proposedQty || "0") || 0;
      const unitPrice =
        parseFloat(area.price || "0") ||
        Number(area.product?.salesPrice) ||
        Number(area.product?.price) ||
        0;
      const total = qty * unitPrice;

      rows.push({
        _id: `${survey._id}-${index}`,
        area: resolveAreaName(survey, area, index),
        heightInInches: formatHeight(area) || "N/A",
        existingFixtureType: area.existingFixtureType || "N/A",
        existingBulbs: area.existingBulbs || "N/A",
        existingQuantity: area.existingQty ?? "0",
        proposedFixture:
          area.product?.name || area.existingFixtureType || "N/A",
        proposedQuantity: area.proposedQty ?? "0",
        pricePerUnit: formatMoney(unitPrice),
        totalPrice: formatMoney(total),
        note: area.note || "",
        images: toImageUrls(area.images),
      });
    });
  }

  return rows;
}

function surveyNoteTimestamp(survey: SurveyRecord): string | null {
  return survey.updatedAt || survey.surveyDate || survey.createdAt || null;
}

/** Survey-level + customer notes with timestamps for display. */
export function mapNotes(
  surveys: SurveyRecord[],
  customer: { notes?: { _id?: string; note?: string; title?: string; createdAt?: string }[] }
): NoteEntry[] {
  const entries: NoteEntry[] = [];
  const seen = new Set<string>();

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
      });
    }
    if (survey.note?.trim() && survey.note.trim() !== survey.notes?.trim()) {
      add({
        id: `${survey._id}-note`,
        text: survey.note.trim(),
        timestamp: ts,
        source: "survey",
        title: "Survey Note",
      });
    }
  }

  for (const entry of customer.notes || []) {
    if (!entry.note?.trim()) continue;
    add({
      id: entry._id || `customer-${entry.createdAt || entries.length}`,
      text: entry.note.trim(),
      timestamp: entry.createdAt || null,
      source: "customer",
      title: entry.title?.trim() || "Customer Note",
    });
  }

  return entries.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });
}
