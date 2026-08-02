import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    
    if (!role) {
      navigate("/login", { replace: true });
      return;
    }

    // Redirect to role-specific dashboard
    switch (role.toLowerCase()) {
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
        navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
    </div>
  );
};

export default UserDashboard;