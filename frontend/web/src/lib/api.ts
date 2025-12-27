const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  return res.json();
};

export const api = {
  stores: () => request<any[]>("/api/stores"),
  createStore: (name: string, timezone: string) =>
    request<any>("/api/stores", { method: "POST", body: JSON.stringify({ name, timezone }) }),
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
  chatHistory: (storeId: string) => request<any[]>(`/api/stores/${storeId}/chat/history`),
  createDevice: (storeId: string, name: string) =>
    request<any>(`/api/stores/${storeId}/devices`, {
      method: "POST",
      body: JSON.stringify({ name })
    }),
  devices: (storeId: string) => request<any[]>(`/api/stores/${storeId}/devices`)
};
