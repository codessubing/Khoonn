import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // 1. If no token or no role is found, they aren't actually logged in
    if (!token || !role) {
      navigate("/login", { replace: true });
      return;
    }

    // 2. Normalize role to lowercase to prevent case-sensitivity bugs
    const normalizedRole = role.toLowerCase();

    // 3. Redirect to the appropriate role-specific dashboard
    switch (normalizedRole) {
      case "donor":
        navigate("/donor", { replace: true });
        break;
      case "hospital":
        navigate("/hospital", { replace: true });
        break;
      case "blood_lab":
      case "blood-lab":
        navigate("/lab", { replace: true });
        break;
      case "admin":
        navigate("/admin", { replace: true });
        break;
      default:
        // Fallback: If an unrecognized role is in localStorage, clear it and log out
        console.warn("Unknown role detected in localStorage:", role);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Loading Spinner */}
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
};

export default UserDashboard;