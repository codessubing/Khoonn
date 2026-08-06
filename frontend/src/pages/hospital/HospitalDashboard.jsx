import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Building2, MapPin, Phone, CalendarDays, Activity, Droplet,
  Clock, History, Users, AlertTriangle, CheckCircle, TrendingUp,
  RefreshCw, Loader2, Navigation, Search, User, X, ChevronDown, ChevronUp, Map
} from "lucide-react";

const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [bloodStock, setBloodStock] = useState([]);
  const [requests, setRequests] = useState([]);
  const [upcomingCamps, setUpcomingCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUnits: 0,
    lowStock: 0,
    expiringSoon: 0,
    pendingRequests: 0,
    totalRequests: 0,
  });

  const [emergencySearch, setEmergencySearch] = useState({
    isOpen: false,
    loading: false,
    bloodType: "O+",
    radiusKm: 5,
    lat: null,
    lng: null,
    results: [],
    expandedDonor: null
  });

  const FACILITY_API = `${API_BASE_URL}/api/facility`;
  const HOSPITAL_API = `${API_BASE_URL}/api/hospital`;
  const CAMPS_API = `${API_BASE_URL}/api/camps`;

  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const profileRes = await fetch(`${FACILITY_API}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) throw new Error("Failed to fetch hospital data");

        const profileData = await profileRes.json();
        const h = profileData.hospital || profileData.facility || profileData;

        if (!h) throw new Error("No hospital data found in response");

        const [stockRes, requestsRes, campsRes] = await Promise.all([
          axios.get(`${HOSPITAL_API}/blood/stock`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${HOSPITAL_API}/blood/requests`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${CAMPS_API}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const stockData = stockRes.data.data || [];
        const requestsData = requestsRes.data.data || [];
        const campsData = campsRes.data.camps || campsRes.data.data || [];

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
        setUpcomingCamps(campsData.slice(0, 3));
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

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    setEmergencySearch(prev => ({ ...prev, loading: true }));
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEmergencySearch(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false
        }));
        toast.success("📍 Hospital location captured!");
      },
      (err) => {
        let msg = "Unable to get location";
        if (err.code === 1) msg = "Permission denied. Enable GPS in browser settings.";
        else if (err.code === 2) msg = "Location unavailable. Try again.";
        else if (err.code === 3) msg = "Request timed out.";
        toast.error(msg);
        setEmergencySearch(prev => ({ ...prev, loading: false }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleEmergencySearch = async () => {
    if (!emergencySearch.lat || !emergencySearch.lng) {
      toast.error("Please capture hospital location first");
      return;
    }

    const rawToken = localStorage.getItem("token");
    const token = rawToken ? rawToken.trim() : null;

    if (!token) {
      console.error("❌ No token found in localStorage");
      toast.error("Authentication error. Please log out and log back in.");
      navigate("/login", { replace: true });
      return;
    }

    setEmergencySearch(prev => ({ ...prev, loading: true }));

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/emergency/find-donors`,
        {
          bloodType: emergencySearch.bloodType,
          hospitalLat: emergencySearch.lat,
          hospitalLng: emergencySearch.lng,
          radiusKm: parseInt(emergencySearch.radiusKm)
        },
        { 
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          } 
        }
      );

      setEmergencySearch(prev => ({
        ...prev,
        results: res.data.donors || [],
        loading: false
      }));

      if (res.data.totalFound === 0) {
        toast(`No eligible ${emergencySearch.bloodType} donors found within ${emergencySearch.radiusKm}km`, { icon: '⚠️' });
      } else {
        toast.success(`✅ Found ${res.data.totalFound} eligible donors!`);
      }
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      
      console.error(`🚨 Emergency Search Failed [${status}]:`, message);
      
      if (status === 401) {
        toast.error("Session expired or invalid. Redirecting to login...");
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      } else if (status === 403) {
        toast.error("Access denied. Hospital role required.");
      } else {
        toast.error(message || "Search failed. Please try again.");
      }
      setEmergencySearch(prev => ({ ...prev, loading: false }));
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center bg-card border border-border rounded-xl p-6 max-w-sm w-full">
          <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-foreground mb-2">Failed to load data</h2>
          <p className="text-xs text-muted-foreground mb-4">Please try refreshing the page or contact support.</p>
          <button onClick={() => window.location.reload()} className="btn-advanced w-full justify-center gap-1.5 text-xs">
            <RefreshCw size={14} />
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const loginHistory = getLoginHistory();
  const recentActivity = getRecentActivity();

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Hospital Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Welcome back! Here's your hospital overview.</p>
        </div>

        {/* Emergency Donor Matcher + Live Transit Quick Access */}
        <div className="bg-gradient-to-br from-destructive/5 to-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Navigation className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Emergency Donor Matcher</h3>
                <p className="text-[10px] text-muted-foreground">Find eligible donors near your hospital in real-time</p>
              </div>
            </div>
            <button
              onClick={() => setEmergencySearch(prev => ({ ...prev, isOpen: !prev.isOpen }))}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-foreground"
            >
              {emergencySearch.isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {emergencySearch.isOpen && (
            <div className="space-y-3 pt-2 border-t border-destructive/10">
              {/* Search Controls */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">Blood Type Needed</label>
                  <select
                    value={emergencySearch.bloodType}
                    onChange={(e) => setEmergencySearch(prev => ({ ...prev, bloodType: e.target.value }))}
                    className="input-minimal text-xs"
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">Search Radius</label>
                  <select
                    value={emergencySearch.radiusKm}
                    onChange={(e) => setEmergencySearch(prev => ({ ...prev, radiusKm: e.target.value }))}
                    className="input-minimal text-xs"
                  >
                    <option value={3}>Within 3 km</option>
                    <option value={5}>Within 5 km</option>
                    <option value={10}>Within 10 km</option>
                    <option value={25}>Within 25 km</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">Hospital Location</label>
                  <button
                    onClick={handleCaptureLocation}
                    disabled={emergencySearch.loading}
                    className="btn-ghost w-full justify-center gap-1.5 text-xs py-1.5"
                  >
                    {emergencySearch.lat ? (
                      <>
                        <CheckCircle size={12} className="text-green-600" />
                        {emergencySearch.lat.toFixed(4)}, {emergencySearch.lng.toFixed(4)}
                      </>
                    ) : (
                      <>
                        <MapPin size={12} />
                        Get Location
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={handleEmergencySearch}
                  disabled={emergencySearch.loading || !emergencySearch.lat}
                  className="btn-advanced w-full justify-center gap-1.5 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2"
                >
                  {emergencySearch.loading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...</>
                  ) : (
                    <><Search className="w-3.5 h-3.5" /> Find Donors</>
                  )}
                </button>

                {upcomingCamps.length > 0 && (
                  <Link 
                    to={`/hospital/camps/${upcomingCamps[0]._id}/transit`}
                    className="btn-advanced justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap text-xs py-2"
                  >
                    <Navigation size={14} />
                    Live Transit
                  </Link>
                )}
              </div>

              {/* Results */}
              {emergencySearch.results.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Found {emergencySearch.results.length} eligible donor(s):
                  </p>
                  {emergencySearch.results.map((donor) => (
                    <div key={donor._id} className="bg-card border border-border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-foreground">{donor.fullName}</p>
                            <p className="text-[10px] text-muted-foreground">
                               {donor.distanceKm}km away • {donor.city}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Last donated: {donor.lastDonationDate 
                                ? new Date(donor.lastDonationDate).toLocaleDateString() 
                                : "Never"}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`tel:${donor.phone}`}
                          className="btn-advanced text-[10px] py-1.5 px-3 shrink-0 ml-2"
                        >
                          <Phone size={12} className="mr-0.5 inline" /> Call
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {emergencySearch.results.length === 0 && emergencySearch.lat && !emergencySearch.loading && (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                  <p className="text-xs">No eligible donors found in this radius</p>
                  <p className="text-[10px] mt-1">Try increasing the search radius</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions Section for Hospital */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-primary" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 gap-3">
            <Link to="/hospital/live-donors" className="block">
              <div className="p-3 rounded-lg border border-border bg-card hover:bg-muted text-left transition-colors group">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Map className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">Live Donor Map</h4>
                </div>
                <p className="text-xs text-muted-foreground">Track donors in real-time</p>
              </div>
            </Link>
            
            <Link to="/hospital/request-blood" className="block">
              <div className="p-3 rounded-lg border border-border bg-card hover:bg-muted text-left transition-colors group">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <Droplet className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">Request Blood</h4>
                </div>
                <p className="text-xs text-muted-foreground">Order blood units</p>
              </div>
            </Link>
            
            <Link to="/hospital/donors" className="block">
              <div className="p-3 rounded-lg border border-border bg-card hover:bg-muted text-left transition-colors group">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">Donor Directory</h4>
                </div>
                <p className="text-xs text-muted-foreground">View all donors</p>
              </div>
            </Link>
            
            <Link to="/hospital/blood-requests" className="block">
              <div className="p-3 rounded-lg border border-border bg-card hover:bg-muted text-left transition-colors group">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">Blood Requests</h4>
                </div>
                <p className="text-xs text-muted-foreground">View pending requests</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Hospital Profile Card */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex flex-col gap-4">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Building2 className="w-5 h-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{hospital.name}</h2>
                  <p className="text-xs text-muted-foreground">{hospital.email}</p>

                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{hospital.address}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                      {hospital.phone}
                    </p>
                    <p className="flex items-center gap-1.5">
                      Category: <span className="font-medium text-foreground">{hospital.category}</span>
                    </p>
                  </div>
                </div>

                <div className="text-center shrink-0">
                  <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                    <CheckCircle size={12} />
                    {hospital.status?.toUpperCase() || "ACTIVE"}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Last Login: {hospital.lastLogin ? new Date(hospital.lastLogin).toLocaleString() : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Droplet className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Total Units</span>
            </div>
            <div className="text-lg font-bold tracking-tight text-foreground">{stats.totalUnits}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Blood Types</span>
            </div>
            <div className="text-lg font-bold tracking-tight text-foreground">{bloodStock.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Low Stock</span>
            </div>
            <div className="text-lg font-bold tracking-tight text-foreground">{stats.lowStock}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg bg-destructive/10">
                <Clock className="w-3.5 h-3.5 text-destructive" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Expiring Soon</span>
            </div>
            <div className="text-lg font-bold tracking-tight text-foreground">{stats.expiringSoon}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">Pending Requests</span>
            </div>
            <div className="text-lg font-bold tracking-tight text-foreground">{stats.pendingRequests}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Blood Inventory Overview */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-primary" />
              Blood Inventory
            </h3>

            {bloodStock.length === 0 ? (
              <div className="text-center py-6">
                <Droplet className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-3">No blood inventory available</p>
                <button onClick={() => navigate("/hospital/request-blood")} className="btn-advanced text-xs">
                  Request Blood
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bloodStock.slice(0, 6).map((item) => {
                  const status = getStockStatus(item.quantity, item.expiryDate);
                  const StatusIcon = status.icon;

                  return (
                    <div key={item._id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getBloodTypeColor(item.bloodGroup)}`}>
                          {item.bloodGroup}
                        </span>
                        <span className="text-sm font-semibold text-foreground">{item.quantity} units</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon size={12} className={status.color.split(" ")[1]} />
                        <span className="text-[10px] text-muted-foreground capitalize">{status.status}</span>
                      </div>
                    </div>
                  );
                })}

                {bloodStock.length > 6 && (
                  <button onClick={() => navigate("/hospital/blood-stock")} className="btn-ghost w-full justify-center text-xs">
                    View All {bloodStock.length} Types
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent Requests */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" />
              Recent Requests
            </h3>

            {requests.length === 0 ? (
              <div className="text-center py-6">
                <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No blood requests yet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {requests.slice(0, 5).map((request) => {
                  const statusColor = 
                    request.status === "accepted" ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" :
                    request.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" :
                    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";

                  return (
                    <div key={request._id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors">
                      <div>
                        <div className="font-medium text-foreground text-sm">{request.bloodType}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {request.units} units • {request.labId?.name || "Unknown Lab"}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${statusColor}`}>
                        {request.status}
                      </span>
                    </div>
                  );
                })}

                {requests.length > 5 && (
                  <button onClick={() => navigate("/hospital/request-history")} className="btn-ghost w-full justify-center text-xs">
                    View All {requests.length} Requests
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Login History */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              Recent Logins
            </h3>

            {loginHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No login history</p>
            ) : (
              <div className="space-y-2.5">
                {loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg border border-border">
                    <div>
                      <div className="font-medium text-foreground text-sm">{login.ip}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(login.date).toLocaleString()}</div>
                    </div>
                    <CheckCircle size={14} className="text-green-600 dark:text-green-400 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-primary" />
              Recent Activity
            </h3>

            {recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No recent activity</p>
            ) : (
              <div className="space-y-2.5">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-2.5 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground text-sm capitalize">
                        {activity.eventType?.toLowerCase().replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{activity.description}</p>
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