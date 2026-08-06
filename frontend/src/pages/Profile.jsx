import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  User, Mail, Shield, LogOut, Loader2, AlertCircle,
  Building2, Droplet, Heart, Edit3,
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await res.json();
      setUser(data.user || data);
    } catch (err) {
      console.error("Profile fetch error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      } else {
        setError("Failed to load profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const getRoleConfig = (role) => {
    const configs = {
      donor: {
        label: "Blood Donor",
        icon: Heart,
        color: "bg-destructive/10 text-destructive",
        profilePath: "/donor/profile",
      },
      hospital: {
        label: "Hospital",
        icon: Building2,
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        profilePath: "/hospital/profile",
      },
      "blood-lab": {
        label: "Blood Lab",
        icon: Droplet,
        color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        profilePath: "/lab/profile",
      },
      admin: {
        label: "Administrator",
        icon: Shield,
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        profilePath: "/admin",
      },
    };
    return configs[role] || configs.donor;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center bg-card border border-border rounded-2xl p-8 max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Profile Error
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {error || "Could not load profile data."}
          </p>
          <div className="flex gap-3">
            <button onClick={fetchProfile} className="btn-ghost flex-1 justify-center active:scale-95 transition-transform">
              Retry
            </button>
            <button onClick={() => navigate("/login")} className="btn-advanced flex-1 justify-center active:scale-95 transition-transform">
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const roleConfig = getRoleConfig(user.role);
  const RoleIcon = roleConfig.icon;
  const displayName = user.name || user.fullName || user.email || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border-2 border-primary/20">
                {initials}
              </div>
              <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full border-2 border-card ${roleConfig.color}`}>
                <RoleIcon className="w-4 h-4" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left w-full">
              <h1 className="text-2xl font-bold tracking-tight text-foreground break-words">
                {displayName}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleConfig.color} border-current/20`}>
                  <RoleIcon className="w-3 h-3" />
                  {roleConfig.label}
                </span>
                {user.status && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    {user.status}
                  </span>
                )}
              </div>
            </div>

            {/* Actions - Stacked on mobile, inline on desktop */}
            <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end mt-2 sm:mt-0">
              <button
                onClick={() => navigate(roleConfig.profilePath)}
                className="btn-ghost flex-1 sm:flex-none justify-center active:scale-95 transition-transform"
                title="Edit Profile"
              >
                <Edit3 className="w-4 h-4" />
                <span className="sm:hidden ml-2 text-xs">Edit</span>
              </button>
              <button
                onClick={handleLogout}
                className="btn-ghost text-destructive hover:bg-destructive/10 flex-1 sm:flex-none justify-center active:scale-95 transition-transform"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="sm:hidden ml-2 text-xs">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Account ID
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground truncate" title={user._id}>
              {user._id || "N/A"}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </span>
            </div>
            <p className="text-sm text-foreground truncate" title={user.email}>
              {user.email || "N/A"}
            </p>
          </div>

          {user.phone && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Phone
                </span>
              </div>
              <p className="text-sm text-foreground">{user.phone}</p>
            </div>
          )}

          {user.bloodGroup && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Droplet className="w-4 h-4 text-destructive" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Blood Group
                </span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {user.bloodGroup}
              </p>
            </div>
          )}
        </div>

        {/* Role-Specific CTA */}
        <div className="bg-muted/50 border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Manage your {roleConfig.label.toLowerCase()} settings and preferences
          </p>
          <button
            onClick={() => navigate(roleConfig.profilePath)}
            className="btn-advanced w-full sm:w-auto justify-center active:scale-95 transition-transform"
          >
            <Edit3 className="w-4 h-4" />
            Go to {roleConfig.label} Profile
          </button>
        </div>
      </div>
    </div>
  );
}