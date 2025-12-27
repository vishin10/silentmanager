import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout";
import AlertsPage from "./pages/AlertsPage";
import ShiftsPage from "./pages/ShiftsPage";
import ShiftDetailPage from "./pages/ShiftDetailPage";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";

const App = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<DashboardLayout />}
      >
        <Route index element={<Navigate to="/alerts" replace />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="shifts" element={<ShiftsPage />} />
        <Route path="shifts/:shiftId" element={<ShiftDetailPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
};

export default App;
