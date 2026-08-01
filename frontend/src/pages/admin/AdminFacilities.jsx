import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Download,
  Eye,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const AdminFacilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const token = localStorage.getItem("token");
  const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin`;

  const fetchPendingFacilities = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_URL}/facilities`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch facilities: ${res.status}`);
      }

      const data = await res.json();
      const pendingFacilities = data.facilities?.filter((f) => f.status === "pending") || [];
      setFacilities(pendingFacilities);

      if (showToast) {
        toast.success(`Found ${pendingFacilities.length} pending facilities`);
      }
    } catch (error) {
      console.error("Fetch facilities error:", error);
      toast.error("Failed to load facilities. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingFacilities();
  }, []);

  const handleApprove = async (facilityId) => {
    if (!facilityId) {
      toast.error("Invalid facility ID");
      return;
    }

    setActionLoading(facilityId);
    try {
      const res = await fetch(`${API_URL}/facility/approve/${facilityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.message) {
        toast.success("Facility approved successfully!");
        setFacilities((prev) => prev.filter((f) => f._id !== facilityId));
        setSelectedFacility(null);
      } else {
        throw new Error(data.message || "Approval failed");
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast.error(error.message || "Error approving facility");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (facilityId) => {
    if (!facilityId) {
      toast.error("Invalid facility ID");
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setActionLoading(facilityId);
    try {
      const res = await fetch(`${API_URL}/facility/reject/${facilityId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectionReason }),
      });

      const data = await res.json();

      if (res.ok && data.message) {
        toast.success("Facility rejected successfully!");
        setFacilities((prev) => prev.filter((f) => f._id !== facilityId));
        setSelectedFacility(null);
        setRejectionReason("");
      } else {
        throw new Error(data.message || "Rejection failed");
      }
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error(error.message || "Error rejecting facility");
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ FIX: Removed unused 'filename' parameter
  const handleViewDocument = (documentUrl) => {
    if (!documentUrl) {
      toast.error("Document not available");
      return;
    }
    window.open(documentUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadDocument = (documentUrl, filename = "document") => {
    if (!documentUrl) {
      toast.error("Document not available for download");
      return;
    }
    const link = document.createElement("a");
    link.href = documentUrl;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        icon: Clock,
        label: "Pending Review",
      },
      approved: {
        color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
        icon: CheckCircle,
        label: "Approved",
      },
      rejected: {
        color: "bg-destructive/10 text-destructive border-destructive/20",
        icon: XCircle,
        label: "Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const getFacilityTypeBadge = (type) => {
    const isHospital = type === "Hospital";
    const colorClass = isHospital
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      : "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
        <Building size={12} />
        {type || "Facility"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading Facility Approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              Facility Verification
            </h1>
            <p className="text-sm text-muted-foreground mt-2 ml-1">
              Review and verify hospital and blood lab registration requests
            </p>
          </div>

          <button
            onClick={() => fetchPendingFacilities(true)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Stats Card */}
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {facilities.length} Facility{facilities.length !== 1 ? "s" : ""} Pending Verification
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Facilities awaiting admin approval to access the system
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Facilities List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Pending Requests ({facilities.length})
            </h2>

            {facilities.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">All Caught Up!</h3>
                <p className="text-sm text-muted-foreground">No pending facility requests to review.</p>
              </div>
            ) : (
              facilities.map((facility) => (
                <div
                  key={facility._id}
                  className={`bg-card border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                    selectedFacility?._id === facility._id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedFacility(facility)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {facility.name}
                        </h3>
                        {getFacilityTypeBadge(facility.facilityType)}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                        <Mail size={14} className="shrink-0" />
                        <span className="truncate">{facility.email}</span>
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Phone size={14} className="shrink-0" />
                        {facility.phone || "No phone provided"}
                      </p>
                    </div>
                    <div className="shrink-0 ml-3">
                      {getStatusBadge(facility.status)}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <p className="flex items-start gap-1.5">
                      <MapPin size={14} className="shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {facility.address?.street || "Address not provided"}, {facility.address?.city}, {facility.address?.state} - {facility.address?.pincode}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <FileText size={14} className="shrink-0" />
                      Reg: {facility.registrationNumber || "Not provided"}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Calendar size={14} className="shrink-0" />
                      Registered: {new Date(facility.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {facility.documents?.registrationProof && (
                    <div className="mt-4 flex gap-2">
                      {/* ✅ FIX: Updated onClick to only pass the URL */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDocument(facility.documents.registrationProof.url);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 hover:text-foreground transition-colors border border-border"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadDocument(
                            facility.documents.registrationProof.url,
                            facility.documents.registrationProof.filename
                          );
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                      >
                        <Download size={14} />
                        Download
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Facility Details & Actions */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            {selectedFacility ? (
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Review Facility
                </h2>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Facility Name</label>
                      <p className="text-sm font-semibold text-foreground">{selectedFacility.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                      {getFacilityTypeBadge(selectedFacility.facilityType)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                    <p className="text-sm text-foreground">{selectedFacility.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                      <p className="text-sm text-foreground">{selectedFacility.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Emergency Contact</label>
                      <p className="text-sm text-foreground">{selectedFacility.emergencyContact || "Not provided"}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
                    <p className="text-sm text-foreground">
                      {selectedFacility.address?.street || "Street not provided"}, {selectedFacility.address?.city}
                      <br />
                      {selectedFacility.address?.state} - {selectedFacility.address?.pincode}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Registration Number</label>
                      <p className="text-sm font-mono text-foreground">{selectedFacility.registrationNumber || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
                      <p className="text-sm text-foreground capitalize">{selectedFacility.facilityCategory || "Not specified"}</p>
                    </div>
                  </div>

                  {selectedFacility.operatingHours && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Operating Hours</label>
                      <p className="text-sm text-foreground">
                        {selectedFacility.operatingHours.open} - {selectedFacility.operatingHours.close}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedFacility.operatingHours.workingDays?.join(", ") || "Not specified"}
                        {selectedFacility.is24x7 && " • 24/7 Service"}
                      </p>
                    </div>
                  )}

                  {selectedFacility.emergencyServices && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm font-medium text-primary flex items-center gap-2">
                        <Shield size={14} />
                        Emergency Services Available
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-border space-y-4">
                  <button
                    onClick={() => handleApprove(selectedFacility._id)}
                    disabled={actionLoading === selectedFacility._id}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === selectedFacility._id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    {actionLoading === selectedFacility._id ? "Approving..." : "Approve Facility"}
                  </button>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Rejection Reason <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide specific reason for rejection. This will be communicated to the facility..."
                      className="input-minimal resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => handleReject(selectedFacility._id)}
                      disabled={actionLoading === selectedFacility._id || !rejectionReason.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === selectedFacility._id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle size={18} />
                      )}
                      {actionLoading === selectedFacility._id ? "Rejecting..." : "Reject Facility"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                <Building className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-base font-semibold text-foreground mb-2">Select a Facility</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Click on any facility from the list to review details and take action.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFacilities;