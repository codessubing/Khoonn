import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ FIXED: Uses dynamic API_BASE_URL instead of VITE_API_URL
      const apiUrl = `${API_BASE_URL}/api/auth/login`;
      
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      // Handle non-JSON responses gracefully
      let data = {};
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await res.json();
      } else if (!res.ok) {
        data = { error: `Server error: ${res.status} (Check backend URL)` };
      }

      if (res.ok) {
        // Save auth data
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        toast.success("Login successful!");

        // Redirect based on role (matching your app's routing structure)
        const role = data.role?.toLowerCase();
        if (role === "hospital") {
          navigate("/hospital", { replace: true });
        } else if (role === "blood-lab" || role === "blood_lab") {
          navigate("/lab", { replace: true });
        } else if (role === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/donor", { replace: true }); // Default fallback
        }
      } else {
        setError(data.error || data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Welcome Back
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your dashboard
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="input-minimal pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="input-minimal pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-advanced w-full justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <a href="/" className="text-primary hover:underline font-medium transition-colors">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}