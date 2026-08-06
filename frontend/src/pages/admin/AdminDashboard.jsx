import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Hospital, Droplet, Calendar, Heart, TrendingUp, Activity,
  Shield, Beaker, ArrowRight, RefreshCw, AlertTriangle, CheckCircle, Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";

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

      const res = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center bg-card border border-border rounded-xl p-6 max-w-sm w-full">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-2">
            Failed to load dashboard
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Unable to retrieve system statistics. Please try again.
          </p>
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="btn-advanced w-full justify-center py-2 text-sm"
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
      <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-xl font-bold tracking-tight text-foreground">
              {value?.toLocaleString() ?? 0}
            </p>
            {subtitle && (
              <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
            <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">+{trend}%</span>
          </div>
        )}
      </div>
    );
  };

  const QuickActionCard = ({ title, description, icon, href, buttonText = "Manage" }) => (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-300 group flex flex-col h-full">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          {icon}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">
        {description}
      </p>

      <button
        onClick={() => navigate(href)}
        className="btn-ghost w-full justify-center py-2 text-xs group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
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
      <div className={`${config.bg} border ${config.border} rounded-lg p-3`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.iconBg} ${config.iconColor}`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-xs font-semibold ${config.text}`}>{title}</h3>
            <p className={`text-xs ${config.text} opacity-80 mt-0.5`}>
              {count} {description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                System overview of blood bank management
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-1.5 py-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <StatCard icon={<Users className="w-4 h-4" />} label="Total Donors" value={stats.totalDonors} subtitle="Registered donors" color="primary" />
          <StatCard icon={<Hospital className="w-4 h-4" />} label="Facilities" value={stats.totalFacilities} subtitle="Hospitals & Labs" color="blue" />
          <StatCard icon={<Droplet className="w-4 h-4" />} label="Total Donations" value={stats.totalDonations} subtitle="Units collected" color="green" />
          <StatCard icon={<Calendar className="w-4 h-4" />} label="Upcoming Camps" value={stats.upcomingCamps} subtitle="Scheduled drives" color="purple" />
          <StatCard icon={<Heart className="w-4 h-4" />} label="Active Donors" value={stats.activeDonors} subtitle="Recently donated" color="amber" />
        </div>

        {/* System Alerts Section */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            System Alerts
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {stats.pendingApprovals > 0 && (
              <AlertCard type="warning" title="Pending Approvals" description="facility registration(s) awaiting review" count={stats.pendingApprovals} icon={<Clock className="w-4 h-4" />} />
            )}
            {stats.criticalStock > 0 && (
              <AlertCard type="critical" title="Critical Stock Alert" description="blood type(s) with low inventory" count={stats.criticalStock} icon={<Droplet className="w-4 h-4" />} />
            )}
            {stats.pendingFacilities > 0 && (
              <AlertCard type="info" title="Facility Applications" description="new facility application(s) pending" count={stats.pendingFacilities} icon={<Hospital className="w-4 h-4" />} />
            )}
            {stats.pendingApprovals === 0 && stats.criticalStock === 0 && stats.pendingFacilities === 0 && (
              <div className="col-span-full bg-muted/50 border border-border rounded-lg p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-foreground">All systems operational</p>
                <p className="text-xs text-muted-foreground">No pending alerts or critical issues.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Beaker className="w-4 h-4 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <QuickActionCard icon={<Users className="w-4 h-4" />} title="Manage Donors" description="View, edit, or remove donors from the blood bank system" href="/admin/donors" />
            <QuickActionCard icon={<Hospital className="w-4 h-4" />} title="Manage Facilities" description="Approve, edit, or manage hospitals and blood laboratories" href="/admin/facilities" />
            <QuickActionCard icon={<Droplet className="w-4 h-4" />} title="Donation History" description="View all donation records, analytics, and reports" href="/admin/donations" />
            <QuickActionCard icon={<Calendar className="w-4 h-4" />} title="Blood Camps" description="Monitor and manage upcoming blood donation camps" href="/admin/camps" buttonText="View Camps" />
          </div>
        </div>

        {/* Recent Activity Section */}
        {stats.recentActivity && stats.recentActivity.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" />
              Recent Activity
            </h2>
            <div className="space-y-1">
              {stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs text-foreground font-medium">{activity.description}</span>
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