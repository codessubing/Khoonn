import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Search, User, Phone, Mail, MapPin, Droplet, Calendar, Filter,
  Heart, Shield, ChevronDown, ChevronUp, PhoneCall, MessageCircle,
  Mail as MailIcon, X,
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const DonorDirectory = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    bloodGroup: "all",
    city: "all",
    availability: "all",
    sortBy: "lastDonation",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, available: 0, rareBlood: 0 });

  // ✅ FIXED: Uses dynamic API_BASE_URL instead of relative paths
  const API_URL = `${API_BASE_URL}/api/hospital`;

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        search: searchTerm,
        bloodGroup: filters.bloodGroup,
        city: filters.city,
        availability: filters.availability,
        sortBy: filters.sortBy,
      });

      // ✅ FIXED: Absolute URL pointing to Render backend
      const res = await axios.get(`${API_URL}/donors?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDonors(res.data.donors || []);
      setStats(res.data.stats || { total: 0, available: 0, rareBlood: 0 });
    } catch (err) {
      console.error("Fetch donors error:", err);
      toast.error(err.response?.data?.message || "Failed to load donors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [filters, searchTerm]);

  const contactDonor = (donor) => {
    setSelectedDonor(donor);
    setShowContactModal(true);
    logContactAttempt(donor._id);
  };

  const logContactAttempt = async (donorId) => {
    try {
      const token = localStorage.getItem("token");
      // ✅ FIXED: Absolute URL pointing to Render backend
      await axios.post(
        `${API_URL}/donors/${donorId}/contact`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Log contact error:", err);
    }
  };

  const getAvailabilityStatus = (lastDonationDate) => {
    if (!lastDonationDate)
      return {
        status: "available",
        text: "Available",
        color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      };

    const lastDonation = new Date(lastDonationDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    if (lastDonation < threeMonthsAgo) {
      return {
        status: "available",
        text: "Available",
        color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      };
    }

    const nextDonationDate = new Date(lastDonation);
    nextDonationDate.setMonth(nextDonationDate.getMonth() + 3);
    const daysUntilAvailable = Math.ceil(
      (nextDonationDate - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilAvailable <= 7) {
      return {
        status: "soon",
        text: `Available in ${daysUntilAvailable} days`,
        color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      };
    }

    return {
      status: "unavailable",
      text: "Recently donated",
      color: "bg-destructive/10 text-destructive border-destructive/20",
    };
  };

  const getTimeSinceLastDonation = (lastDonationDate) => {
    if (!lastDonationDate) return "Never donated";

    const lastDonation = new Date(lastDonationDate);
    const now = new Date();
    const diffTime = Math.abs(now - lastDonation);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;

    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  };

  const isRareBloodGroup = (bloodGroup) => {
    return ["O-", "AB-", "B-", "A-"].includes(bloodGroup);
  };

  const bloodGroups = ["all", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const getBloodGroupBadgeClass = (bg) => {
    const map = {
      "O-": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      "O+": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      "A-": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      "A+": "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      "B-": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
      "B+": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
      "AB-": "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
      "AB+": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
    };
    return map[bg] || "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Donor Directory
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Find and contact blood donors for emergencies
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total Donors</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.total}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Heart className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Available Now</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.available}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Rare Blood Types</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.rareBlood}</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search donors by name, email, phone, or city..."
                className="input-minimal pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-ghost flex items-center justify-center gap-2 min-w-[120px]"
            >
              <Filter size={16} />
              Filters
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Blood Group</label>
                <select
                  value={filters.bloodGroup}
                  onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                  className="input-minimal w-full"
                >
                  <option value="all">All Blood Groups</option>
                  {bloodGroups.filter((bg) => bg !== "all").map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">City</label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="input-minimal w-full"
                >
                  <option value="all">All Cities</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Pune">Pune</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Availability</label>
                <select
                  value={filters.availability}
                  onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                  className="input-minimal w-full"
                >
                  <option value="all">All Donors</option>
                  <option value="available">Available Now</option>
                  <option value="soon">Available Soon</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="input-minimal w-full"
                >
                  <option value="lastDonation">Last Donation</option>
                  <option value="name">Name</option>
                  <option value="bloodGroup">Blood Group</option>
                  <option value="city">City</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Donors Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16 bg-card border border-border rounded-xl">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-muted-foreground font-medium">Loading donors...</span>
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground/50">
              <User size={32} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No donors found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchTerm || filters.bloodGroup !== "all" || filters.city !== "all"
                ? "Try adjusting your search filters"
                : "No donors registered in the system"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {donors.map((donor) => {
              const availability = getAvailabilityStatus(donor.lastDonationDate);
              const isRare = isRareBloodGroup(donor.bloodGroup);

              return (
                <div
                  key={donor._id}
                  className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  {/* Donor Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-base truncate">
                          {donor.fullName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getBloodGroupBadgeClass(donor.bloodGroup)}`}>
                            {donor.bloodGroup}
                          </span>
                          {isRare && <Shield size={14} className="text-purple-500 shrink-0" />}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${availability.color}`}>
                      {availability.text}
                    </span>
                  </div>

                  {/* Donor Details */}
                  <div className="space-y-2.5 mb-5 flex-1">
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Phone size={14} className="text-primary shrink-0" />
                      <span className="text-foreground font-medium">{donor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Mail size={14} className="text-primary shrink-0" />
                      <span className="truncate">{donor.email}</span>
                    </div>
                    {donor.address?.city && (
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <MapPin size={14} className="text-primary shrink-0" />
                        <span className="truncate">{donor.address.city}, {donor.address.state}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Calendar size={14} className="text-primary shrink-0" />
                      <span>Last: {getTimeSinceLastDonation(donor.lastDonationDate)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Droplet size={14} className="text-primary shrink-0" />
                      <span>Total: {donor.donationHistory?.length || 0} donations</span>
                    </div>
                  </div>

                  {/* Contact Button */}
                  <button
                    onClick={() => contactDonor(donor)}
                    disabled={availability.status === "unavailable"}
                    className="btn-advanced w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PhoneCall size={16} />
                    Contact Donor
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && selectedDonor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowContactModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-bold tracking-tight text-foreground mb-2 pr-6">
                Contact Donor
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose how you'd like to contact {selectedDonor.fullName}
              </p>

              <div className="space-y-3">
                <a
                  href={`tel:${selectedDonor.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  <PhoneCall size={20} className="shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Call Now</div>
                    <div className="text-xs opacity-90">{selectedDonor.phone}</div>
                  </div>
                </a>

                <a
                  href={`sms:${selectedDonor.phone}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <MessageCircle size={20} className="shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Send SMS</div>
                    <div className="text-xs opacity-90">Quick message</div>
                  </div>
                </a>

                <a
                  href={`mailto:${selectedDonor.email}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                >
                  <MailIcon size={20} className="shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Send Email</div>
                    <div className="text-xs opacity-90 truncate max-w-[200px]">{selectedDonor.email}</div>
                  </div>
                </a>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <h4 className="font-semibold text-foreground text-sm mb-2">Donor Information</h4>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <div><span className="font-medium text-foreground">Blood Group:</span> {selectedDonor.bloodGroup}</div>
                  <div><span className="font-medium text-foreground">Last Donation:</span> {getTimeSinceLastDonation(selectedDonor.lastDonationDate)}</div>
                  {selectedDonor.address?.city && (
                    <div><span className="font-medium text-foreground">Location:</span> {selectedDonor.address.city}, {selectedDonor.address.state}</div>
                  )}
                </div>
              </div>

              <button onClick={() => setShowContactModal(false)} className="w-full mt-4 btn-ghost justify-center">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDirectory;