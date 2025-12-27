import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { createApi } from "../lib/api";
import { useStoreAccess } from "../../App";

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

const ShiftDetailScreen = () => {
  const { state, disconnect } = useStoreAccess();
  const route = useRoute<RouteProp<{ params: { shiftId: string } }, "params">>();
  const { shiftId } = route.params;
  const [shift, setShift] = useState<ShiftDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!state) return;
      try {
        const api = createApi({ baseUrl: state.baseUrl, token: state.token });
        const data = await api.shiftDetail(state.storeId, shiftId);
        setShift(data);
      } catch (error) {
        if ((error as Error).message === "Unauthorized") {
          await disconnect();
        }
      }
    };
    load();
  }, [state, shiftId]);

  if (!shift) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Shift Summary</Text>
        <Text style={styles.meta}>
          {shift.startAt ? new Date(shift.startAt).toLocaleString() : ""} -
          {shift.endAt ? new Date(shift.endAt).toLocaleString() : ""}
        </Text>
        <View style={styles.grid}>
          <Text style={styles.cell}>Total: ${Number(shift.totalSales).toFixed(2)}</Text>
          <Text style={styles.cell}>Fuel: ${Number(shift.fuelSales).toFixed(2)}</Text>
          <Text style={styles.cell}>Inside: ${Number(shift.nonFuelSales).toFixed(2)}</Text>
          <Text style={styles.cell}>Refunds: ${Number(shift.refunds).toFixed(2)}</Text>
          <Text style={styles.cell}>Tax: ${Number(shift.taxTotal).toFixed(2)}</Text>
          <Text style={styles.cell}>Discounts: ${Number(shift.discountTotal).toFixed(2)}</Text>
          <Text style={styles.cell}>Voids: {shift.voidCount}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Department Sales</Text>
        {shift.deptSales.length === 0 && <Text style={styles.emptyText}>No department data.</Text>}
        {shift.deptSales.map((dept) => (
          <View key={dept.id} style={styles.row}>
            <Text style={styles.meta}>{dept.departmentName}</Text>
            <Text style={styles.meta}>${Number(dept.amount).toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  card: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  meta: { fontSize: 12, color: "#64748B" },
  grid: { marginTop: 12 },
  cell: { fontSize: 12, color: "#334155", marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  emptyText: { fontSize: 12, color: "#94A3B8" }
});

export default ShiftDetailScreen;
