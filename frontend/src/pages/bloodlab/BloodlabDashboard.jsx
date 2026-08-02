import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Droplet, Calendar, Users, Activity, Clock, MapPin, Phone, Mail,
  Building2, Shield, LogIn, AlertCircle, RefreshCw, Beaker, TrendingUp,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const BloodLabDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [stock, setStock] = useState([]);
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ FIXED: Uses dynamic API_BASE_URL instead of VITE_API_URL
  const API_URL = `${API_BASE_URL}/api/blood-lab`;

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const [dashboardRes, stockRes, profileRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard`, { headers: { Authorization: `Bearer ${token}` } }).catch((err) => { throw err; }),
        axios.get(`${API_URL}/blood/stock`, { headers: { Authorization: `Bearer ${token}` } }).catch((err) => { throw err; }),
        axios.get(`${API_URL}/history`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {
          // Fallback to dashboard if history endpoint doesn't exist
          return axios.get(`${API_URL}/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
        }),
      ]);

      setDashboard(dashboardRes.data);

      let stockData = [];
      if (stockRes.data.data) stockData = stockRes.data.data;
      else if (stockRes.data.stock) stockData = stockRes.data.stock;
      else if (Array.isArray(stockRes.data)) stockData = stockRes.data;
      setStock(stockData);

      const facilityProfile = dashboardRes.data.facility || {};
      let historyData = profileRes.data.activity ? profileRes.data.activity : (facilityProfile.history || []);

      setLab({ ...facilityProfile, history: historyData });
    } catch (error) {
      console.error("Dashboard Error:", error);
      const message = error.response?.data?.message || "Failed to load dashboard data";
      toast.error(message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success("Dashboard updated");
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading Blood Lab Dashboard...</p>
        </div>
      </div>
    );
  }

  const totalUnits = stock.reduce((sum, blood) => sum + (blood.quantity || 0), 0);
  const criticalStock = stock.filter((blood) => (blood.quantity || 0) < 10).length;
  const loginHistory = lab?.history?.filter((h) => h.eventType === "Login") || [];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Beaker className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Blood Lab Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive overview of your blood laboratory operations
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Alert Banner for Critical Stock */}
        {criticalStock > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-300">Low Stock Alert</p>
              <p className="text-amber-700/80 dark:text-amber-400/80 text-sm">
                {criticalStock} blood type{criticalStock > 1 ? "s" : ""} have critically low inventory
              </p>
            </div>
          </div>
        )}

        {/* Lab Profile Card */}
        {lab && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Laboratory Overview
              </h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                lab.status === "approved"
                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
              }`}>
                {lab.status?.charAt(0).toUpperCase() + lab.status?.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <LabInfo icon={<Mail className="w-4 h-4" />} label="Email" value={lab.email} />
              <LabInfo icon={<Phone className="w-4 h-4" />} label="Phone" value={lab.phone} />
              <LabInfo 
                icon={<Clock className="w-4 h-4" />} 
                label="Operating Hours" 
                value={`${lab.operatingHours?.open || "--"} - ${lab.operatingHours?.close || "--"}`} 
              />
              <LabInfo 
                icon={<MapPin className="w-4 h-4" />} 
                label="Location" 
                value={`${lab.address?.city}, ${lab.address?.state}`} 
                truncate 
              />
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Calendar className="w-5 h-5" />}
            label="Total Camps"
            value={dashboard?.stats?.totalCamps || 0}
            trend={dashboard?.stats?.campsTrend}
            color="blue"
          />
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            label="Total Donors"
            value={dashboard?.stats?.totalDonors || 0}
            trend={dashboard?.stats?.donorsTrend}
            color="green"
          />
          <MetricCard
            icon={<Droplet className="w-5 h-5" />}
            label="Blood Units"
            value={totalUnits}
            subtitle={`${criticalStock} critical`}
            color="red"
            alert={criticalStock > 0}
          />
          <MetricCard
            icon={<Activity className="w-5 h-5" />}
            label="Active Camps"
            value={dashboard?.stats?.upcomingCamps || 0}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blood Stock Section */}
          <Section title="Blood Inventory" icon={<Droplet className="w-5 h-5 text-primary" />} subtitle="Current blood stock levels">
            {stock.length > 0 ? (
              <div className="space-y-3">
                {stock.map((blood) => {
                  const bloodType = blood.bloodGroup || blood.bloodType;
                  const quantity = blood.quantity || 0;
                  return (
                    <BloodStockItem
                      key={blood._id}
                      bloodType={bloodType}
                      quantity={quantity}
                      critical={quantity < 10}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<Droplet className="w-8 h-8" />} message="No blood stock data available" />
            )}
          </Section>

          {/* Recent Camps Section */}
          <Section title="Recent Blood Donation Camps" icon={<Calendar className="w-5 h-5 text-primary" />} subtitle="Latest organized camps">
            {dashboard?.recentCamps?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentCamps.slice(0, 4).map((camp) => (
                  <CampCard key={camp._id} camp={camp} />
                ))}
              </div>
            ) : (
              <EmptyState icon={<Calendar className="w-8 h-8" />} message="No recent camps organized" />
            )}
          </Section>
        </div>

        {/* Access History Section */}
        <Section title="Access History" icon={<Shield className="w-5 h-5 text-primary" />} subtitle="Recent login activity">
          {loginHistory.length > 0 ? (
            <div className="space-y-3">
              {loginHistory.slice(-5).reverse().map((h, idx) => (
                <HistoryItem key={h._id || idx} history={h} isLogin />
              ))}
            </div>
          ) : (
            <EmptyState icon={<LogIn className="w-8 h-8" />} message="No login history available" />
          )}
        </Section>

        {/* Activity History Section */}
        {lab?.history?.length > 0 && (
          <Section title="Recent Activity" icon={<Activity className="w-5 h-5 text-primary" />} subtitle="All laboratory activities">
            <div className="space-y-3">
              {lab.history.slice(-5).reverse().map((h, idx) => (
                <HistoryItem key={h._id || idx} history={h} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

// --- Reusable Components ---

const MetricCard = ({ icon, label, value, subtitle, trend, color, alert = false }) => {
  const colorClasses = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
    green: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" },
    red: { bg: "bg-destructive/10", text: "text-destructive" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  };

  const colors = colorClasses[color] || colorClasses.blue;
  const finalBg = alert ? "bg-destructive/10" : colors.bg;
  const finalText = alert ? "text-destructive" : colors.text;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${alert ? "text-destructive" : "text-muted-foreground"}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${finalBg} ${finalText}`}>
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

const Section = ({ title, icon, subtitle, children, className = "" }) => (
  <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          {icon} {title}
        </h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const LabInfo = ({ icon, label, value, truncate = false }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-primary/10 rounded-lg text-primary mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-medium text-foreground ${truncate ? "truncate" : ""}`}>
        {value || "—"}
      </p>
    </div>
  </div>
);

const BloodStockItem = ({ bloodType, quantity, critical = false }) => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg shrink-0 ${critical ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600 dark:text-green-400"}`}>
        <Droplet className="w-4 h-4" />
      </div>
      <span className="font-medium text-foreground">{bloodType}</span>
    </div>
    <div className="text-right shrink-0">
      <span className={`font-bold ${critical ? "text-destructive" : "text-foreground"}`}>
        {quantity} units
      </span>
      {critical && <p className="text-xs text-destructive mt-0.5">Low stock</p>}
    </div>
  </div>
);

const CampCard = ({ camp }) => {
  const statusConfig = {
    Upcoming: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    Completed: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const statusClass = statusConfig[camp.status] || "bg-muted text-muted-foreground border-border";

  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
      <div className="flex-1 min-w-0 pr-4">
        <h4 className="font-medium text-foreground truncate">{camp.title}</h4>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(camp.date).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusClass}`}>
          {camp.status}
        </span>
        {camp.expectedDonors && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {camp.expectedDonors} donors
          </p>
        )}
      </div>
    </div>
  );
};

const HistoryItem = ({ history, isLogin = false }) => {
  const eventType = history.eventType || "Login";
  
  const getIcon = (type) => {
    switch (type) {
      case "Login": return <LogIn className="w-4 h-4" />;
      case "Stock Update": return <Droplet className="w-4 h-4" />;
      case "Blood Camp": return <Calendar className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case "Login": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "Stock Update": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "Blood Camp": return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${getColor(eventType)}`}>
          {getIcon(eventType)}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{eventType}</p>
          <p className="text-xs text-muted-foreground">
            {history.description || (isLogin ? "Successful login" : "Activity recorded")}
          </p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {new Date(history.date).toLocaleString()}
      </span>
    </div>
  );
};

const EmptyState = ({ icon, message }) => (
  <div className="text-center py-10 text-muted-foreground">
    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground/50">
      {icon}
    </div>
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export default BloodLabDashboard;