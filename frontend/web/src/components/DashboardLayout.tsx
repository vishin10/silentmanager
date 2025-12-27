import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

const navItems = [
  { label: "Alerts", path: "/alerts" },
  { label: "Shifts", path: "/shifts" },
  { label: "Chat", path: "/chat" },
  { label: "Settings", path: "/settings" }
];

export type Store = { id: string; name: string; timezone: string };

const DashboardLayout = () => {
  const location = useLocation();
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<string | null>(localStorage.getItem("sm_storeId"));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .stores()
      .then((data) => {
        setStores(data);
        if (!storeId && data[0]) {
          setStoreId(data[0].id);
          localStorage.setItem("sm_storeId", data[0].id);
        }
      })
      .catch((err) => setError(err.message));
  }, [storeId]);

  const handleStoreChange = (value: string) => {
    setStoreId(value);
    localStorage.setItem("sm_storeId", value);
  };

  const activePath = navItems.find((item) => location.pathname.startsWith(item.path));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="px-4 py-3 bg-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Silent Manager</p>
          <h1 className="text-lg font-semibold">{activePath?.label || "Dashboard"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={storeId || ""}
            onChange={(event) => handleStoreChange(event.target.value)}
          >
            {stores.length === 0 && <option value="">No stores</option>}
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && <div className="p-4 text-sm text-red-600">{error}</div>}

      <main className="flex-1 p-4 pb-20">
        <Outlet context={{ storeId, store: stores.find((item) => item.id === storeId) }} />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-sm ${location.pathname.startsWith(item.path) ? "text-blue-600" : "text-slate-500"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default DashboardLayout;
