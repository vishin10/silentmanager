import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { clearStoreAccess } from "../lib/api";

const navItems = [
  { label: "Alerts", path: "/alerts" },
  { label: "Shifts", path: "/shifts" },
  { label: "Chat", path: "/chat" },
  { label: "Settings", path: "/settings" }
];

export type Store = { id: string; name: string; timezone: string };

const DashboardLayout = () => {
  const location = useLocation();
  const [storeId] = useState<string | null>(localStorage.getItem("sm_storeId"));
  const [storeName] = useState<string>(localStorage.getItem("sm_storeName") || "Store");
  const [timezone] = useState<string>(localStorage.getItem("sm_timezone") || "America/New_York");

  const activePath = navItems.find((item) => location.pathname.startsWith(item.path));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="px-4 py-3 bg-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Silent Manager</p>
          <h1 className="text-lg font-semibold">{activePath?.label || "Dashboard"}</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="text-right">
            <div className="font-medium text-slate-700">{storeName}</div>
            <div>{timezone}</div>
          </div>
          <button
            className="text-xs text-slate-500"
            onClick={() => {
              clearStoreAccess();
              window.location.href = "/connect";
            }}
          >
            Disconnect
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 pb-20">
        <Outlet context={{ storeId, store: { id: storeId || "", name: storeName, timezone } }} />
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
