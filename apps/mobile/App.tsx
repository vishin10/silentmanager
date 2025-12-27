import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import ConnectScreen from "./src/screens/ConnectScreen";
import AlertsScreen from "./src/screens/AlertsScreen";
import AlertDetailScreen from "./src/screens/AlertDetailScreen";
import ShiftsScreen from "./src/screens/ShiftsScreen";
import ShiftDetailScreen from "./src/screens/ShiftDetailScreen";
import ChatScreen from "./src/screens/ChatScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

export type StoreAccessState = {
  baseUrl: string;
  token: string;
  storeId: string;
  storeName: string;
  timezone: string;
};

type StoreAccessContextValue = {
  state: StoreAccessState | null;
  connect: (state: StoreAccessState) => Promise<void>;
  disconnect: () => Promise<void>;
};

const StoreAccessContext = createContext<StoreAccessContextValue | undefined>(undefined);

export const useStoreAccess = () => {
  const ctx = useContext(StoreAccessContext);
  if (!ctx) throw new Error("StoreAccessContext missing");
  return ctx;
};

const storeKeys = ["sm_apiUrl", "sm_storeToken", "sm_storeId", "sm_storeName", "sm_timezone"] as const;

const AlertsStack = createNativeStackNavigator();
const ShiftsStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const AlertsNavigator = () => (
  <AlertsStack.Navigator>
    <AlertsStack.Screen name="AlertsList" component={AlertsScreen} options={{ title: "Alerts" }} />
    <AlertsStack.Screen name="AlertDetail" component={AlertDetailScreen} options={{ title: "Alert" }} />
  </AlertsStack.Navigator>
);

const ShiftsNavigator = () => (
  <ShiftsStack.Navigator>
    <ShiftsStack.Screen name="ShiftsList" component={ShiftsScreen} options={{ title: "Shifts" }} />
    <ShiftsStack.Screen name="ShiftDetail" component={ShiftDetailScreen} options={{ title: "Shift" }} />
  </ShiftsStack.Navigator>
);

const MainTabs = () => (
  <Tabs.Navigator>
    <Tabs.Screen name="Alerts" component={AlertsNavigator} />
    <Tabs.Screen name="Shifts" component={ShiftsNavigator} />
    <Tabs.Screen name="Chat" component={ChatScreen} />
    <Tabs.Screen name="Settings" component={SettingsScreen} />
  </Tabs.Navigator>
);

export default function App() {
  const [state, setState] = useState<StoreAccessState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const values = await Promise.all(storeKeys.map((key) => SecureStore.getItemAsync(key)));
      const [baseUrl, token, storeId, storeName, timezone] = values;
      if (baseUrl && token && storeId && storeName && timezone) {
        setState({ baseUrl, token, storeId, storeName, timezone });
      }
      setLoading(false);
    };
    load();
  }, []);

  const connect = async (next: StoreAccessState) => {
    await SecureStore.setItemAsync("sm_apiUrl", next.baseUrl);
    await SecureStore.setItemAsync("sm_storeToken", next.token);
    await SecureStore.setItemAsync("sm_storeId", next.storeId);
    await SecureStore.setItemAsync("sm_storeName", next.storeName);
    await SecureStore.setItemAsync("sm_timezone", next.timezone);
    setState(next);
  };

  const disconnect = async () => {
    await Promise.all(storeKeys.map((key) => SecureStore.deleteItemAsync(key)));
    setState(null);
  };

  const contextValue = useMemo(() => ({ state, connect, disconnect }), [state]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <StoreAccessContext.Provider value={contextValue}>
      <NavigationContainer>{state ? <MainTabs /> : <ConnectScreen />}</NavigationContainer>
    </StoreAccessContext.Provider>
  );
}
