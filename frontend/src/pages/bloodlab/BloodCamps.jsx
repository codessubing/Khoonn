import { useEffect, useState } from "react";
import {
  Calendar, Clock, MapPin, Users, Plus, Trash2, Edit3, Search,
  ChevronDown, ChevronUp, Droplet, CheckCircle, XCircle, MoreVertical,
  Loader2, AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const BloodCamps = () => {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCamp, setEditingCamp] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    sortBy: "date",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCamps: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    city: "",
    state: "",
    pincode: "",
    expectedDonors: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);

  const token = localStorage.getItem("token");
  // ✅ FIXED: Uses dynamic API_BASE_URL instead of VITE_API_URL
  const API_URL = `${API_BASE_URL}/api/blood-lab`;

  const calculateStats = (campsData) => ({
    upcoming: campsData.filter((camp) => camp.status === "Upcoming").length,
    ongoing: campsData.filter((camp) => camp.status === "Ongoing").length,
    completed: campsData.filter((camp) => camp.status === "Completed").length,
    cancelled: campsData.filter((camp) => camp.status === "Cancelled").length,
    total: campsData.length,
  });

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.title?.trim()) newErrors.title = "Title is required";
    if (!data.date) newErrors.date = "Date is required";
    if (!data.startTime) newErrors.startTime = "Start time is required";
    if (!data.endTime) newErrors.endTime = "End time is required";
    if (!data.venue?.trim()) newErrors.venue = "Venue is required";
    if (!data.city?.trim()) newErrors.city = "City is required";
    if (!data.state?.trim()) newErrors.state = "State is required";
    if (!data.pincode?.match(/^[1-9][0-9]{5}$/))
      newErrors.pincode = "Valid 6-digit pincode required";
    if (!data.expectedDonors || data.expectedDonors < 1)
      newErrors.expectedDonors = "Expected donors must be at least 1";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(data.date);
    if (selectedDate < today) newErrors.date = "Date cannot be in the past";
    if (data.startTime && data.endTime && data.startTime >= data.endTime)
      newErrors.endTime = "End time must be after start time";

    return newErrors;
  };

  const getInputClass = (fieldName) => {
    const hasError = errors[fieldName];
    return `w-full px-4 py-2.5 bg-background border rounded-[var(--radius)] text-foreground text-sm transition-all focus:outline-none focus:ring-[3px] ${
      hasError
        ? "border-destructive focus:border-destructive focus:ring-destructive/15"
        : "border-input focus:border-ring focus:ring-ring/15"
    }`;
  };

  const fetchCamps = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        status: filters.status,
        page: page.toString(),
        limit: "8",
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search && { search: filters.search }),
      });

      const url = `${API_URL}/camps?${queryParams}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned HTML instead of JSON. Check API endpoint.");
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to fetch camps: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        const campsData = data.data?.camps || data.camps || [];
        setCamps(campsData);
        setPagination(
          data.data?.pagination || data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalCamps: 0,
            hasNext: false,
            hasPrev: false,
          }
        );
        setStats(calculateStats(campsData));
      } else {
        throw new Error(data.message || "Failed to fetch camps");
      }
    } catch (err) {
      console.error("Fetch camps error:", err);
      toast.error(err.message || "Failed to load blood camps");
      setCamps([]);
      setPagination({ currentPage: 1, totalPages: 1, totalCamps: 0, hasNext: false, hasPrev: false });
      setStats({ upcoming: 0, ongoing: 0, completed: 0, cancelled: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateCampStatus = async (campId, newStatus) => {
    try {
      const url = `${API_URL}/camps/${campId}/status`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid server response");
      }

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Camp marked as ${newStatus.toLowerCase()}`);
        setActionMenu(null);
        fetchCamps();
      } else {
        throw new Error(data.message || "Failed to update camp status");
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.message || "Error updating camp status");
    }
  };

  useEffect(() => {
    fetchCamps();
    // Close action menu when clicking outside
    const handleClickOutside = () => setActionMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [filters]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      venue: "",
      city: "",
      state: "",
      pincode: "",
      expectedDonors: "",
    });
    setErrors({});
    setEditingCamp(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formErrors = validateForm(formData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setSubmitting(false);
      return;
    }

    try {
      const url = editingCamp ? `${API_URL}/camps/${editingCamp._id}` : `${API_URL}/camps`;
      const method = editingCamp ? "PUT" : "POST";

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: { start: formData.startTime, end: formData.endTime },
        location: {
          venue: formData.venue.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode,
        },
        expectedDonors: Number(formData.expectedDonors),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid server response");
      }

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Blood Camp ${editingCamp ? "Updated" : "Added"} Successfully!`);
        resetForm();
        setShowForm(false);
        fetchCamps();
      } else {
        throw new Error(data.message || `Failed to ${editingCamp ? "update" : "add"} blood camp`);
      }
    } catch (err) {
      console.error("Form submission error:", err);
      toast.error(err.message || `Error ${editingCamp ? "updating" : "adding"} camp`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (camp) => {
    setEditingCamp(camp);
    setFormData({
      title: camp.title,
      description: camp.description || "",
      date: new Date(camp.date).toISOString().split("T")[0],
      startTime: camp.time.start,
      endTime: camp.time.end,
      venue: camp.location.venue,
      city: camp.location.city,
      state: camp.location.state,
      pincode: camp.location.pincode,
      expectedDonors: camp.expectedDonors.toString(),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteCamp = async (id) => {
    if (!window.confirm("Are you sure you want to delete this camp? This action cannot be undone.")) return;

    try {
      const res = await fetch(`${API_URL}/camps/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Camp deleted successfully!");
        fetchCamps();
      } else {
        throw new Error(data.message || "Failed to delete camp");
      }
    } catch (err) {
      console.error("Delete camp error:", err);
      toast.error(err.message || "Error deleting camp");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      Upcoming: {
        color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
        label: "Upcoming",
        icon: Calendar,
      },
      Ongoing: {
        color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
        label: "Ongoing",
        icon: Clock,
      },
      Completed: {
        color: "bg-muted text-muted-foreground border-border",
        label: "Completed",
        icon: CheckCircle,
      },
      Cancelled: {
        color: "bg-destructive/10 text-destructive border-destructive/20",
        label: "Cancelled",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.Upcoming;
    const IconComponent = config.icon;

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${config.color}`}>
        <IconComponent size={12} />
        {config.label}
      </span>
    );
  };

  const getAvailableActions = (camp) => {
    switch (camp.status) {
      case "Upcoming":
        return [
          { label: "Mark as Ongoing", value: "Ongoing", color: "text-green-600 dark:text-green-400" },
          { label: "Cancel Camp", value: "Cancelled", color: "text-destructive" },
        ];
      case "Ongoing":
        return [
          { label: "Mark as Completed", value: "Completed", color: "text-foreground" },
          { label: "Cancel Camp", value: "Cancelled", color: "text-destructive" },
        ];
      case "Completed":
        return [
          { label: "Re-open as Ongoing", value: "Ongoing", color: "text-green-600 dark:text-green-400" },
          { label: "Mark as Upcoming", value: "Upcoming", color: "text-blue-600 dark:text-blue-400" },
        ];
      case "Cancelled":
        return [
          { label: "Re-schedule as Upcoming", value: "Upcoming", color: "text-blue-600 dark:text-blue-400" },
          { label: "Mark as Ongoing", value: "Ongoing", color: "text-green-600 dark:text-green-400" },
        ];
      default:
        return [
          { label: "Mark as Upcoming", value: "Upcoming", color: "text-blue-600 dark:text-blue-400" },
          { label: "Mark as Ongoing", value: "Ongoing", color: "text-green-600 dark:text-green-400" },
          { label: "Mark as Completed", value: "Completed", color: "text-foreground" },
          { label: "Cancel Camp", value: "Cancelled", color: "text-destructive" },
        ];
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Droplet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Blood Donation Camps
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and organize blood donation camps
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="btn-advanced flex items-center gap-2"
          >
            {showForm ? "Cancel" : (
              <>
                <Plus size={18} />
                Add Camp
              </>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Droplet className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.total}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Upcoming</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.upcoming}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Ongoing</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.ongoing}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-muted">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Completed</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.completed}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Cancelled</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.cancelled}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search camps..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="input-minimal pl-9"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="input-minimal w-full sm:w-auto min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
              className="input-minimal w-full sm:w-auto min-w-[140px]"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="expectedDonors">Sort by Donors</option>
            </select>
            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  sortOrder: prev.sortOrder === "desc" ? "asc" : "desc",
                }))
              }
              className="input-minimal flex items-center justify-center w-full sm:w-auto px-4 hover:bg-muted/80 transition-colors"
              title="Toggle Sort Order"
            >
              {filters.sortOrder === "desc" ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Droplet className="w-5 h-5 text-primary" />
              {editingCamp ? "Edit Blood Camp" : "Add New Blood Camp"}
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Camp Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={getInputClass("title")}
                  placeholder="Enter camp title"
                />
                {errors.title && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.title}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={getInputClass("date")}
                />
                {errors.date && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.date}
                  </p>
                )}
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Start Time <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    className={getInputClass("startTime")}
                  />
                  {errors.startTime && (
                    <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={14} /> {errors.startTime}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    End Time <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    className={getInputClass("endTime")}
                  />
                  {errors.endTime && (
                    <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={14} /> {errors.endTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Venue <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => handleInputChange("venue", e.target.value)}
                  className={getInputClass("venue")}
                  placeholder="Enter venue name"
                />
                {errors.venue && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.venue}
                  </p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  City <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className={getInputClass("city")}
                  placeholder="Enter city"
                />
                {errors.city && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.city}
                  </p>
                )}
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  State <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className={getInputClass("state")}
                  placeholder="Enter state"
                />
                {errors.state && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.state}
                  </p>
                )}
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Pincode <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange("pincode", e.target.value)}
                  className={getInputClass("pincode")}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
                {errors.pincode && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.pincode}
                  </p>
                )}
              </div>

              {/* Expected Donors */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Expected Donors <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.expectedDonors}
                  onChange={(e) => handleInputChange("expectedDonors", e.target.value)}
                  className={getInputClass("expectedDonors")}
                  placeholder="Expected number of donors"
                />
                {errors.expectedDonors && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.expectedDonors}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-[var(--radius)] text-foreground text-sm transition-colors focus:outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/15 resize-none"
                  placeholder="Enter camp description (optional)"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button type="submit" disabled={submitting} className="btn-advanced flex items-center gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingCamp ? "Update Camp" : "Create Camp"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Blood Camps List */}
        {loading ? (
          <div className="flex justify-center items-center py-16 bg-card border border-border rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground font-medium">Loading camps...</span>
          </div>
        ) : camps.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <Droplet size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No blood camps found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              {filters.status !== "all" || filters.search
                ? "Try changing your filters"
                : "Get started by creating your first blood camp"}
            </p>
            {!filters.search && filters.status === "all" && (
              <button onClick={() => setShowForm(true)} className="btn-advanced">
                Create Your First Camp
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {camps.map((camp) => {
                const availableActions = getAvailableActions(camp);

                return (
                  <div
                    key={camp._id}
                    className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-base font-semibold text-foreground line-clamp-2 flex-1 pr-2 group-hover:text-primary transition-colors">
                        {camp.title}
                      </h3>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(camp);
                          }}
                          className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-muted transition-colors"
                          title="Edit camp"
                        >
                          <Edit3 size={16} />
                        </button>
                        {availableActions.length > 0 && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenu(actionMenu === camp._id ? null : camp._id);
                              }}
                              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                              title="More actions"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {actionMenu === camp._id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg py-1 z-20 min-w-48"
                              >
                                {availableActions.map((action) => (
                                  <button
                                    key={action.value}
                                    onClick={() => updateCampStatus(camp._id, action.value)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${action.color}`}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCamp(camp._id);
                          }}
                          className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                          title="Delete camp"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <StatusBadge status={camp.status} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(camp.date).toLocaleDateString()}
                      </span>
                    </div>

                    {camp.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {camp.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-foreground">
                        <Clock size={14} className="mr-2 text-muted-foreground shrink-0" />
                        <span>
                          {camp.time.start} - {camp.time.end}
                        </span>
                      </div>
                      <div className="flex items-start text-foreground">
                        <MapPin size={14} className="mr-2 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {camp.location.venue}, {camp.location.city}, {camp.location.state} - {camp.location.pincode}
                        </span>
                      </div>
                      <div className="flex items-center text-foreground">
                        <Users size={14} className="mr-2 text-muted-foreground shrink-0" />
                        <span>Expected: {camp.expectedDonors} donors</span>
                      </div>
                      {camp.actualDonors > 0 && (
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <Users size={14} className="mr-2 shrink-0" />
                          <span>Actual: {camp.actualDonors} donors</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-4">
                <button
                  onClick={() => fetchCamps(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground font-medium">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchCamps(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BloodCamps;