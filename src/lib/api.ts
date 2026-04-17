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
  createUser: (userData: any) => apiRequest("/admin/user-create", {
    method: "POST",
    body: JSON.stringify(userData),
  }),
  getUserList: (role?: string) => {
    const query = role ? `?userRole=${role}` : "";
    return apiRequest(`/admin/user-list${query}`, {
      method: "GET",
    });
  },
  getUserById: (id: string) => apiRequest(`/admin/user/${id}`, {
    method: "GET",
  }),
  updateUser: (userData: any) => apiRequest(`/admin/user-create`, {
    method: "POST",
    body: JSON.stringify(userData),
  }),
  createLead: (leadData: any) => apiRequest("/admin/leads", {
    method: "POST",
    body: JSON.stringify(leadData),
  }),
  getLeads: () => apiRequest("/admin/leads", {
    method: "GET",
  }),
  getLeadById: (id: string) => apiRequest(`/admin/leads/${id}`, {
    method: "GET",
  }),
  updateLead: (id: string, leadData: any) => apiRequest(`/admin/leads/${id}`, {
    method: "PUT",
    body: JSON.stringify(leadData),
  }),
};
