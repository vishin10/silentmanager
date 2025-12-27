import { Navigate, Route, Routes } from "react-router-dom";
import ConnectPage from "./pages/ConnectPage";
import DashboardLayout from "./components/DashboardLayout";
import AlertsPage from "./pages/AlertsPage";
import ShiftsPage from "./pages/ShiftsPage";
import ShiftDetailPage from "./pages/ShiftDetailPage";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import { getStoreToken } from "./lib/api";

const Protected = ({ children }: { children: JSX.Element }) => {
  if (!getStoreToken()) return <Navigate to="/connect" replace />;
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/connect" element={<ConnectPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <DashboardLayout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/alerts" replace />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="shifts" element={<ShiftsPage />} />
        <Route path="shifts/:shiftId" element={<ShiftDetailPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/connect" replace />} />
    </Routes>
  );
};

export default App;
