const getApiUrl = () =>
  localStorage.getItem("sm_apiUrl") || import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getStoreToken = () => localStorage.getItem("sm_storeToken");
export const setStoreToken = (token: string) => localStorage.setItem("sm_storeToken", token);
export const setApiUrl = (url: string) => localStorage.setItem("sm_apiUrl", url);
export const clearStoreAccess = () => {
  localStorage.removeItem("sm_storeToken");
  localStorage.removeItem("sm_storeId");
  localStorage.removeItem("sm_storeName");
  localStorage.removeItem("sm_timezone");
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getStoreToken();
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  if (res.status === 401) {
    clearStoreAccess();
    window.location.href = "/connect";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  return res.json();
};

export const api = {
  storeAccessMe: () =>
    request<{ storeId: string; storeName: string; timezone: string }>(\"/api/store-access/me\"),
  alerts: (storeId: string, unresolvedOnly: boolean) =>
    request<any[]>(`/api/stores/${storeId}/alerts?unresolvedOnly=${unresolvedOnly}`),
  resolveAlert: (storeId: string, alertId: string) =>
    request<any>(`/api/stores/${storeId}/alerts/${alertId}/resolve`, { method: "POST" }),
  shifts: (storeId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    return request<any[]>(`/api/stores/${storeId}/shifts?${params.toString()}`);
  },
  shiftDetail: (storeId: string, shiftId: string) =>
    request<any>(`/api/stores/${storeId}/shifts/${shiftId}`),
  chat: (storeId: string, question: string) =>
    request<{ answer: string; intent: string }>(`/api/stores/${storeId}/chat`, {
      method: "POST",
      body: JSON.stringify({ question })
    }),
  chatHistory: (storeId: string) => request<any[]>(`/api/stores/${storeId}/chat/history`)
};
