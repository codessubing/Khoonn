import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import {
  MapPin,
  Calendar,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Heart,
  Search,
  Users,
  Building2,
  ListPlus,
  AlertCircle,
} from "lucide-react";

// ✅ FIX: Use the full base URL to prevent double /api/ issues or wrong port hits
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_OPTIONS = [
  { value: "all", label: "All Camps" },
  { value: "Upcoming", label: "Upcoming" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

const CampCard = ({ camp }) => {
  const isCompleted = camp.status === "Completed";
  const isCancelled = camp.status === "Cancelled";
  const isUpcoming = camp.status === "Upcoming";

  const statusConfig = {
    Upcoming: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    Ongoing: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    Completed: "bg-muted text-muted-foreground border-border",
    Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const statusClass = statusConfig[camp.status] || statusConfig.Upcoming;

  const campDate = new Date(camp.date);
  const dateStr = campDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  
  const timeStr = `${camp.time?.start || "N/A"} - ${camp.time?.end || "N/A"}`;
  
  const expectedDonors = camp.expectedDonors || 0;
  const actualDonors = camp.actualDonors || 0; 
  
  const slotsAvailable = expectedDonors > 0 ? expectedDonors - actualDonors : 0;
  const isFull = slotsAvailable <= 0 && expectedDonors > 0 && !isCompleted && !isCancelled;

  // ✅ FIX: Safely destructure location to prevent crashes if it's missing
  const location = camp.location || {};
  const locationStr = `${location.venue || "Venue TBA"}, ${location.city || "City TBA"}, ${location.state || "State TBA"}`;
  const hospitalName = camp.hospital?.name || "Associated Facility";

  const renderDonorCapacity = () => {
    if (isUpcoming) {
      return <span className="text-foreground">{expectedDonors} Expected Donors</span>;
    } 
    return (
      <span className="text-foreground">
        {actualDonors} Achieved / {expectedDonors} Expected
      </span>
    );
  };

  return (
    <div className={`bg-card border rounded-xl p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col h-full ${
      isCancelled ? "border-destructive/20 opacity-70" : "border-border"
    }`}>
      {/* Header with status badge */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        <h4 className={`text-base font-semibold leading-tight flex-1 ${
          isCancelled ? "text-muted-foreground" : "text-foreground"
        }`}>
          {camp.title}
        </h4>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${statusClass}`}>
          {camp.status}
        </span>
      </div>
      
      {/* Hospital/Facility Name */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 font-medium">
        <Building2 className="w-4 h-4 text-primary shrink-0" />
        <span className="truncate">{hospitalName}</span>
      </div>

      {/* Primary Camp details */}
      <div className="space-y-3 text-sm text-muted-foreground mb-4 flex-1">
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="leading-relaxed line-clamp-2">{locationStr}</span>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Donor Metrics Summary */}
      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-foreground">Capacity:</span>
          {renderDonorCapacity()}
        </div>
        
        {!isCompleted && !isCancelled && (
          <div className="flex items-center gap-2 text-sm">
            <ListPlus className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium text-foreground">Remaining Need:</span>
            <span className={`font-semibold ${isFull ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
              {isFull ? "Full" : `${slotsAvailable} slots`}
            </span>
          </div>
        )}
        
        <div className="pt-3 border-t border-border">
          <h5 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-2">
            <Droplet className="w-3.5 h-3.5 text-primary" /> Description
          </h5>
          <p className="text-sm text-muted-foreground italic line-clamp-3">
            {camp.description || "No detailed description provided for this camp."}
          </p>
        </div>
      </div>
    </div>
  );
};

export const DonorCampsList = () => {
  const [filter, setFilter] = useState("Upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
    currentPage: 1,
  });

  const fetchCamps = useCallback(async () => {
    const token = localStorage.getItem("token"); 
    if (!token) {
      setError("Authentication required. Please log in to view camps.");
      toast.error("Authentication token missing.");
      setCamps([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const statusParam = filter === "all" ? "" : filter;
      const params = new URLSearchParams({
        ...(statusParam && { status: statusParam }),
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { q: searchTerm }),
      }).toString();
      
      // ✅ FIX: Uses the correct absolute URL
      const apiUrl = `${API_BASE_URL}/donor/camps?${params}`;
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ FIX: Safely extract data whether it's nested or flat
      const responseData = response.data.data || response.data;
      
      if (responseData && (responseData.camps || Array.isArray(responseData))) {
        const campsArray = responseData.camps || responseData;
        setCamps(campsArray);
        setPagination(prev => ({ 
          ...prev, 
          total: responseData.pagination?.total || campsArray.length,
          totalPages: responseData.pagination?.totalPages || 1,
          currentPage: responseData.pagination?.currentPage || 1
        }));
      } else {
        throw new Error("Invalid response structure received from server.");
      }
      
    } catch (err) {
      console.error("Fetch Camps Error:", err);
      let message = err.response?.data?.message || err.message || "Failed to fetch camps.";
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        message = "Authentication failed or unauthorized. Please log in again.";
        localStorage.removeItem("token"); // Clear invalid token
      }
      
      toast.error(message);
      setError(message);
      setCamps([]);
      setPagination(prev => ({ ...prev, total: 0, totalPages: 1, currentPage: 1 }));
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  const displayedCamps = camps;

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const totalPages = useMemo(() => pagination.totalPages, [pagination.totalPages]);
  const currentPage = useMemo(() => pagination.currentPage, [pagination.currentPage]);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <Toaster />
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Blood Donation Camps
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Find local opportunities to donate blood and save lives.
              </p>
            </div>
          </div>
        </div>
        
        {/* Controls and Filtering */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search camps, locations, hospital name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-[var(--radius)] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/15"
                />
              </div>

              <div className="flex items-center gap-2 min-w-[180px]">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <select
                  value={filter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-[var(--radius)] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/15"
                  disabled={loading}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => fetchCamps()}
              disabled={loading}
              className="btn-ghost flex items-center justify-center gap-2 min-w-[120px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Results Summary */}
        {!loading && camps.length > 0 && (
          <div className="px-1">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{displayedCamps.length}</span> camps
              {searchTerm && (
                <span> matching "<span className="font-medium text-foreground">{searchTerm}</span>"</span>
              )}
              . Total found: <span className="font-medium text-foreground">{pagination.total}</span>.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center p-12 bg-card border border-border rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground font-medium">Loading camps...</p>
            <p className="text-sm text-muted-foreground mt-1">Finding the best donation opportunities for you</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && camps.length === 0 && (
          <div className="text-center p-8 sm:p-12 bg-destructive/5 rounded-xl border border-destructive/20">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-destructive font-semibold mb-2">Unable to Load Camps</p>
            <p className="text-sm text-destructive/80 mb-6 max-w-md mx-auto">{error}</p>
            <button onClick={() => fetchCamps()} className="btn-advanced">
              Try Again
            </button>
          </div>
        )}

        {/* Camp List */}
        {!loading && displayedCamps.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayedCamps.map((camp) => (
                <CampCard key={camp._id || camp.id} camp={camp} />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 bg-card border border-border rounded-xl p-4 mt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-sm font-medium text-foreground min-w-[100px] text-center">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" /> 
                </button>
              </div>
              
              <span className="text-sm text-muted-foreground">
                {pagination.total} Total Camps • {pagination.limit} per page
              </span>
            </div>
          </>
        )}

        {/* No Search/Filter Results State */}
        {!loading && displayedCamps.length === 0 && !error && (
          <div className="text-center p-8 sm:p-12 bg-card border border-border rounded-xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground/50">
              <Droplet className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm ? "No Matching Camps Found" : "No Camps Available"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              {searchTerm 
                ? `No camps found matching "${searchTerm}" with the current filter.`
                : "There are no camps matching the current filter. Try adjusting your filter."
              }
            </p>
            {(searchTerm || filter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="btn-advanced"
              >
                Show All Camps
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorCampsList;