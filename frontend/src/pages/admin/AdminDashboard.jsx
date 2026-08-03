import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Hospital, Droplet, Calendar, Heart, TrendingUp, Activity,
  Shield, Beaker, ArrowRight, RefreshCw, AlertTriangle, CheckCircle, Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchStats = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // ✅ FIXED: Uses absolute URL pointing to Render backend
      const res = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // ✅ ENHANCED: Handle auth failures explicitly
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch stats (${res.status})`);
      }

      const data = await res.json();
      setStats(data);

      if (showToast) {
        toast.success("Dashboard updated successfully!");
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      toast.error("Failed to load admin stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center bg-card border border-border rounded-2xl p-8 max-w-sm w-full">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to load dashboard
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Unable to retrieve system statistics. Please try again.
          </p>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="btn-advanced w-full justify-center"
          >
            {refreshing ? "Retrying..." : "Retry Loading"}
          </button>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon, label, value, subtitle, trend, color = "primary" }) => {
    const colorMap = {
      primary: { bg: "bg-primary/10", text: "text-primary" },
      blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
      green: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" },
      purple: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
      amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
    };

    const colors = colorMap[color] || colorMap.primary;

    return (
      <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {value?.toLocaleString() ?? 0}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-4 pt-4 border-t border-border">
            <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">+{trend}%</span>
            <span className="text-xs text-muted-foreground">from last month</span>
          </div>
        )}
      </div>
    );
  };

  const QuickActionCard = ({ title, description, icon, href, buttonText = "Manage" }) => (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all duration-300 group flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          {icon}
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
      </div>

      <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">
        {description}
      </p>

      <button
        onClick={() => navigate(href)}
        className="btn-ghost w-full justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
      >
        {buttonText}
      </button>
    </div>
  );

  const AlertCard = ({ type, title, description, count, icon }) => {
    const alertConfig = {
      warning: {
        bg: "bg-amber-500/10 dark:bg-amber-500/5",
        border: "border-amber-500/20",
        text: "text-amber-700 dark:text-amber-400",
        iconBg: "bg-amber-500/20",
        iconColor: "text-amber-700 dark:text-amber-400",
      },
      critical: {
        bg: "bg-destructive/10 dark:bg-destructive/5",
        border: "border-destructive/20",
        text: "text-destructive",
        iconBg: "bg-destructive/20",
        iconColor: "text-destructive",
      },
      info: {
        bg: "bg-blue-500/10 dark:bg-blue-500/5",
        border: "border-blue-500/20",
        text: "text-blue-700 dark:text-blue-400",
        iconBg: "bg-blue-500/20",
        iconColor: "text-blue-700 dark:text-blue-400",
      },
    };

    const config = alertConfig[type] || alertConfig.info;

    return (
      <div className={`${config.bg} border ${config.border} rounded-xl p-5`}>
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-lg ${config.iconBg} ${config.iconColor}`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${config.text}`}>{title}</h3>
            <p className={`text-xs ${config.text} opacity-80 mt-0.5`}>
              {count} {description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive overview of the blood bank management system
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total Donors" value={stats.totalDonors} subtitle="Registered blood donors" color="primary" />
          <StatCard icon={<Hospital className="w-5 h-5" />} label="Facilities" value={stats.totalFacilities} subtitle="Hospitals & Labs" color="blue" />
          <StatCard icon={<Droplet className="w-5 h-5" />} label="Total Donations" value={stats.totalDonations} subtitle="Blood units collected" color="green" />
          <StatCard icon={<Calendar className="w-5 h-5" />} label="Upcoming Camps" value={stats.upcomingCamps} subtitle="Scheduled blood drives" color="purple" />
          <StatCard icon={<Heart className="w-5 h-5" />} label="Active Donors" value={stats.activeDonors} subtitle="Recently donated" color="amber" />
        </div>

        {/* System Alerts Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            System Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.pendingApprovals > 0 && (
              <AlertCard type="warning" title="Pending Approvals" description="facility registration(s) awaiting review" count={stats.pendingApprovals} icon={<Clock className="w-5 h-5" />} />
            )}
            {stats.criticalStock > 0 && (
              <AlertCard type="critical" title="Critical Stock Alert" description="blood type(s) with low inventory" count={stats.criticalStock} icon={<Droplet className="w-5 h-5" />} />
            )}
            {stats.pendingFacilities > 0 && (
              <AlertCard type="info" title="Facility Applications" description="new facility application(s) pending" count={stats.pendingFacilities} icon={<Hospital className="w-5 h-5" />} />
            )}
            {stats.pendingApprovals === 0 && stats.criticalStock === 0 && stats.pendingFacilities === 0 && (
              <div className="col-span-full bg-muted/50 border border-border rounded-xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">All systems operational</p>
                <p className="text-xs text-muted-foreground">No pending alerts or critical issues.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard icon={<Users className="w-5 h-5" />} title="Manage Donors" description="View, edit, or remove donors from the blood bank system" href="/admin/donors" />
            <QuickActionCard icon={<Hospital className="w-5 h-5" />} title="Manage Facilities" description="Approve, edit, or manage hospitals and blood laboratories" href="/admin/facilities" />
            <QuickActionCard icon={<Droplet className="w-5 h-5" />} title="Donation History" description="View all donation records, analytics, and reports" href="/admin/donations" />
            <QuickActionCard icon={<Calendar className="w-5 h-5" />} title="Blood Camps" description="Monitor and manage upcoming blood donation camps" href="/admin/camps" buttonText="View Camps" />
          </div>
        </div>

        {/* Recent Activity Section */}
        {stats.recentActivity && stats.recentActivity.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </h2>
            <div className="space-y-1">
              {stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-foreground font-medium">{activity.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;