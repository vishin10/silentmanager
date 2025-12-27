import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { createApi } from "../lib/api";
import { useStoreAccess } from "../../App";

const AlertDetailScreen = () => {
  const { state } = useStoreAccess();
  const route = useRoute<RouteProp<{ params: { alert: any } }, "params">>();
  const { alert } = route.params;

  const handleResolve = async () => {
    if (!state) return;
    const api = createApi({ baseUrl: state.baseUrl, token: state.token });
    await api.resolveAlert(state.storeId, alert.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{alert.title}</Text>
      <Text style={styles.meta}>{new Date(alert.createdAt).toLocaleString()}</Text>
      <Text style={styles.severity}>Severity: {alert.severity}</Text>
      <Text style={styles.message}>{alert.message}</Text>
      {!alert.resolvedAt && <Button title="Resolve" onPress={handleResolve} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8FAFC" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  meta: { fontSize: 12, color: "#64748B", marginBottom: 8 },
  severity: { fontSize: 12, color: "#334155", marginBottom: 12 },
  message: { fontSize: 14, color: "#475569", marginBottom: 24 }
});

export default AlertDetailScreen;
