import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { createApi } from "../lib/api";
import { useStoreAccess } from "../../App";

const ConnectScreen = () => {
  const { connect } = useStoreAccess();
  const [baseUrl, setBaseUrl] = useState("http://localhost:5000");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!baseUrl || !token) return;
    setLoading(true);
    try {
      const api = createApi({ baseUrl, token });
      const me = await api.storeAccessMe();
      await connect({
        baseUrl,
        token,
        storeId: me.storeId,
        storeName: me.storeName,
        timezone: me.timezone
      });
    } catch (error) {
      Alert.alert("Connection failed", "Invalid token or API URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect to Store</Text>
      <Text style={styles.subtitle}>Enter the API base URL and Store Access Token.</Text>

      <Text style={styles.label}>API Base URL</Text>
      <TextInput style={styles.input} value={baseUrl} onChangeText={setBaseUrl} autoCapitalize="none" />

      <Text style={styles.label}>Store Access Token</Text>
      <TextInput style={styles.input} value={token} onChangeText={setToken} autoCapitalize="none" />

      <Button title={loading ? "Connecting..." : "Connect"} onPress={handleConnect} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#F8FAFC" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#64748B", marginBottom: 24 },
  label: { fontSize: 12, color: "#475569", marginBottom: 6 },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16
  }
});

export default ConnectScreen;
