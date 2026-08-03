import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  CheckCircle, XCircle, Clock, MapPin, Loader2 
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const LabManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: Uses dynamic API_BASE_URL instead of relative paths
  const API_URL = `${API_BASE_URL}/api/blood-lab`;

  const loadRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // ✅ FIXED: Absolute URL pointing to Render backend
      const res = await axios.get(`${API_URL}/blood/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Load requests error:", err);
      toast.error(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateStatus = async (id, action) => {
    try {
      const token = localStorage.getItem("token");
      // ✅ FIXED: Absolute URL pointing to Render backend
      await axios.put(
        `${API_URL}/blood/requests/${id}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Request ${action}ed successfully`);
      loadRequests(); // Refresh the list
    } catch (err) {
      console.error("Update status error:", err);
      toast.error(err.response?.data?.message || "Failed to update request");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", 
        icon: Clock 
      },
      accepted: { 
        color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", 
        icon: CheckCircle 
      },
      rejected: { 
        color: "bg-destructive/10 text-destructive border-destructive/20", 
        icon: XCircle 
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${config.color}`}>
        <IconComponent size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const acceptedCount = requests.filter(r => r.status === "accepted").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Blood Requests
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage blood requests from hospitals
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total Requests</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{requests.length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{pendingCount}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Accepted</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{acceptedCount}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Rejected</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{rejectedCount}</div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No blood requests</h3>
              <p className="text-sm text-muted-foreground">When hospitals request blood, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hospital</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blood Type</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Units</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <span className="font-semibold text-primary text-sm">
                              {req.hospitalId?.name?.charAt(0) || "H"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {req.hospitalId?.name || "Unknown Hospital"}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin size={12} className="shrink-0" />
                              <span className="truncate">{req.hospitalId?.address?.city || "Unknown City"}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                          {req.bloodType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-base font-semibold text-foreground">{req.units}</span>
                        <span className="text-xs text-muted-foreground ml-1">units</span>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-foreground">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-4">
                        {req.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatus(req._id, "accept")}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              <CheckCircle size={14} />
                              Accept
                            </button>
                            <button
                              onClick={() => updateStatus(req._id, "reject")}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm font-medium transition-colors"
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Processed on {new Date(req.processedAt || req.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabManageRequests;