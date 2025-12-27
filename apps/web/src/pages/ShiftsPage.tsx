import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../lib/api";

type Shift = {
  id: string;
  startAt: string | null;
  endAt: string | null;
  totalSales: string;
  fuelSales: string;
  nonFuelSales: string;
  voidCount: number;
};

type OutletContext = { storeId: string | null };

const ShiftsPage = () => {
  const { storeId } = useOutletContext<OutletContext>();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    api
      .shifts(storeId, from, to)
      .then((data) => setShifts(data))
      .catch((err) => setError(err.message));
  }, [storeId]);

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {shifts.map((shift) => (
        <Link
          key={shift.id}
          to={`/shifts/${shift.id}`}
          className="block bg-white p-4 rounded-lg shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {shift.startAt ? new Date(shift.startAt).toLocaleDateString() : "Unknown date"}
              </p>
              <p className="font-semibold">
                {shift.startAt ? new Date(shift.startAt).toLocaleTimeString() : ""} -
                {shift.endAt ? new Date(shift.endAt).toLocaleTimeString() : ""}
              </p>
            </div>
            <p className="font-semibold">${Number(shift.totalSales).toFixed(2)}</p>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
            <span>Fuel ${Number(shift.fuelSales).toFixed(2)}</span>
            <span>Inside ${Number(shift.nonFuelSales).toFixed(2)}</span>
            <span>Voids {shift.voidCount}</span>
          </div>
        </Link>
      ))}
      {shifts.length === 0 && <p className="text-sm text-slate-500">No shifts yet.</p>}
    </div>
  );
};

export default ShiftsPage;
