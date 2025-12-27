import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { clearStoreAccess } from "../lib/api";

type OutletContext = { storeId: string | null; store?: { id: string; name: string; timezone: string } };

const SettingsPage = () => {
  const { storeId, store } = useOutletContext<OutletContext>();
  const [apiUrl] = useState(localStorage.getItem("sm_apiUrl") || "http://localhost:5000");

  return (
    <div className="space-y-4">
      {store && (
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
          <h2 className="font-semibold">Store Details</h2>
          <p className="text-sm text-slate-600">Name: {store.name}</p>
          <p className="text-sm text-slate-600">Timezone: {store.timezone}</p>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
        <h2 className="font-semibold">Ingest Configuration</h2>
        <p className="text-sm text-slate-600">Backend URL: {apiUrl}</p>
        <p className="text-sm text-slate-600">Ingest Path: /api/ingest/xml</p>
        <p className="text-sm text-slate-600">Watch Path example: Z:\\XMLGateway\\BOOutBox</p>
      </div>

      {storeId && (
        <button
          className="w-full border rounded-md py-2 text-sm text-slate-600"
          onClick={() => {
            clearStoreAccess();
            window.location.href = "/connect";
          }}
        >
          Disconnect
        </button>
      )}
    </div>
  );
};

export default SettingsPage;
