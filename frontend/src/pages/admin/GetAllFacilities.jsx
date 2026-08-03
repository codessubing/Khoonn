import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Hospital, Mail, Phone, MapPin, RefreshCw, CheckCircle, XCircle, Clock,
  Users, Search, ChevronDown, ChevronUp, Tag, Briefcase, Shield,
  AlertTriangle, Building2,
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

function GetAllFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    facilityType: "all",
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  const token = localStorage.getItem("token");
  // ✅ FIXED: Uses dynamic API_BASE_URL instead of VITE_API_URL
  const API_URL = `${API_BASE_URL}/api/admin`;
  const facilityTypes = ["hospital", "blood-lab"];
  const statuses = ["pending", "approved", "rejected"];

  const fetchAllFacilities = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_URL}/facilities`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // ✅ ENHANCED: Handle auth failures explicitly
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch facilities: ${res.status}`);
      }

      const data = await res.json();
      setFacilities(data.facilities || []);

      if (showToast) {
        toast.success(`Loaded ${data.facilities?.length || 0} facilities`);
      }
    } catch (error) {
      console.error("Fetch facilities error:", error);
      toast.error(error.message || "Failed to load facility data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllFacilities();
  }, []);

  const filteredFacilities = facilities
    .filter((facility) => {
      const matchesSearch =
        !filters.search ||
        facility.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        facility.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        facility.registrationNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        facility.phone?.includes(filters.search);

      const matchesType =
        filters.facilityType === "all" || facility.facilityType === filters.facilityType;

      const matchesStatus =
        filters.status === "all" || facility.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case "name":
          aValue = a.name?.toLowerCase();
          bValue = b.name?.toLowerCase();
          break;
        case "status":
          aValue = a.status?.toLowerCase();
          bValue = b.status?.toLowerCase();
          break;
        case "type":
          aValue = a.facilityType?.toLowerCase();
          bValue = b.facilityType?.toLowerCase();
          break;
        default:
          aValue = a.name?.toLowerCase();
          bValue = b.name?.toLowerCase();
      }

      if (filters.sortOrder === "desc") {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: {
        color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
        icon: <CheckCircle size={12} />,
        label: "Approved",
      },
      rejected: {
        color: "bg-destructive/10 text-destructive border-destructive/20",
        icon: <XCircle size={12} />,
        label: "Rejected",
      },
      pending: {
        color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        icon: <Clock size={12} />,
        label: "Pending Review",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeDisplay = type.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
    const isHospital = type === "hospital";
    const colorClass = isHospital
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      : "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
        <Building2 size={10} />
        {typeDisplay}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading Facility Database...</p>
        </div>
      </div>
    );
  }

  const approvedCount = facilities.filter((f) => f.status === "approved").length;
  const pendingCount = facilities.filter((f) => f.status === "pending").length;
  const rejectedCount = facilities.filter((f) => f.status === "rejected").length;
  const hospitalCount = facilities.filter((f) => f.facilityType === "hospital").length;
  const labCount = facilities.filter((f) => f.facilityType === "blood-lab").length;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Hospital className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Medical Facilities
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and view all registered hospitals and blood laboratories
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchAllFacilities(true)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Stats Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold tracking-tight text-foreground">{facilities.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Facilities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">{approvedCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{pendingCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold tracking-tight text-destructive">{rejectedCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {hospitalCount}H {labCount}L
              </div>
              <div className="text-sm text-muted-foreground mt-1">Hospitals & Labs</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or reg number..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="input-minimal pl-9"
              />
            </div>

            <select
              value={filters.facilityType}
              onChange={(e) => setFilters((prev) => ({ ...prev, facilityType: e.target.value }))}
              className="input-minimal w-full lg:w-auto min-w-[140px]"
            >
              <option value="all">All Types</option>
              {facilityTypes.map((type) => (
                <option key={type} value={type}>
                  {type.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="input-minimal w-full lg:w-auto min-w-[140px]"
            >
              <option value="all">All Status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="input-minimal w-full lg:w-auto min-w-[140px]"
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="type">Sort by Type</option>
            </select>

            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
                }))
              }
              className="input-minimal flex items-center justify-center w-full lg:w-auto px-4 hover:bg-muted/80 transition-colors"
              title="Toggle Sort Order"
            >
              {filters.sortOrder === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center px-1">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredFacilities.length}</span> of{" "}
            <span className="font-medium text-foreground">{facilities.length}</span> facilities
          </p>
          {filters.search && (
            <button 
              onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              className="text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Alert for pending facilities */}
        {pendingCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  {pendingCount} Facility Approval{pendingCount !== 1 ? "s" : ""} Pending
                </p>
                <p className="text-amber-700/80 dark:text-amber-400/80 text-sm">
                  {pendingCount} medical facility{pendingCount !== 1 ? "s" : ""} awaiting administrative review and approval
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Facility Grid */}
        {filteredFacilities.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Hospital className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {facilities.length === 0 ? "No Facilities Found" : "No Matching Facilities"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {facilities.length === 0
                ? "The medical facility database is currently empty."
                : "No facilities match your current search criteria."}
            </p>
            {filters.search && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Clear search filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredFacilities.map((facility) => (
              <div
                key={facility._id}
                className="bg-card border border-border rounded-xl p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group flex flex-col"
              >
                {/* Header with Name and Badges */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-border">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {facility.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {facility.email}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    {getStatusBadge(facility.status)}
                    {getTypeBadge(facility.facilityType)}
                  </div>
                </div>

                {/* Facility Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 text-sm">
                    <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground font-medium">
                      Reg: {facility.registrationNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">
                      {facility.phone || "Not provided"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground capitalize">
                      {facility.facilityCategory || "General"}
                    </span>
                  </div>

                  {/* Operational Status */}
                  <div className="flex items-center gap-3 text-sm">
                    <Clock
                      className={`w-4 h-4 shrink-0 ${
                        facility.is24x7 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-foreground font-medium">
                      {facility.is24x7
                        ? "24/7 Service Available"
                        : `Hours: ${facility.operatingHours?.open || "N/A"} - ${facility.operatingHours?.close || "N/A"}`}
                    </span>
                  </div>

                  {facility.emergencyServices && (
                    <div className="flex items-center gap-3 text-sm">
                      <Shield className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-primary font-medium">
                        Emergency Services
                      </span>
                    </div>
                  )}

                  {/* Address */}
                  <div className="flex items-start gap-3 text-sm pt-3 border-t border-border mt-3">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-foreground line-clamp-2">
                      {facility.address?.street && `${facility.address.street}, `}
                      {facility.address?.city}, {facility.address?.state}
                      {facility.address?.pincode && ` - ${facility.address.pincode}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GetAllFacilities;