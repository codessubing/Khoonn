import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  User, Heart, Calendar, Phone, Mail, MapPin, RefreshCw, CheckCircle,
  XCircle, Clock, Droplet, Weight, Users, Search, ChevronDown, ChevronUp,
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

function GetAllDonors() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    bloodGroup: "all",
    eligibility: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  const token = localStorage.getItem("token");
  // ✅ FIXED: Uses dynamic API_BASE_URL instead of VITE_API_URL
  const API_URL = `${API_BASE_URL}/api/admin`;
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const fetchAllDonors = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const res = await fetch(`${API_URL}/donors`, {
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
        throw new Error(`Failed to fetch donors: ${res.status}`);
      }

      const data = await res.json();
      setDonors(data.donors || []);

      if (showToast) {
        toast.success(`Loaded ${data.donors?.length || 0} donors`);
      }
    } catch (error) {
      console.error("Fetch donors error:", error);
      toast.error(error.message || "Failed to load donor data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllDonors();
  }, []);

  const filteredDonors = donors
    .filter((donor) => {
      const matchesSearch =
        !filters.search ||
        donor.fullName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        donor.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        donor.phone?.includes(filters.search);

      const matchesBloodGroup =
        filters.bloodGroup === "all" || donor.bloodGroup === filters.bloodGroup;

      const matchesEligibility =
        filters.eligibility === "all" ||
        (filters.eligibility === "eligible" && donor.eligibleToDonate) ||
        (filters.eligibility === "ineligible" && !donor.eligibleToDonate);

      return matchesSearch && matchesBloodGroup && matchesEligibility;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case "name":
          aValue = a.fullName?.toLowerCase();
          bValue = b.fullName?.toLowerCase();
          break;
        case "donations":
          aValue = a.donationHistory?.length || 0;
          bValue = b.donationHistory?.length || 0;
          break;
        case "age":
          aValue = a.age || 0;
          bValue = b.age || 0;
          break;
        default:
          aValue = a.fullName?.toLowerCase();
          bValue = b.fullName?.toLowerCase();
      }

      if (filters.sortOrder === "desc") {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

  const getEligibilityBadge = (isEligible) => {
    if (isEligible === undefined) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-muted text-muted-foreground border-border">
          <Clock size={12} /> Unknown
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          isEligible
            ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
            : "bg-destructive/10 text-destructive border-destructive/20"
        }`}
      >
        {isEligible ? <CheckCircle size={12} /> : <XCircle size={12} />}
        {isEligible ? "Eligible" : "Ineligible"}
      </span>
    );
  };

  const getBloodGroupBadge = (bloodGroup) => {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border-primary/20">
        <Droplet size={10} />
        {bloodGroup}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading Donor Database...</p>
        </div>
      </div>
    );
  }

  const eligibleCount = donors.filter((d) => d.eligibleToDonate).length;
  const ineligibleCount = donors.filter((d) => !d.eligibleToDonate).length;
  const totalDonations = donors.reduce(
    (sum, donor) => sum + (donor.donationHistory?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Blood Donors
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and view all registered blood donors in the system
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchAllDonors(true)}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Stats Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold tracking-tight text-foreground">{donors.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Donors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold tracking-tight text-green-600 dark:text-green-400">{eligibleCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Eligible</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold tracking-tight text-destructive">{ineligibleCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Ineligible</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{totalDonations}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Donations</div>
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
                placeholder="Search by name, email, or phone..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="input-minimal pl-9"
              />
            </div>

            <select
              value={filters.bloodGroup}
              onChange={(e) => setFilters((prev) => ({ ...prev, bloodGroup: e.target.value }))}
              className="input-minimal w-full lg:w-auto min-w-[140px]"
            >
              <option value="all">All Blood Types</option>
              {bloodGroups.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>

            <select
              value={filters.eligibility}
              onChange={(e) => setFilters((prev) => ({ ...prev, eligibility: e.target.value }))}
              className="input-minimal w-full lg:w-auto min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="eligible">Eligible Only</option>
              <option value="ineligible">Ineligible Only</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="input-minimal w-full lg:w-auto min-w-[140px]"
            >
              <option value="name">Sort by Name</option>
              <option value="donations">Sort by Donations</option>
              <option value="age">Sort by Age</option>
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
            Showing <span className="font-medium text-foreground">{filteredDonors.length}</span> of{" "}
            <span className="font-medium text-foreground">{donors.length}</span> donors
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

        {/* Donor Grid */}
        {filteredDonors.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {donors.length === 0 ? "No Donors Found" : "No Matching Donors"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {donors.length === 0
                ? "The blood donor database is currently empty."
                : "No donors match your current filters. Try adjusting your search criteria."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredDonors.map((donor) => (
              <div
                key={donor._id}
                className="bg-card border border-border rounded-xl p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group flex flex-col"
              >
                {/* Header with Name and Badges */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-border">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {donor.fullName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{donor.email}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    {getEligibilityBadge(donor.eligibleToDonate)}
                    {getBloodGroupBadge(donor.bloodGroup)}
                  </div>
                </div>

                {/* Donor Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{donor.phone || "Not provided"}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{donor.age || "N/A"} years old</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Weight className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{donor.weight || "N/A"} kg</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Heart className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">
                      {donor.donationHistory?.length || 0} donation
                      {(donor.donationHistory?.length || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3 text-sm pt-3 border-t border-border mt-3">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-foreground line-clamp-2">
                      {donor.address?.street && `${donor.address.street}, `}
                      {donor.address?.city}, {donor.address?.state}
                      {donor.address?.pincode && ` - ${donor.address.pincode}`}
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

export default GetAllDonors;