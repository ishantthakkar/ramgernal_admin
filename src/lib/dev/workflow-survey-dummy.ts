import type { SurveyRecord } from "@/lib/workflow-survey-view";

/** Sample survey payload for local reopen-flow testing (matches POST /surveys/reopen body). */
export const DUMMY_REOPEN_REQUEST = {
  survey_id: "6a2bf2dc4f0d24c81d6f250e",
  title: "Missing fixtures",
  note: "Please re-verify area 2 fixtures",
} as const;

/** Verified survey with two areas — use when mocking workflow detail responses. */
export const DUMMY_VERIFIED_SURVEY: SurveyRecord = {
  _id: DUMMY_REOPEN_REQUEST.survey_id,
  surveyName: "Main Floor Survey",
  status: "completed",
  confirmDate: "2026-06-15T10:00:00.000Z",
  surveyDate: "2026-06-10T09:30:00.000Z",
  areas: [
    {
      areaName: "Lobby",
      heightFt: "12",
      heightIn: "0",
      existingFixtureType: "Recessed Can",
      existingBulbs: "LED PAR38",
      existingQty: "8",
      proposedQty: "8",
      price: "45.00",
      note: "Uniform spacing along north wall.",
      fixtures: [],
    },
    {
      areaName: "Conference Room",
      heightFt: "10",
      heightIn: "6",
      existingFixtureType: "Panel Light",
      existingBulbs: "T8 LED",
      existingQty: "6",
      proposedQty: "6",
      price: "62.50",
      note: "Area 2 — verify fixture count before install.",
      fixtures: [],
    },
  ],
  reopenNote: [],
};

/** Fresh submitted survey — not verified yet; good for verify / reopen testing. */
export const DUMMY_FRESH_SURVEY: SurveyRecord = {
  _id: "dummy-fresh-survey-id",
  surveyName: "Warehouse Lighting Survey",
  status: "submitted",
  surveyDate: "2026-06-28T14:00:00.000Z",
  createdAt: "2026-06-28T14:00:00.000Z",
  areas: [
    {
      areaName: "Loading Dock",
      heightFt: "18",
      heightIn: "0",
      existingFixtureType: "High Bay",
      existingBulbs: "Metal Halide",
      existingQty: "12",
      proposedQty: "12",
      price: "120.00",
      note: "Replace all high bays with LED equivalents.",
      fixtures: [],
    },
    {
      areaName: "Storage Aisle",
      heightFt: "14",
      heightIn: "0",
      existingFixtureType: "Strip Light",
      existingBulbs: "T8 Fluorescent",
      existingQty: "24",
      proposedQty: "20",
      price: "38.00",
      note: "Reduce fixture count after layout review.",
      fixtures: [],
    },
    {
      areaName: "Office Mezzanine",
      heightFt: "9",
      heightIn: "0",
      existingFixtureType: "Drop Ceiling Panel",
      existingBulbs: "LED Panel",
      existingQty: "10",
      proposedQty: "10",
      price: "55.00",
      note: "Standard 2x4 panel swap.",
      fixtures: [],
    },
  ],
  reopenNote: [],
};

/** Customer workflow wrapper for UI dev / story fixtures. */
export const DUMMY_CUSTOMER_WORKFLOW_RESPONSE = {
  customer: {
    _id: "dummy-customer-id",
    name: "Sunwell Solar Demo",
    dba: "Sunwell Solar",
    status: "submitted",
    verifyStatus: "pending",
    user_id: { fullName: "Alex Sales" },
    leadId: { lead_id: "LD-1001", leadName: "Sunwell Solar Demo", dba: "Sunwell Solar" },
  },
  surveys: [DUMMY_VERIFIED_SURVEY, DUMMY_FRESH_SURVEY],
};
