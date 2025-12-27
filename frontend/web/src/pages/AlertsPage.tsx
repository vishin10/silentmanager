import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../lib/api";

type Alert = {
  id: string;
  severity: "info" | "warn" | "critical";
  title: string;
  message: string;
  createdAt: string;
  resolvedAt?: string | null;
};

type OutletContext = { storeId: string | null };

const AlertsPage = () => {
  const { storeId } = useOutletContext<OutletContext>();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const [selected, setSelected] = useState<Alert | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    api
      .alerts(storeId, unresolvedOnly)
      .then((data) => setAlerts(data))
      .catch((err) => setError(err.message));
  }, [storeId, unresolvedOnly]);

  const handleResolve = async (alertId: string) => {
    if (!storeId) return;
    await api.resolveAlert(storeId, alertId);
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-1 rounded-full text-sm ${unresolvedOnly ? "bg-blue-600 text-white" : "bg-white border"}`}
          onClick={() => setUnresolvedOnly(true)}
        >
          Unresolved
        </button>
        <button
          className={`px-3 py-1 rounded-full text-sm ${!unresolvedOnly ? "bg-blue-600 text-white" : "bg-white border"}`}
          onClick={() => setUnresolvedOnly(false)}
        >
          All
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            className="w-full text-left bg-white p-4 rounded-lg shadow-sm"
            onClick={() => setSelected(alert)}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs uppercase px-2 py-1 rounded-full ${
                  alert.severity === "critical"
                    ? "bg-red-100 text-red-600"
                    : alert.severity === "warn"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {alert.severity}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(alert.createdAt).toLocaleString()}
              </span>
            </div>
            <h3 className="font-semibold mt-2">{alert.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
          </button>
        ))}
        {alerts.length === 0 && <p className="text-sm text-slate-500">No alerts yet.</p>}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center">
          <div className="bg-white rounded-t-xl p-4 w-full max-w-md">
            <h3 className="font-semibold text-lg">{selected.title}</h3>
            <p className="text-sm text-slate-600 mt-2">{selected.message}</p>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 border rounded-md py-2" onClick={() => setSelected(null)}>
                Close
              </button>
              {!selected.resolvedAt && (
                <button
                  className="flex-1 bg-blue-600 text-white rounded-md py-2"
                  onClick={() => handleResolve(selected.id)}
                >
                  Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
