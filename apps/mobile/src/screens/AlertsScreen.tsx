import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { createApi } from "../lib/api";
import { useStoreAccess } from "../../App";
import { useNavigation } from "@react-navigation/native";

type AlertItem = {
  id: string;
  severity: "info" | "warn" | "critical";
  title: string;
  message: string;
  createdAt: string;
  resolvedAt?: string | null;
};

const AlertsScreen = () => {
  const { state, disconnect } = useStoreAccess();
  const navigation = useNavigation<any>();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unresolvedOnly, setUnresolvedOnly] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAlerts = async () => {
    if (!state) return;
    try {
      const api = createApi({ baseUrl: state.baseUrl, token: state.token });
      const data = await api.alerts(state.storeId, unresolvedOnly);
      setAlerts(data);
    } catch (error) {
      if ((error as Error).message === "Unauthorized") {
        await disconnect();
      }
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [unresolvedOnly, state]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, unresolvedOnly && styles.filterButtonActive]}
          onPress={() => setUnresolvedOnly(true)}
        >
          <Text style={[styles.filterText, unresolvedOnly && styles.filterTextActive]}>Unresolved</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, !unresolvedOnly && styles.filterButtonActive]}
          onPress={() => setUnresolvedOnly(false)}
        >
          <Text style={[styles.filterText, !unresolvedOnly && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("AlertDetail", { alert: item })}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.badge, styles[`badge_${item.severity}`]]}>{item.severity}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMessage}>{item.message}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No alerts yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  filterRow: { flexDirection: "row", marginBottom: 12, gap: 8 },
  filterButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  filterButtonActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  filterText: { fontSize: 12, color: "#475569" },
  filterTextActive: { color: "#FFFFFF" },
  card: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  badge: { fontSize: 10, textTransform: "uppercase", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badge_info: { backgroundColor: "#DBEAFE", color: "#2563EB" },
  badge_warn: { backgroundColor: "#FEF3C7", color: "#B45309" },
  badge_critical: { backgroundColor: "#FEE2E2", color: "#DC2626" },
  date: { fontSize: 10, color: "#94A3B8" },
  cardTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  cardMessage: { fontSize: 12, color: "#64748B", marginTop: 4 },
  emptyText: { textAlign: "center", color: "#94A3B8", marginTop: 40 }
});

export default AlertsScreen;
