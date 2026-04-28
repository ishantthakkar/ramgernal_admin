const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // If token is invalid or expired, clear it and redirect to login
    if (response.status === 401) {
      localStorage.removeItem("auth_token");
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export const authApi = {
  login: (credentials: any) => apiRequest("/admin/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }),
};

export const adminApi = {
  createUser: (userData: any) => apiRequest("/user/user-create", {
    method: "POST",
    body: JSON.stringify(userData),
  }),
  getUserList: (role?: string) => {
    const query = role ? `?userRole=${role}` : "";
    return apiRequest(`/user/user-list${query}`, {
      method: "GET",
    });
  },
  getUserById: (id: string) => apiRequest(`/user/${id}`, {
    method: "GET",
  }),
  updateUser: (userData: any) => apiRequest(`/user/user-create`, {
    method: "POST",
    body: JSON.stringify(userData),
  }),
  createLead: (leadData: any) => apiRequest("/leads", {
    method: "POST",
    body: JSON.stringify(leadData),
  }),
  getLeads: () => apiRequest("/leads", {
    method: "GET",
  }),
  getLeadById: (id: string) => apiRequest(`/leads/${id}`, {
    method: "GET",
  }),
  updateLead: (leadData: any) => apiRequest("/leads-create", {
    method: "POST",
    body: JSON.stringify(leadData),
  }),
  convertLead: (id: string) => apiRequest(`/leads/${id}/convert`, {
    method: "POST",
  }),
  updateLeadStatus: (id: string, status: string) => apiRequest(`/leads/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  }),
  getCustomers: () => apiRequest("/customer/customers-list", {
    method: "GET",
  }),
  assignProjectManager: (surveyId: string, staffId: string) => apiRequest(`/surveys/${surveyId}/assign`, {
    method: "POST",
    body: JSON.stringify({ assignedTo: staffId }),
  }),
  assignContractor: (surveyId: string, contractorId: string) => apiRequest(`/surveys/${surveyId}/assign-contractor`, {
    method: "POST",
    body: JSON.stringify({ contractorId }),
  }),
  getCustomerWorkflowDetails: (id: string) => apiRequest(`/customer/${id}`, {
    method: "GET",
  }),
  updateCustomerWorkflow: (id: string, data: any) => apiRequest(`/customer/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  getInstallations: () => apiRequest("/installation", {
    method: "GET",
  }),
  getDashboardStats: () => apiRequest("/admin/dashboard/stats", {
    method: "GET",
  }),
  verifyCustomerSurvey: (id: string) => apiRequest(`/customer/customers/${id}/verify`, {
    method: "POST",
    body: JSON.stringify({ status: "verified" }),
  }),
  updateCustomerMaterials: (id: string, data: any) => apiRequest(`/customer/customers/${id}/materials`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getInspections: () => apiRequest("/customer/customers/inspections", {
    method: "GET",
  }),
  getCommissionList: () => apiRequest("/customer/customers/commission-list", {
    method: "GET",
  }),
  updateCustomerCommissions: (id: string, commissions: any[]) => apiRequest(`/customer/customers/${id}/commissions`, {
    method: "POST",
    body: JSON.stringify({ commissions }),
  }),
};
