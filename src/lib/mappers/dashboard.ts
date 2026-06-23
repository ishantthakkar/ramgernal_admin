export interface DashboardActivityRow {
  logName: string;
  byPersonName: string;
  recordName: string;
  recordType: string;
  recordId: string;
  createdAt: string;
}

export interface DashboardStats {
  totalActiveLeads: number;
  totalCustomers: number;
  submittedSurveys: number;
  completedInstallations: number;
  completedInspections: number;
  activeServices: number;
  activityLog: DashboardActivityRow[];
}

export function mapDashboardStats(raw: Record<string, unknown> | null): DashboardStats {
  const activityLog = Array.isArray(raw?.activityLog)
    ? raw.activityLog.map((entry) => {
        const row = entry as Record<string, unknown>;
        return {
          logName: String(row.logName || ""),
          byPersonName: String(row.byPersonName || "—"),
          recordName: String(row.recordName || "—"),
          recordType: String(row.recordType || ""),
          recordId: String(row.recordId || ""),
          createdAt: String(row.createdAt || ""),
        };
      })
    : [];

  return {
    totalActiveLeads: Number(raw?.totalActiveLeads ?? 0),
    totalCustomers: Number(raw?.totalCustomers ?? 0),
    submittedSurveys: Number(raw?.submittedSurveys ?? 0),
    completedInstallations: Number(raw?.completedInstallations ?? 0),
    completedInspections: Number(raw?.completedInspections ?? 0),
    activeServices: Number(raw?.activeServices ?? 0),
    activityLog,
  };
}
