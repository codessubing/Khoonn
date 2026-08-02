import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Building2, MapPin, Phone, CalendarDays, Activity, Droplet,
  Clock, History, Users, AlertTriangle, CheckCircle, TrendingUp,
  RefreshCw, Loader2,
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [bloodStock, setBloodStock] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUnits: 0,
    lowStock: 0,
    expiringSoon: 0,
    pendingRequests: 0,
    totalRequests: 0,
  });

  // ✅ FIXED: Uses dynamic API_BASE_URL instead of VITE_API_URL
  const FACILITY_API = `${API_BASE_URL}/api/facility`;
  const HOSPITAL_API = `${API_BASE_URL}/api/hospital`;

  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        // ✅ FIXED: Absolute URL pointing to Render backend
        const profileRes = await fetch(`${FACILITY_API}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) {
          throw new Error("Failed to fetch hospital data");
        }

        const profileData = await profileRes.json();
        const h = profileData.hospital || profileData.facility || profileData;

        if (!h) {
          throw new Error("No hospital data found in response");
        }

        // ✅ FIXED: Absolute URLs pointing to Render backend
        const [stockRes, requestsRes] = await Promise.all([
          axios.get(`${HOSPITAL_API}/blood/stock`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${HOSPITAL_API}/blood/requests`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const stockData = stockRes.data.data || [];
        const requestsData = requestsRes.data.data || [];

        const totalUnits = stockData.reduce((sum, item) => sum + item.quantity, 0);
        const lowStock = stockData.filter((item) => item.quantity < 5).length;

        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const expiringSoon = stockData.filter((item) => {
          const expiryDate = new Date(item.expiryDate);
          return expiryDate <= nextWeek && expiryDate > today;
        }).length;

        const pendingRequests = requestsData.filter((req) => req.status === "pending").length;

        setHospital({
          name: h.name,
          email: h.email,
          phone: h.phone,
          type: h.facilityType,
          category: h.facilityCategory,
          address: `${h.address?.street}, ${h.address?.city}, ${h.address?.state} - ${h.address?.pincode}`,
          status: h.status,
          operatingHours: h.operatingHours,
          history: h.history || [],
          lastLogin: h.lastLogin,
        });

        setBloodStock(stockData);
        setRequests(requestsData);
        setStats({
          totalUnits,
          lowStock,
          expiringSoon,
          pendingRequests,
          totalRequests: requestsData.length,
        });
      } catch (err) {
        console.error("Error fetching hospital data:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, [navigate]);

  const getLoginHistory = () => {
    if (!hospital?.history) return [];
    return hospital.history
      .filter((event) => event.eventType === "Login")
      .slice(0, 5)
      .map((login) => ({
        date: login.date,
        description: login.description || "System login",
        ip: login.description?.match(/\d+\.\d+\.\d+\.\d+/)?.[0] || "Facility Login",
      }));
  };

  const getRecentActivity = () => {
    if (!hospital?.history) return [];
    return hospital.history
      .filter((event) => event.eventType !== "Login")
      .slice(0, 10)
      .map((activity) => ({
        date: activity.date,
        eventType: activity.eventType,
        description: activity.description,
        referenceId: activity.referenceId,
      }));
  };

  const getBloodTypeColor = (bloodType) => {
    const map = {
      "O-": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      "O+": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      "A-": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      "A+": "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      "B-": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
      "B+": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
      "AB-": "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
      "AB+": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
    };
    return map[bloodType] || "bg-muted text-muted-foreground border-border";
  };

  const getStockStatus = (quantity, expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);

    if (expiry <= today) {
      return { status: "Expired", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle };
    }

    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 3) {
      return { status: "Critical", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle };
    } else if (daysUntilExpiry <= 7) {
      return { status: "Warning", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: AlertTriangle };
    } else if (quantity < 5) {
      return { status: "Low", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: AlertTriangle };
    } else {
      return { status: "Good", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", icon: CheckCircle };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading hospital dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center bg-card border border-border rounded-2xl p-8 max-w-sm w-full">
          <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Failed to load data</h2>
          <p className="text-sm text-muted-foreground mb-6">Please try refreshing the page or contact support.</p>
          <button onClick={() => window.location.reload()} className="btn-advanced w-full justify-center gap-2">
            <RefreshCw size={16} />
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const loginHistory = getLoginHistory();
  const recentActivity = getRecentActivity();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hospital Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's your hospital overview.</p>
        </div>

        {/* Hospital Profile Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{hospital.name}</h2>
                  <p className="text-sm text-muted-foreground">{hospital.email}</p>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{hospital.address}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      {hospital.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      Category: <span className="font-medium text-foreground">{hospital.category}</span>
                    </p>
                  </div>
                </div>

                <div className="text-center md:text-right shrink-0">
                  <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-medium">
                    <CheckCircle size={14} />
                    {hospital.status?.toUpperCase() || "ACTIVE"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last Login: {hospital.lastLogin ? new Date(hospital.lastLogin).toLocaleString() : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Droplet className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total Blood Units</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.totalUnits}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Blood Types</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{bloodStock.length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Low Stock</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.lowStock}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Clock className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Expiring Soon</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.expiringSoon}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Pending Requests</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.pendingRequests}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blood Inventory Overview */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-primary" />
              Blood Inventory
            </h3>

            {bloodStock.length === 0 ? (
              <div className="text-center py-8">
                <Droplet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No blood inventory available</p>
                <button onClick={() => navigate("/hospital/request-blood")} className="btn-advanced">
                  Request Blood
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bloodStock.slice(0, 6).map((item) => {
                  const status = getStockStatus(item.quantity, item.expiryDate);
                  const StatusIcon = status.icon;

                  return (
                    <div key={item._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getBloodTypeColor(item.bloodGroup)}`}>
                          {item.bloodGroup}
                        </span>
                        <span className="text-base font-semibold text-foreground">{item.quantity} units</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon size={14} className={status.color.split(" ")[1]} />
                        <span className="text-xs text-muted-foreground capitalize">{status.status}</span>
                      </div>
                    </div>
                  );
                })}

                {bloodStock.length > 6 && (
                  <button onClick={() => navigate("/hospital/blood-stock")} className="btn-ghost w-full justify-center">
                    View All {bloodStock.length} Blood Types
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent Requests */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Blood Requests
            </h3>

            {requests.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No blood requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 5).map((request) => {
                  const statusColor = 
                    request.status === "accepted" ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" :
                    request.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" :
                    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";

                  return (
                    <div key={request._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors">
                      <div>
                        <div className="font-medium text-foreground text-sm">{request.bloodType}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {request.units} units • {request.labId?.name || "Unknown Lab"}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusColor}`}>
                        {request.status}
                      </span>
                    </div>
                  );
                })}

                {requests.length > 5 && (
                  <button onClick={() => navigate("/hospital/request-history")} className="btn-ghost w-full justify-center">
                    View All {requests.length} Requests
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Login History */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Logins
            </h3>

            {loginHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No login history available</p>
            ) : (
              <div className="space-y-3">
                {loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                    <div>
                      <div className="font-medium text-foreground text-sm">{login.ip}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{new Date(login.date).toLocaleString()}</div>
                    </div>
                    <CheckCircle size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Recent Activity
            </h3>

            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground text-sm capitalize">
                        {activity.eventType?.toLowerCase().replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;