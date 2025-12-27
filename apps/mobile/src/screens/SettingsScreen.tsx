import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useStoreAccess } from "../../App";

const SettingsScreen = () => {
  const { state, disconnect } = useStoreAccess();

  if (!state) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Store</Text>
        <Text style={styles.meta}>Name: {state.storeName}</Text>
        <Text style={styles.meta}>Timezone: {state.timezone}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>API</Text>
        <Text style={styles.meta}>Base URL: {state.baseUrl}</Text>
        <Text style={styles.meta}>Ingest: /api/ingest/xml</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Agent setup</Text>
        <Text style={styles.meta}>Watch path example: Z:\XMLGateway\BOOutBox</Text>
      </View>

      <Button title="Disconnect" onPress={disconnect} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  card: { backgroundColor: "#FFFFFF", padding: 16, borderRadius: 16, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  meta: { fontSize: 12, color: "#64748B", marginBottom: 4 }
});

export default SettingsScreen;
