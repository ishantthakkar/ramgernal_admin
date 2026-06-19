import {
  mapNotes,
  type NoteEntry,
  type SurveyRecord,
} from "@/lib/workflow-survey-view";
import {
  formatInspectionStatusLabel,
} from "@/lib/workflow-installation";

export interface InspectionFixtureVerification {
  verifiedQty: string;
  issueFound: string;
  comments: string;
  images: string[];
}

export interface InspectionFixtureRow {
  id: string;
  existingFixtureType: string;
  heightDisplay: string;
  heightFt: string;
  heightIn: string;
  existingBulbs: string;
  existingQuantity: string;
  proposedFixture: string;
  proposedQuantity: string;
  note: string;
  images: string[];
  verification: InspectionFixtureVerification;
}

export interface InspectionAreaGroup {
  id: string;
  areaName: string;
  note: string;
  fixtures: InspectionFixtureRow[];
}

function displayValue(value: unknown, fallback = "----"): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatHeightDisplay(heightFt: unknown, heightIn: unknown): string {
  const ft = String(heightFt ?? "").trim();
  const inches = String(heightIn ?? "").trim();
  if (!ft && !inches) return "—";
  if (ft && inches) return `${ft}'${inches}"`;
  if (ft) return `${ft}'`;
  return `${inches}"`;
}

function normalizeIssueFound(value: unknown): string {
  const text = String(value ?? "").trim().toLowerCase();
  if (text === "yes") return "Yes";
  if (text === "no") return "No";
  return displayValue(value, "No");
}

function toImageList(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => String(img || "").trim())
    .filter(Boolean);
}

function mapFixtureRow(
  fixture: Record<string, unknown>,
  area: Record<string, unknown>,
  fixtureIndex: number,
  areaIndex: number
): InspectionFixtureRow {
  const product =
    fixture.product && typeof fixture.product === "object"
      ? (fixture.product as Record<string, unknown>)
      : null;

  const verification =
    fixture.verification && typeof fixture.verification === "object"
      ? (fixture.verification as Record<string, unknown>)
      : {};

  const fixtureImages = toImageList(fixture.images);
  const areaImages = toImageList(area.images);
  const images = [...new Set([...areaImages, ...fixtureImages])];

  const verifiedQty =
    verification.verified_qty ??
    verification.verifyQty ??
    verification.verifiedQty ??
    0;

  return {
    id: String(fixture._id || `area-${areaIndex}-fixture-${fixtureIndex}`),
    existingFixtureType: displayValue(fixture.existingFixtureType),
    heightFt: displayValue(fixture.heightFt),
    heightIn: displayValue(fixture.heightIn),
    heightDisplay: formatHeightDisplay(fixture.heightFt, fixture.heightIn),
    existingBulbs: displayValue(fixture.existingBulbs),
    existingQuantity: displayValue(fixture.existingQty),
    proposedFixture: displayValue(product?.name || fixture.existingFixtureType),
    proposedQuantity: displayValue(fixture.proposedQty),
    note: displayValue(fixture.note || area.note),
    images,
    verification: {
      verifiedQty: String(verifiedQty ?? "----"),
      issueFound: normalizeIssueFound(verification.issueFound),
      comments: displayValue(verification.comments),
      images: toImageList(verification.images),
    },
  };
}

function flattenAreaFixtures(area: Record<string, unknown>): Record<string, unknown>[] {
  const fixtures = Array.isArray(area.fixtures) ? area.fixtures : [];
  if (fixtures.length) return fixtures;

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

export function mapInspectionAreas(
  survey: Record<string, unknown> | null | undefined
): InspectionAreaGroup[] {
  const areas = Array.isArray(survey?.areas) ? survey.areas : [];
  if (!areas.length) return [];

  return areas.map((area, areaIndex) => {
    const areaObj = area as Record<string, unknown>;
    const fixtures = flattenAreaFixtures(areaObj).map((fixture, fixtureIndex) =>
      mapFixtureRow(fixture as Record<string, unknown>, areaObj, fixtureIndex, areaIndex)
    );

    return {
      id: String(areaObj._id || `area-${areaIndex}`),
      areaName: displayValue(areaObj.areaName, `Room ${areaIndex + 1}`),
      note: displayValue(areaObj.note),
      fixtures,
    };
  });
}

export function resolveServiceAddress(customer: Record<string, unknown>): string {
  const addresses = Array.isArray(customer.addresses) ? customer.addresses : [];
  if (addresses.length) {
    const sorted = [...addresses].sort((a, b) => {
      const timeA = new Date((a as Record<string, unknown>)?.createdAt as string || 0).getTime();
      const timeB = new Date((b as Record<string, unknown>)?.createdAt as string || 0).getTime();
      return timeB - timeA;
    });

    const primary = sorted[0] as Record<string, unknown>;
    const street = String(primary?.street || "").trim();
    const city = String(primary?.city || "").trim();
    const state = String(primary?.state || "").trim();
    const zip = String(primary?.zip || "").trim();

    const cityStateZip = [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    const parts = [street, cityStateZip].filter(Boolean);
    if (parts.length) return parts.join(", ");
  }

  const street = String(customer.street || "").trim();
  const city = String(customer.city || "").trim();
  const state = String(customer.state || "").trim();
  const zip = String(customer.zip || "").trim();
  const cityStateZip = [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const parts = [street, cityStateZip].filter(Boolean);
  return parts.length ? parts.join(", ") : "----";
}

export function resolveCustomerMobile(customer: Record<string, unknown>): string {
  const direct = String(customer.mobileNumber || customer.phone || "").trim();
  if (direct) return direct;

  const contacts = Array.isArray(customer.contactInfo) ? customer.contactInfo : [];
  for (const contact of contacts) {
    if (!contact || typeof contact !== "object") continue;
    const record = contact as Record<string, unknown>;
    const mobile = String(
      record.mobileNumber || record.phone || record.mobile || ""
    ).trim();
    if (mobile) return mobile;
  }

  return "----";
}

export function resolveCustomerDisplayName(customer: Record<string, unknown>): string {
  return String(customer.name || "").trim() || "----";
}

export function resolveInspectionProjectTitle(
  survey: Record<string, unknown> | null | undefined,
  customer: Record<string, unknown>
): string {
  return (
    String(survey?.surveyName || "").trim() ||
    String(customer.name || "").trim() ||
    String(customer.company || customer.dba || "").trim() ||
    "Project Details"
  );
}

export function resolveInspectionStatusRaw(
  survey: Record<string, unknown> | null | undefined,
  customer: Record<string, unknown>
): string {
  return String(
    survey?.inspectionStatus || customer.inspectionStatus || "to-do"
  ).trim();
}

export function formatInspectionStatusBadge(statusRaw: string): string {
  return formatInspectionStatusLabel(statusRaw).toUpperCase();
}

export function getInspectionStatusColor(statusRaw: string): string {
  const status = String(statusRaw || "").trim().toLowerCase();
  if (status === "verified") return "#10b981";
  if (status === "confirm") return "#d97706";
  if (status === "in_progress") return "#ea580c";
  if (status === "reopen") return "#2563eb";
  return "#64748b";
}

export function resolveUpdatedAt(
  survey: Record<string, unknown> | null | undefined,
  customer: Record<string, unknown>
): string | null {
  const candidates = [survey?.updatedAt, survey?.createdAt, customer.updatedAt, customer.createdAt];
  for (const value of candidates) {
    if (!value) continue;
    const date = new Date(value as string | number | Date);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

export function formatRelativeUpdated(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Updated just now";
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Updated ${diffDays}d ago`;

  return `Updated ${date.toLocaleDateString()}`;
}

function parseNoteTimestamp(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function mapInspectionNotes(
  survey: Record<string, unknown> | null | undefined,
  customer: Record<string, unknown>
): NoteEntry[] {
  const surveyRecord = survey ? (survey as SurveyRecord) : null;
  const base = mapNotes(surveyRecord ? [surveyRecord] : [], customer);
  const entries: NoteEntry[] = [...base];
  const seen = new Set(base.map((entry) => `${entry.id}:${entry.text}`));

  const areas = Array.isArray(survey?.areas) ? survey.areas : [];
  areas.forEach((area, areaIndex) => {
    const areaObj = area as Record<string, unknown>;
    const areaName = String(areaObj.areaName || `Area ${areaIndex + 1}`).trim();
    const verificationNotes = Array.isArray(areaObj.verification_notes)
      ? areaObj.verification_notes
      : [];

    verificationNotes.forEach((note, noteIndex) => {
      if (!note || typeof note !== "object") return;
      const record = note as Record<string, unknown>;
      const text = String(record.note || "").trim();
      if (!text) return;

      const id = String(record._id || `verification-note-${areaIndex}-${noteIndex}`);
      const key = `${id}:${text}`;
      if (seen.has(key)) return;
      seen.add(key);

      entries.push({
        id,
        text,
        timestamp: parseNoteTimestamp(record.createdAt),
        source: "survey",
        title: String(record.title || "").trim() || `Verification Note · ${areaName}`,
        authorName: String(record.writtenByName || "").trim() || undefined,
      });
    });
  });

  return entries.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });
}
