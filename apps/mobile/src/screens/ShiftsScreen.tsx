import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { createApi } from "../lib/api";
import { useStoreAccess } from "../../App";
import { useNavigation } from "@react-navigation/native";

type ShiftItem = {
  id: string;
  startAt: string | null;
  endAt: string | null;
  totalSales: string;
  fuelSales: string;
  nonFuelSales: string;
  voidCount: number;
};

const ShiftsScreen = () => {
  const { state, disconnect } = useStoreAccess();
  const navigation = useNavigation<any>();
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadShifts = async () => {
    if (!state) return;
    try {
      const api = createApi({ baseUrl: state.baseUrl, token: state.token });
      const to = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const data = await api.shifts(state.storeId, from, to);
      setShifts(data);
    } catch (error) {
      if ((error as Error).message === "Unauthorized") {
        await disconnect();
      }
    }
  };

  useEffect(() => {
    loadShifts();
  }, [state]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={shifts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("ShiftDetail", { shiftId: item.id })}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.dateText}>
                  {item.startAt ? new Date(item.startAt).toLocaleDateString() : "Unknown"}
                </Text>
                <Text style={styles.timeText}>
                  {item.startAt ? new Date(item.startAt).toLocaleTimeString() : ""} -
                  {item.endAt ? new Date(item.endAt).toLocaleTimeString() : ""}
                </Text>
              </View>
              <Text style={styles.total}>${Number(item.totalSales).toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.meta}>Fuel ${Number(item.fuelSales).toFixed(2)}</Text>
              <Text style={styles.meta}>Inside ${Number(item.nonFuelSales).toFixed(2)}</Text>
              <Text style={styles.meta}>Voids {item.voidCount}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No shifts yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  card: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  dateText: { fontSize: 12, color: "#64748B" },
  timeText: { fontSize: 14, fontWeight: "600" },
  total: { fontSize: 16, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  meta: { fontSize: 12, color: "#64748B" },
  emptyText: { textAlign: "center", color: "#94A3B8", marginTop: 40 }
});

export default ShiftsScreen;
