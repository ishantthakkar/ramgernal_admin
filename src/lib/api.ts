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
    // if (response.status === 401) {
    //   localStorage.removeItem("auth_token");
    //   if (typeof window !== "undefined") {
    //     window.location.href = "/";
    //   }
    // }
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export async function apiBlobRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Something went wrong";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      message = response.statusText || message;
    }

    if (response.status === 401) {
      localStorage.removeItem("auth_token");
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    throw new Error(message);
  }

  return response.blob();
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
  uploadUserProfileImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiRequest(`/user/${id}/profile/image`, {
      method: "POST",
      body: formData,
    });
  },
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
  assignSalesManagerToCustomer: (customerId: string, salesManagerId: string) =>
    apiRequest("/customer/customers/assign-sales-manager", {
      method: "POST",
      body: JSON.stringify({ customerId, salesManagerId }),
    }),
  getWorkflowSurveys: () => apiRequest("/workflow-surveys", {
    method: "GET",
  }),
  assignSurvey: (surveyId: string, assignedTo: string) =>
    apiRequest("/surveys/assign", {
      method: "POST",
      body: JSON.stringify({ survey_id: surveyId, assignedTo }),
    }),
  assignProjectManager: (surveyId: string, staffId: string) =>
    apiRequest("/surveys/assign", {
      method: "POST",
      body: JSON.stringify({ survey_id: surveyId, assignedTo: staffId }),
    }),
  assignContractor: (surveyId: string, contractorId: string) =>
    apiRequest("/surveys/assign-contractor", {
      method: "POST",
      body: JSON.stringify({ survey_id: surveyId, contractor: contractorId }),
    }),
  getCustomerWorkflowDetails: (id: string) => apiRequest(`/customer/${id}`, {
    method: "GET",
  }),
  getInstallationWorkflowDetails: (surveyId: string) =>
    apiRequest(`/surveys/${surveyId}/installation-workflow`, {
      method: "GET",
    }),
  exportSurveyProjectPdf: (
    surveyId: string,
    downloadOrOptions:
      | boolean
      | { download?: boolean; workflow?: "survey" | "installation" } = false
  ) => {
    const options =
      typeof downloadOrOptions === "boolean"
        ? { download: downloadOrOptions }
        : downloadOrOptions ?? {};
    const params = new URLSearchParams();
    if (options.download) params.set("download", "1");
    if (options.workflow) params.set("workflow", options.workflow);
    const query = params.toString();
    return apiBlobRequest(`/surveys/${surveyId}/project-pdf${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },
  getExtraExpenses: (surveyId: string) =>
    apiRequest(`/surveys/${surveyId}/extra-expenses`, {
      method: "GET",
    }),
  approveExtraExpenses: (
    surveyId: string,
    extraExpenses: Array<{
      description: string;
      price: number;
      approvedAmount: number;
    }>,
    expenseId?: string
  ) =>
    apiRequest("/surveys/extra-expenses/approve", {
      method: "POST",
      body: JSON.stringify({ surveyId, extraExpenses, expenseId }),
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
  reopenSurvey: (
    surveyId: string,
    payload: { title?: string; note: string }
  ) =>
    apiRequest("/surveys/reopen", {
      method: "POST",
      body: JSON.stringify({
        survey_id: surveyId,
        title: payload.title || "",
        note: payload.note,
      }),
    }),
  adminApproval: (id: string, status: "Approved" | "Rejected") => apiRequest(`/customer/${id}/admin-approval`, {
    method: "POST",
    body: JSON.stringify({ status }),
  }),
  updateCustomerMaterials: (id: string, data: any) => apiRequest(`/customer/customers/${id}/materials`, {
    method: "POST",
    body: data instanceof FormData ? data : JSON.stringify(data),
  }),
  addSurveyMaterialDelivery: (payload: Record<string, unknown>) =>
    apiRequest("/customer/surveys/add-material-delivery", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  addSurveyMaterialDeliveryReturn: (payload: Record<string, unknown>) =>
    apiRequest("/customer/surveys/add-material-delivery-return", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  markDeliveryAsCompleted: (deliveryId: string, images?: File[]) => {
    const formData = new FormData();
    formData.append("delivery_id", deliveryId);
    images?.forEach((file) => formData.append("images", file));
    return apiRequest("/customer/surveys/delivery-mark-as-completed", {
      method: "POST",
      body: formData,
    });
  },
  getInspections: () => apiRequest("/customer/customers/inspections", {
    method: "GET",
  }),
  confirmInspection: (surveyId: string) =>
    apiRequest("/customer/surveys/inspection-status", {
      method: "POST",
      body: JSON.stringify({ survey_id: surveyId, status: "submitted" }),
    }),
  verifyInspection: (surveyId: string) =>
    apiRequest("/customer/surveys/inspection-status", {
      method: "POST",
      body: JSON.stringify({ survey_id: surveyId, status: "verified" }),
    }),
  reopenInstallation: (
    surveyId: string,
    payload: { title?: string; note: string }
  ) =>
    apiRequest("/surveys/installation/reopen", {
      method: "POST",
      body: JSON.stringify({
        survey_id: surveyId,
        title: payload.title || "",
        note: payload.note,
      }),
    }),
  saveSurveyAreaVerification: (payload: Record<string, unknown> | FormData) =>
    apiRequest("/surveys/area-verification", {
      method: "POST",
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    }),
  getQuotationsAdmin: () =>
    apiRequest("/customer/survey-quotations-list", {
      method: "GET",
    }),
  previewQuotation: (surveyId: string) =>
    apiRequest("/customer/quotation/preview", {
      method: "POST",
      body: JSON.stringify({ surveyId }),
    }),
  createQuotation: (surveyId: string) =>
    apiRequest("/customer/quotation", {
      method: "POST",
      body: JSON.stringify({ surveyId }),
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
  updateQuotationFixtureSkus: (
    surveyId: string,
    fixtures: Array<{ fixtureId: string; sku: string }>
  ) =>
    apiRequest("/customer/quotation/fixture-skus", {
      method: "POST",
      body: JSON.stringify({ surveyId, fixtures }),
    }),
  getInvoicesList: (params?: { invoiceStatus?: string; hasInvoices?: string }) => {
    const query = new URLSearchParams();
    if (params?.invoiceStatus) query.set("invoiceStatus", params.invoiceStatus);
    if (params?.hasInvoices) query.set("hasInvoices", params.hasInvoices);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/customer/invoices-list${suffix}`, {
      method: "GET",
    });
  },
  createInvoice: (surveyId: string) =>
    apiRequest("/customer/invoice", {
      method: "POST",
      body: JSON.stringify({ survey_id: surveyId }),
    }),
  getInvoiceDetails: (surveyId: string) =>
    apiRequest("/customer/invoice/details", {
      method: "POST",
      body: JSON.stringify({ survey_id: surveyId }),
    }),
  previewInvoice: (surveyId: string) =>
    apiRequest("/customer/invoice/preview", {
      method: "POST",
      body: JSON.stringify({ survey_id: surveyId }),
    }),
  markInvoiceFullyPaid: (surveyId: string) =>
    apiRequest("/customer/invoice/mark-paid", {
      method: "POST",
      body: JSON.stringify({ survey_id: surveyId }),
    }),
  addInvoicePayment: (
    surveyId: string,
    payload: {
      amount: number;
      paymentMethod: string;
      paymentDate?: string;
      note?: string;
    }
  ) =>
    apiRequest("/customer/invoice/payment", {
      method: "POST",
      body: JSON.stringify({ survey_id: surveyId, ...payload }),
    }),
  getCommissionList: () => apiRequest("/customer/customers/commission-list", {
    method: "GET",
  }),
  getPayableDetails: (id: string, params?: { surveyId?: string; for?: "contractor" | "sales-manager" }) => {
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
      note?: string;
      for?: "contractor" | "sales-manager";
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
  getProducts: (productType?: string, accessoryType?: string) => {
    const params = new URLSearchParams();
    if (productType) params.set("productType", productType);
    if (accessoryType) params.set("accessoryType", accessoryType);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiRequest(`/products${query}`, {
      method: "GET",
    });
  },
  getOtherFixtures: () =>
    apiRequest("/products/other-fixtures", {
      method: "GET",
    }),
  getProductById: (id: string) =>
    apiRequest(`/products/${id}`, {
      method: "GET",
    }),
  createProduct: (
    productData:
      | {
          sku: string;
          name: string;
          utilityPrice: number;
          directPrice: number;
          agentCommission: number;
          managerCommission: number;
          installationCost: number;
          productType: string;
        }
      | {
          name: string;
          productType: string;
        }
      | {
          name: string;
          accessoryType: string;
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
          utilityPrice: number;
          directPrice: number;
          agentCommission: number;
          managerCommission: number;
          installationCost: number;
          productType?: string;
        }
      | {
          name: string;
          productType?: string;
        }
      | {
          name: string;
          accessoryType: string;
          productType?: string;
        }
  ) =>
    apiRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    }),
  deleteProduct: (id: string) =>
    apiRequest(`/products/${id}`, {
      method: "DELETE",
    }),
  replaceProducts: (
    productType: string,
    products: Array<
      | {
          sku: string;
          name: string;
          description?: string;
          isComboItem?: boolean;
          comboAccessoryIds?: string[];
          utilityPrice: number;
          directPrice: number;
          agentCommission: number;
          managerCommission: number;
          installationCost: number;
        }
      | { name: string }
      | { name: string; accessoryType: string }
    >
  ) =>
    apiRequest("/products/replace", {
      method: "POST",
      body: JSON.stringify({ productType, products }),
    }),
};
