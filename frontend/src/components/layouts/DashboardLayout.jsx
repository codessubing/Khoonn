// frontend/src/components/layouts/DashboardLayout.jsx
import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut, Menu, X, User, BarChart3, CheckCircle, Droplet,
  ClipboardList, History, Building, Shield, Calendar, TestTube,
  ChevronLeft, ChevronRight, Loader2, ClipboardPlus, Ambulance, Map, Camera, Settings
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com/api"
  : "http://localhost:5000/api";

// ✅ NEW: UserProfileDropdown Component
const UserProfileDropdown = ({ userData, onLogout, onChangeAvatar, isOpen, toggleOpen, dropdownRef }) => {
  const handleAvatarClick = (e) => {
    e.stopPropagation(); // Prevent closing dropdown immediately
    toggleOpen();
  };

  const handleLogoutClick = (e) => {
    e.stopPropagation();
    onLogout();
  };

  const handleChangeAvatar = (e) => {
    e.stopPropagation();
    onChangeAvatar();
    // Optionally close the dropdown after clicking change avatar
    // toggleOpen(); 
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Only close if the click wasn't on the avatar button itself
        if (!event.target.closest('[aria-label="User menu"]')) {
          toggleOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [toggleOpen, dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar + Name Button */}
      <button
        onClick={handleAvatarClick}
        className="flex items-center gap-2 group"
        aria-label="User menu"
      >
        <div className="relative">
          {/* Avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-md group-hover:shadow-lg transition-shadow">
            {userData?.name?.charAt(0)?.toUpperCase() ||
              userData?.fullName?.charAt(0)?.toUpperCase() ||
              userData?.email?.charAt(0)?.toUpperCase() ||
              "U"}
          </div>
          {/* Camera icon overlay for change avatar */}
          <button
            onClick={handleChangeAvatar}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Change avatar"
          >
            <Camera size={10} className="text-red-600" />
          </button>
        </div>

        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-foreground">{userData?.name || userData?.fullName || "User"}</p>
          <p className="text-xs text-muted-foreground capitalize">{userData?.role || "Donor"}</p>
        </div>

        {/* Dropdown Arrow */}
        <span className="w-5 h-5 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border overflow-hidden z-50">
          <div className="py-1">
            <button
              onClick={handleChangeAvatar}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
            >
              <Camera size={16} className="text-gray-500" />
              Change Avatar
            </button>
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
            >
              <LogOut size={16} className="text-gray-500" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardLayout = ({ userRole = "donor" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // ✅ NEW: State for user profile dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null); // Ref for dropdown container

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ BRAND UPDATE: Consistent "KyuuKhoonn" branding in menu titles
  const menuConfig = {
    donor: {
      title: "KyuuKhoonn Donor Portal", // ✅ Branding Updated
      subtitle: "Be a Hero, Save Lives", // ✅ Keep this tagline
      shortTitle: "Donor",
      icon: User,
      items: [
        { path: "/donor", label: "Dashboard", icon: BarChart3 },
        { path: "/donor/profile", label: "My Profile", icon: User },
        { path: "/donor/history", label: "History", icon: History },
        { path: "/donor/camps", label: "Blood Camps", icon: Calendar },
        { path: "/donor/live-map", label: "Live Map", icon: Map },
      ],
    },
    hospital: {
      title: "KyuuKhoonn Hospital Management", // ✅ Branding Updated
      subtitle: "Blood Request & Inventory", // ✅ Keep this tagline
      shortTitle: "Hospital",
      icon: Building,
      items: [
        { path: "/hospital", label: "Dashboard", icon: BarChart3 },
        { path: "/hospital/request-blood", label: "Request", icon: ClipboardPlus },
        { path: "/hospital/blood-requests", label: "Requests", icon: ClipboardList },
        { path: "/hospital/inventory", label: "Inventory", icon: Droplet },
        { path: "/hospital/donors", label: "Donors", icon: User },
        { path: "/hospital/live-donors", label: "Live Donors", icon: Map },
      ],
    },
    blood_lab: {
      title: "KyuuKhoonn Lab Center", // ✅ Branding Updated
      subtitle: "Testing & Quality Control", // ✅ Keep this tagline
      shortTitle: "Lab",
      icon: TestTube,
      items: [
        { path: "/lab", label: "Dashboard", icon: BarChart3 },
        { path: "/lab/inventory", label: "Inventory", icon: Droplet },
        { path: "/lab/donor", label: "Donors", icon: User },
        { path: "/lab/camps", label: "Camps", icon: Calendar },
        { path: "/lab/requests", label: "Requests", icon: ClipboardList },
        { path: "/lab/profile", label: "Profile", icon: CheckCircle },
        { path: "/lab/live-donors", label: "Live Donors", icon: Map },
      ],
    },
    admin: {
      title: "KyuuKhoonn Admin Panel", // ✅ Branding Updated
      subtitle: "System Administration", // ✅ Keep this tagline
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
    title: "KyuuKhoonn Dashboard", // ✅ Branding Updated
    subtitle: "Welcome to KyuuKhoonn", // ✅ Branding Updated
    shortTitle: "App",
    icon: BarChart3,
    items: [],
  };

  // ✅ NEW: Toggle function for dropdown
  const toggleDropdown = (open = undefined) => {
    setIsDropdownOpen(prev => open !== undefined ? open : !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ✅ NEW: Function to handle avatar change
  const handleChangeAvatar = () => {
    // Close the dropdown
    toggleDropdown(false);
    // Trigger avatar change logic (e.g., open modal, file picker)
    alert("Avatar change feature will open camera/gallery modal");
    // Example: openModal('avatarUpload');
    // Example: triggerFilePicker();
  };

  // ✅ FIX: Prevent base routes (e.g., "/donor") from matching sub-routes (e.g., "/donor/profile")
  const isPathActive = (targetPath) => {
    if (location.pathname === targetPath) return true;
    if (location.pathname === targetPath + "/") return true;
    
    const remainder = location.pathname.slice(targetPath.length);
    const isBaseRoute = targetPath.split("/").length === 2; // e.g., "/donor", "/hospital"
    
    if (isBaseRoute) return false; // Base routes should ONLY match exactly
    
    return remainder.startsWith("/"); // Allow sub-routes for deeper paths like "/admin/facilities/123"
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
      <header className="flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 shrink-0">
              <ClipboardPlus size={20} className="text-primary" />
            </div>
            <div className="hidden sm:block">
              {/* ✅ Use consistent branding from config */}
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
          {/* ✅ REPLACED: Old user profile div with the new dropdown component */}
          <UserProfileDropdown
            userData={userData}
            onLogout={handleLogout}
            onChangeAvatar={handleChangeAvatar}
            isOpen={isDropdownOpen}
            toggleOpen={toggleDropdown}
            dropdownRef={dropdownRef}
          />
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 relative">
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 ${
            sidebarCollapsed ? "w-16" : "w-64"
          } bg-card border-r border-border transition-all duration-300 flex flex-col`}>
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
                // ✅ UPDATED: Use the safe helper function
                const isActive = isPathActive(item.path);
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
                {/* ✅ Final confirmation of branding in sidebar footer */}
                <p className="text-sm font-semibold text-foreground">KyuuKhoonn</p>
                <p className="text-xs mt-1 text-muted-foreground">Save Lives, Donate Blood</p>
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 min-h-[calc(100vh-64px)] pb-20 lg:pb-0">
          <div className="h-full overflow-auto p-4 sm:p-6">
            <Outlet context={{ userData }} />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16">
          {config.items.slice(0, 4).map((item) => {
            const Icon = item.icon;
            // ✅ UPDATED: Use the safe helper function
            const isActive = isPathActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`p-1 rounded-full transition-colors ${isActive ? "bg-primary/10" : ""}`}>
                  <Icon size={22} className={isActive ? "fill-current/10" : ""} />
                </div>
                <span className="text-[10px] mt-1 font-medium truncate max-w-[70px] text-center leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {config.items.length > 4 && (
            <button
              onClick={() => setSidebarOpen(true)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all active:scale-95 ${
                sidebarOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`p-1 rounded-full transition-colors ${sidebarOpen ? "bg-primary/10" : ""}`}>
                <Menu size={22} />
              </div>
              <span className="text-[10px] mt-1 font-medium">More</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;