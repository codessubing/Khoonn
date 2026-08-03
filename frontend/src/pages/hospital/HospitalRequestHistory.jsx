import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Added for navigation
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  CheckCircle, XCircle, Clock, MapPin, Calendar, Loader2, Plus 
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const HospitalRequestHistory = () => {
  const navigate = useNavigate(); // ✅ Initialize navigate hook
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: Uses dynamic API_BASE_URL instead of relative paths
  const API_URL = `${API_BASE_URL}/api/hospital`;

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        // ✅ FIXED: Absolute URL pointing to Render backend
        const res = await axios.get(`${API_URL}/blood/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setRequests(res.data.data || []);
      } catch (err) {
        console.error("Load history error:", err);
        toast.error(err.response?.data?.message || "Failed to load request history");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const getStatusConfig = (status) => {
    const config = {
      pending: { 
        color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", 
        icon: Clock, 
        label: "Pending" 
      },
      accepted: { 
        color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", 
        icon: CheckCircle, 
        label: "Accepted" 
      },
      rejected: { 
        color: "bg-destructive/10 text-destructive border-destructive/20", 
        icon: XCircle, 
        label: "Rejected" 
      }
    };
    return config[status] || config.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === "pending").length;
  const acceptedRequests = requests.filter(r => r.status === "accepted").length;
  const rejectedRequests = requests.filter(r => r.status === "rejected").length;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Request History
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your blood request status and history
              </p>
            </div>
          </div>
          
          {/* ✅ ADDED: Quick action to create new request from history page */}
          <button 
            onClick={() => navigate('/hospital/request-blood')}
            className="btn-advanced flex items-center gap-2"
          >
            <Plus size={16} />
            New Request
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total Requests</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{totalRequests}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{pendingRequests}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Accepted</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{acceptedRequests}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Rejected</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{rejectedRequests}</div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No request history</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your blood requests will appear here once you make them.
              </p>
              
              {/* ✅ UPDATED: Button to navigate to request form when empty */}
              <button 
                onClick={() => navigate('/hospital/request-blood')} 
                className="btn-advanced inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Create First Request
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blood Lab</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blood Type</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Units</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Date</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Processed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((request) => {
                    const statusConfig = getStatusConfig(request.status);
                    const IconComponent = statusConfig.icon;

                    return (
                      <tr key={request._id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <span className="font-semibold text-primary text-sm">
                                {request.labId?.name?.charAt(0) || "L"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {request.labId?.name || "Unknown Lab"}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin size={12} className="shrink-0" />
                                <span className="truncate">{request.labId?.address?.city || "Unknown City"}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                            {request.bloodType}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-base font-semibold text-foreground">{request.units}</span>
                          <span className="text-xs text-muted-foreground ml-1">units</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${statusConfig.color}`}>
                            <IconComponent size={12} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-foreground">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="p-4">
                          {request.processedAt ? (
                            <>
                              <div className="text-sm text-foreground">
                                {new Date(request.processedAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {new Date(request.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalRequestHistory;