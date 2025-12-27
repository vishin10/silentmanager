export type StoreInfo = {
  storeId: string;
  storeName: string;
  timezone: string;
};

type RequestOptions = {
  baseUrl: string;
  token: string;
};

const request = async <T>(path: string, options: RequestInit, auth: RequestOptions): Promise<T> => {
  const response = await fetch(`${auth.baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json();
};

export const createApi = (auth: RequestOptions) => ({
  storeAccessMe: () => request<StoreInfo>("/api/store-access/me", { method: "GET" }, auth),
  alerts: (storeId: string, unresolvedOnly: boolean) =>
    request<any[]>(`/api/stores/${storeId}/alerts?unresolvedOnly=${unresolvedOnly}`, { method: "GET" }, auth),
  resolveAlert: (storeId: string, alertId: string) =>
    request(`/api/stores/${storeId}/alerts/${alertId}/resolve`, { method: "POST" }, auth),
  shifts: (storeId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    return request<any[]>(`/api/stores/${storeId}/shifts?${params.toString()}`, { method: "GET" }, auth);
  },
  shiftDetail: (storeId: string, shiftId: string) =>
    request<any>(`/api/stores/${storeId}/shifts/${shiftId}`, { method: "GET" }, auth),
  chat: (storeId: string, question: string) =>
    request<{ answer: string }>(
      `/api/stores/${storeId}/chat`,
      {
        method: "POST",
        body: JSON.stringify({ question })
      },
      auth
    ),
  chatHistory: (storeId: string) =>
    request<any[]>(`/api/stores/${storeId}/chat/history`, { method: "GET" }, auth)
});
