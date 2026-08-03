import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut, Menu, X, User, BarChart3, CheckCircle, Droplet,
  ClipboardList, History, Building, Shield, Calendar, TestTube,
  ChevronLeft, ChevronRight, Loader2, ClipboardPlus, Ambulance,
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com/api"
  : "http://localhost:5000/api";

const DashboardLayout = ({ userRole = "donor" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const menuConfig = {
    donor: {
      title: "Blood Donor Portal",
      subtitle: "Be a Hero, Save Lives",
      shortTitle: "Donor",
      icon: User,
      items: [
        { path: "/donor", label: "Dashboard", icon: BarChart3 },
        { path: "/donor/profile", label: "My Profile", icon: User },
        { path: "/donor/history", label: "Donation History", icon: History },
        { path: "/donor/camps", label: "Blood Camps", icon: Calendar },
      ],
    },
    hospital: {
      title: "Hospital Management",
      subtitle: "Blood Request & Inventory",
      shortTitle: "Hospital",
      icon: Building,
      items: [
        { path: "/hospital", label: "Dashboard", icon: BarChart3 },
        
        // ✅ FIXED: Changed from 'blood-request-create' to 'request-blood'
        { path: "/hospital/request-blood", label: "Request Blood", icon: ClipboardPlus },
        
        // ✅ FIXED: Changed from 'blood-request-history' to 'blood-requests' 
        { path: "/hospital/blood-requests", label: "Blood Requests", icon: ClipboardList },
        
        { path: "/hospital/inventory", label: "Inventory", icon: Droplet },
        { path: "/hospital/donors", label: "Donors", icon: User },
      ],
    },
    blood_lab: {
      title: "Blood Lab Center",
      subtitle: "Testing & Quality Control",
      shortTitle: "Lab",
      icon: TestTube,
      items: [
        { path: "/lab", label: "Dashboard", icon: BarChart3 },
        { path: "/lab/inventory", label: "Inventory", icon: Droplet },
        { path: "/lab/donor", label: "Donors", icon: User },
        { path: "/lab/camps", label: "Camps", icon: Calendar },
        { path: "/lab/requests", label: "Requests", icon: ClipboardList },
        { path: "/lab/profile", label: "Profile", icon: CheckCircle },
      ],
    },
    admin: {
      title: "BBMS Admin Panel",
      subtitle: "System Administration",
      shortTitle: "Admin",
      icon: Shield,
      items: [
        { path: "/admin", label: "Overview", icon: BarChart3 },
        { path: "/admin/verification", label: "Verification", icon: Shield },
        { path: "/admin/facilities", label: "Facilities", icon: Building },
        { path: "/admin/donors", label: "Donors", icon: User },
      ],
    },
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const maxRetries = 3;
      let attempt = 0;

      while (attempt < maxRetries) {
        try {
          const apiUrl = `${API_BASE_URL}/auth/profile`;
          const res = await fetch(apiUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Invalid server response");
          }

          if (res.ok) {
            const data = await res.json();
            const user = data.user;

            if (!user) throw new Error("User data structure invalid.");

            if (user.role.toLowerCase() !== userRole.toLowerCase()) {
              localStorage.removeItem("token");
              navigate("/login");
              return;
            }

            setUserData(user);
            setIsLoading(false);
            return;
          } else if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            navigate("/login");
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed:`, error.message);
        }

        attempt++;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }

      localStorage.removeItem("token");
      navigate("/login");
      setIsLoading(false);
    };

    fetchUserData();
  }, [userRole, navigate]);

  const normalizedRole = userRole?.toLowerCase().replace("-", "_");
  const config = menuConfig[normalizedRole] || {
    title: "Dashboard",
    subtitle: "Welcome to the Blood Bank System",
    shortTitle: "App",
    icon: BarChart3,
    items: [],
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* HEADER */}
      <header className="flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <ClipboardPlus size={20} className="text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {config.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">{config.subtitle}</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                {config.shortTitle}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-primary-foreground font-semibold bg-primary">
              {userData?.name?.charAt(0)?.toUpperCase() ||
                userData?.fullName?.charAt(0)?.toUpperCase() ||
                "U"}
            </div>
            <div className="hidden sm:block text-right">
              <span className="font-medium block text-sm text-foreground">
                {userData?.name || userData?.fullName || "User"}
              </span>
              <span className="text-xs capitalize text-muted-foreground">
                {userRole?.replace("_", " ")}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-muted transition-colors hidden sm:block text-muted-foreground hover:text-foreground"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 relative">
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 ${
            sidebarCollapsed ? "w-16" : "w-64"
          } bg-card border-r border-border transition-all duration-300 flex flex-col`}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <config.icon size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-foreground">
                    {config.shortTitle}
                  </h2>
                  <p className="text-xs text-muted-foreground">Portal</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="flex flex-col gap-1">
              {config.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 relative group ${
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    title={sidebarCollapsed ? item.label : ""}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="flex-1 text-left whitespace-nowrap text-sm">
                        {item.label}
                      </span>
                    )}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-3 py-2 bg-foreground text-background text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-md">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {!sidebarCollapsed && (
            <div className="p-4 border-t border-border">
              <div className="p-3 rounded-lg text-center bg-muted">
                <p className="text-sm font-semibold text-foreground">KyuuKhoonn</p>
                <p className="text-xs mt-1 text-muted-foreground">Save Lives, Donate Blood</p>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 min-h-[calc(100vh-64px)] pb-16 lg:pb-0">
          <div className="h-full overflow-auto p-4 sm:p-6">
            <Outlet context={{ userData }} />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
        <div className="flex justify-around items-center p-2">
          {config.items.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors flex-1 mx-1 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">
                  {item.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
