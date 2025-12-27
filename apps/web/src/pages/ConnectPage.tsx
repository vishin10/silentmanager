import { useState } from "react";
import { api, setApiUrl, setStoreToken } from "../lib/api";

const ConnectPage = () => {
  const [apiUrl, setApiUrlInput] = useState(
    localStorage.getItem("sm_apiUrl") || "http://localhost:5000"
  );
  const [token, setToken] = useState(localStorage.getItem("sm_storeToken") || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setApiUrl(apiUrl.trim());
    setStoreToken(token.trim());
    try {
      const me = await api.storeAccessMe();
      localStorage.setItem("sm_storeId", me.storeId);
      localStorage.setItem("sm_storeName", me.storeName);
      localStorage.setItem("sm_timezone", me.timezone);
      window.location.href = "/alerts";
    } catch (err) {
      setError((err as Error).message || "Unable to connect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={handleConnect} className="bg-white p-6 rounded-lg shadow w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-2">Connect to store</h1>
        <p className="text-sm text-slate-500 mb-6">
          Enter the API base URL and Store Access Token.
        </p>
        <label className="text-sm">API Base URL</label>
        <input
          className="w-full border rounded-md px-3 py-2 mb-3"
          value={apiUrl}
          onChange={(event) => setApiUrlInput(event.target.value)}
          required
        />
        <label className="text-sm">Store Access Token</label>
        <input
          className="w-full border rounded-md px-3 py-2 mb-4"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          className="w-full bg-blue-600 text-white rounded-md py-2 font-medium disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Connecting..." : "Connect"}
        </button>
      </form>
    </div>
  );
};

export default ConnectPage;
