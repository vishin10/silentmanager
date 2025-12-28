import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const SetupPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async () => {
    // Validation
    if (!email || !password || !storeName) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Register user
      const authResult = await api.register(email, password);
      localStorage.setItem("sm_token", authResult.token);
      
      // Step 2: Create first store
      const store = await api.createStore(storeName, timezone);
      localStorage.setItem("sm_storeId", store.id);
      
      // Navigate to dashboard
      navigate("/alerts");
    } catch (err: any) {
      setError(err.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Silent Manager Setup</h1>
          <p className="text-sm text-slate-600 mt-1">Create your admin account and first store</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          <div className="border-t pt-3">
            <label className="block text-sm font-medium mb-1">Store Name</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="My Store"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Timezone</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
        </div>

        <button
          className="w-full bg-blue-600 text-white rounded-md py-2 font-medium disabled:opacity-50 hover:bg-blue-700"
          onClick={handleSetup}
          disabled={loading}
        >
          {loading ? "Setting up..." : "Complete Setup"}
        </button>
      </div>
    </div>
  );
};

export default SetupPage;