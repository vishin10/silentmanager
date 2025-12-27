import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { api } from "../lib/api";

type ShiftDetail = {
  id: string;
  startAt: string | null;
  endAt: string | null;
  totalSales: string;
  fuelSales: string;
  nonFuelSales: string;
  refunds: string;
  voidCount: number;
  taxTotal: string;
  discountTotal: string;
  deptSales: { id: string; departmentName: string; amount: string }[];
};

type OutletContext = { storeId: string | null };

const ShiftDetailPage = () => {
  const { storeId } = useOutletContext<OutletContext>();
  const { shiftId } = useParams();
  const [shift, setShift] = useState<ShiftDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId || !shiftId) return;
    api
      .shiftDetail(storeId, shiftId)
      .then((data) => setShift(data))
      .catch((err) => setError(err.message));
  }, [storeId, shiftId]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!shift) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="font-semibold mb-2">Shift Summary</h2>
        <p className="text-sm text-slate-500">
          {shift.startAt ? new Date(shift.startAt).toLocaleString() : ""} -
          {shift.endAt ? new Date(shift.endAt).toLocaleString() : ""}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
          <div>Total Sales: ${Number(shift.totalSales).toFixed(2)}</div>
          <div>Fuel Sales: ${Number(shift.fuelSales).toFixed(2)}</div>
          <div>Inside Sales: ${Number(shift.nonFuelSales).toFixed(2)}</div>
          <div>Refunds: ${Number(shift.refunds).toFixed(2)}</div>
          <div>Tax: ${Number(shift.taxTotal).toFixed(2)}</div>
          <div>Discounts: ${Number(shift.discountTotal).toFixed(2)}</div>
          <div>Voids: {shift.voidCount}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="font-semibold mb-2">Department Sales</h3>
        <div className="space-y-2">
          {shift.deptSales.map((dept) => (
            <div key={dept.id} className="flex justify-between text-sm">
              <span>{dept.departmentName}</span>
              <span>${Number(dept.amount).toFixed(2)}</span>
            </div>
          ))}
          {shift.deptSales.length === 0 && <p className="text-sm text-slate-500">No department data.</p>}
        </div>
      </div>
    </div>
  );
};

export default ShiftDetailPage;
