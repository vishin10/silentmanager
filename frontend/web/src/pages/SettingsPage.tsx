import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../lib/api";

type OutletContext = { storeId: string | null; store?: { id: string; name: string; timezone: string } };

const SettingsPage = () => {
  const { storeId, store } = useOutletContext<OutletContext>();
  const [deviceKey, setDeviceKey] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("Back Office PC");
  const [newStoreName, setNewStoreName] = useState("Main Store");
  const [timezone, setTimezone] = useState("America/New_York");
  const [message, setMessage] = useState<string | null>(null);

  const createDevice = async () => {
    if (!storeId) return;
    const result = await api.createDevice(storeId, deviceName);
    setDeviceKey(result.apiKey);
    setMessage("Device key created. Save it somewhere safe.");
  };

  const createStore = async () => {
    const result = await api.createStore(newStoreName, timezone);
    localStorage.setItem("sm_storeId", result.id);
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      {!storeId && (
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
          <h2 className="font-semibold">Create your first store</h2>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={newStoreName}
            onChange={(event) => setNewStoreName(event.target.value)}
            placeholder="Store name"
          />
          <input
            className="w-full border rounded-md px-3 py-2"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            placeholder="Timezone"
          />
          <button className="bg-blue-600 text-white rounded-md py-2" onClick={createStore}>
            Create store
          </button>
        </div>
      )}

      {store && (
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
          <h2 className="font-semibold">Store Details</h2>
          <p className="text-sm text-slate-600">Name: {store.name}</p>
          <p className="text-sm text-slate-600">Timezone: {store.timezone}</p>
        </div>
      )}

      {storeId && (
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
          <h2 className="font-semibold">Create Device Key</h2>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={deviceName}
            onChange={(event) => setDeviceName(event.target.value)}
          />
          <button className="bg-blue-600 text-white rounded-md py-2" onClick={createDevice}>
            Create Device Key
          </button>
          {deviceKey && (
            <div className="bg-slate-100 p-3 rounded-md text-sm">
              <p className="font-semibold">Device API Key</p>
              <p className="break-all mt-1">{deviceKey}</p>
            </div>
          )}
          {message && <p className="text-sm text-emerald-600">{message}</p>}
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
        <h2 className="font-semibold">Ingest Configuration</h2>
        <p className="text-sm text-slate-600">Backend URL: http://localhost:5000</p>
        <p className="text-sm text-slate-600">Ingest Path: /api/ingest/xml</p>
        <p className="text-sm text-slate-600">Watch Path example: Z:\\XMLGateway\\BOOutBox</p>
      </div>
    </div>
  );
};

export default SettingsPage;
