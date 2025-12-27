import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken } from "../lib/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token } = await api.login(email, password);
      setToken(token);
      navigate("/alerts");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-2">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-6">Login to monitor your store shifts.</p>
        <label className="text-sm">Email</label>
        <input
          className="w-full border rounded-md px-3 py-2 mb-3"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label className="text-sm">Password</label>
        <input
          className="w-full border rounded-md px-3 py-2 mb-4"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          className="w-full bg-blue-600 text-white rounded-md py-2 font-medium disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <p className="text-sm text-center text-slate-500 mt-4">
          New here? <Link to="/register" className="text-blue-600">Create account</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
