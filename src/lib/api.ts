const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
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
  createUser: (userData: Record<string, unknown>) =>
    apiRequest("/user/user-create", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
  getUserList: (role?: string) => {
    const query = role ? `?userRole=${role}` : "";
    return apiRequest(`/user/user-list${query}`, {
      method: "GET",
    });
  },
  getUserById: (id: string) =>
    apiRequest(`/user/${id}`, {
      method: "GET",
    }),
  updateUser: (userData: Record<string, unknown>) =>
    apiRequest("/user/user-create", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
  getLeadSources: () =>
    apiRequest("/lead-sources", {
      method: "GET",
    }),
  getLeadSalesPersons: () =>
    apiRequest("/leads/sales-persons", {
      method: "GET",
    }),
  getUsaStates: (state?: string) => {
    const query = state ? `?state=${encodeURIComponent(state)}` : "";
    return apiRequest(`/usa-states${query}`, {
      method: "GET",
    });
  },
  createLead: (leadData: Record<string, unknown> | FormData) =>
    apiRequest("/leads-create", {
      method: "POST",
      body: leadData instanceof FormData ? leadData : JSON.stringify(leadData),
    }),
  getLeads: () => apiRequest("/leads", {
    method: "GET",
  }),
  getLeadById: (id: string) => apiRequest(`/leads/${id}`, {
    method: "GET",
  }),
  getLeadNotes: (id: string) =>
    apiRequest(`/leads/${id}/notes`, {
      method: "GET",
    }),
  addLeadNote: (id: string, payload: { title?: string; note: string }) =>
    apiRequest(`/leads/${id}/notes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getLeadActivities: (id: string) =>
    apiRequest(`/leads/${id}/activities`, {
      method: "GET",
    }),
  addLeadActivity: (
    id: string,
    payload: {
      activityType: string;
      date?: string;
      location?: string;
      time?: string;
      note?: string;
      notes?: string;
    }
  ) =>
    apiRequest(`/leads/${id}/activities`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateLead: (leadData: Record<string, unknown> | FormData) =>
    apiRequest("/leads-create", {
      method: "POST",
      body: leadData instanceof FormData ? leadData : JSON.stringify(leadData),
    }),
  convertLead: (id: string) => apiRequest(`/leads/${id}/convert`, {
    method: "POST",
  }),
  updateLeadStatus: (id: string, status: string) => apiRequest(`/leads/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  }),
  markLeadAsLost: (id: string, reason: string) =>
    apiRequest(`/leads/${id}/lost`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  assignLeadToSalesPerson: (id: string, salesPersonId: string) =>
    apiRequest(`/leads/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ salesPersonId }),
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
  getCustomerActivities: (id: string) =>
    apiRequest(`/customer/customers/${id}/activities`, {
      method: "GET",
    }),
  updateCustomerWorkflow: (id: string, data: Record<string, unknown> | FormData) =>
    apiRequest(`/customer/customers/${id}`, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  getInstallations: () => apiRequest("/installation", {
    method: "GET",
  }),
  getDashboardStats: () => apiRequest("/admin/dashboard/stats", {
    method: "GET",
  }),
  getWorkflowStats: () => apiRequest("/admin/dashboard/workflow-stats", {
    method: "GET",
  }),
  verifyCustomerSurvey: (id: string) => apiRequest(`/customer/customers/${id}/verify`, {
    method: "POST",
    body: JSON.stringify({ status: "verified" }),
  }),
  verifySurveyConfirm: (surveyId: string) =>
    apiRequest(`/surveys/${surveyId}/confirm-verify`, {
      method: "POST",
    }),
  adminApproval: (id: string, status: "Approved" | "Rejected") => apiRequest(`/customer/${id}/admin-approval`, {
    method: "POST",
    body: JSON.stringify({ status }),
  }),
  updateCustomerMaterials: (id: string, data: any) => apiRequest(`/customer/customers/${id}/materials`, {
    method: "POST",
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  getInspections: () => apiRequest("/customer/customers/inspections", {
    method: "GET",
  }),
  getQuotationsAdmin: () =>
    apiRequest("/customer/survey-quotations-list", {
      method: "GET",
    }),
  uploadQuotation: (surveyId: string, formData: FormData) => {
    formData.append("surveyId", surveyId);
    return apiRequest("/customer/quotation/upload", {
      method: "POST",
      body: formData,
    });
  },
  approveQuotation: (surveyId: string) =>
    apiRequest("/customer/quotation/approve", {
      method: "POST",
      body: JSON.stringify({ surveyId }),
    }),
  getCommissionList: () => apiRequest("/customer/customers/commission-list", {
    method: "GET",
  }),
  getPayableDetails: (id: string, params?: { surveyId?: string; for?: "contractor" }) => {
    const query = new URLSearchParams();
    if (params?.surveyId) query.set("surveyId", params.surveyId);
    if (params?.for) query.set("for", params.for);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/customer/customers/${id}/payable-details${suffix}`, {
      method: "GET",
    });
  },
  addCommissionPayment: (
    id: string,
    payload: {
      surveyId: string;
      amount: number;
      paymentMethod: string;
      paymentDate?: string;
      for?: "contractor";
    }
  ) =>
    apiRequest(`/customer/customers/${id}/commission-payments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCustomerCommissions: (id: string, commissions: any[]) => apiRequest(`/customer/customers/${id}/commissions`, {
    method: "POST",
    body: JSON.stringify({ commissions }),
  }),
  getRoles: () => apiRequest("/roles", {
    method: "GET",
  }),
  createRole: (roleData: any) => apiRequest("/roles", {
    method: "POST",
    body: JSON.stringify(roleData),
  }),
  getRoleById: (id: string) => apiRequest(`/roles/${id}`, {
    method: "GET",
  }),
  updateRole: (roleData: any) => apiRequest("/roles", {
    method: "POST",
    body: JSON.stringify(roleData),
  }),
  deleteRole: (id: string) => apiRequest(`/roles/${id}`, {
    method: "DELETE",
  }),
  getEligibleCustomers: () => apiRequest("/services/customers/eligible", {
    method: "GET",
  }),
  getServiceCustomerDetails: (customerId: string) => apiRequest(`/services/customers/${customerId}/details`, {
    method: "GET",
  }),
  createServiceTicket: (serviceData: any) => apiRequest("/services", {
    method: "POST",
    body: serviceData instanceof FormData ? serviceData : JSON.stringify(serviceData),
  }),
  getServices: () => apiRequest("/services", {
    method: "GET",
  }),
  getServiceById: (id: string) => apiRequest(`/services/${id}`, {
    method: "GET",
  }),
  updateServiceTicket: (id: string, data: any) => apiRequest(`/services/${id}`, {
    method: "PUT",
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  addServiceMaterial: (id: string, data: any) => apiRequest(`/services/${id}/material`, {
    method: "PUT",
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  getActivityLogs: () => apiRequest("/activities", {
    method: "GET",
  }),
  getProducts: (productType?: string) => {
    const query = productType
      ? `?productType=${encodeURIComponent(productType)}`
      : "";
    return apiRequest(`/products${query}`, {
      method: "GET",
    });
  },
  getProductById: (id: string) =>
    apiRequest(`/products/${id}`, {
      method: "GET",
    }),
  createProduct: (
    productData:
      | {
          sku: string;
          name: string;
          salesPrice: number;
          commission: number;
          installationCost: number;
          productType: string;
        }
      | {
          name: string;
          productType: string;
        }
  ) =>
    apiRequest("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    }),
  updateProduct: (
    id: string,
    productData:
      | {
          sku: string;
          name: string;
          salesPrice: number;
          commission: number;
          installationCost: number;
          productType?: string;
        }
      | {
          name: string;
          productType?: string;
        }
  ) =>
    apiRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    }),
};
