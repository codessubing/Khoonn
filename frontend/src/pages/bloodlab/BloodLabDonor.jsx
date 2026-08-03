import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  Search, User, Phone, Mail, Droplet, Calendar, History, Plus, Loader2, X 
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const BloodLabDonor = () => {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationData, setDonationData] = useState({
    quantity: 1,
    remarks: "",
    bloodGroup: ""
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, total: 0 });

  // ✅ FIXED: Uses dynamic API_BASE_URL instead of relative paths
  const API_URL = `${API_BASE_URL}/api/blood-lab`;

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

  const searchDonors = async () => {
    if (!term.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // ✅ FIXED: Absolute URL pointing to Render backend
      const res = await axios.get(
        `${API_URL}/donors/search?term=${term}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResults(res.data.donors || []);
      if (res.data.donors.length === 0) {
        toast.error("No donors found");
      }
    } catch (err) {
      console.error("Search error:", err);
      toast.error(err.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const loadRecentDonations = async () => {
    try {
      const token = localStorage.getItem("token");
      // ✅ FIXED: Absolute URL pointing to Render backend
      const res = await axios.get(
        `${API_URL}/donations/recent`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecentDonations(res.data.donations || []);
      setStats(res.data.stats || { today: 0, thisWeek: 0, total: 0 });
    } catch (err) {
      console.error("Failed to load recent donations:", err);
    }
  };

  useEffect(() => {
    loadRecentDonations();
  }, []);

  const openDonationForm = (donor) => {
    setSelectedDonor(donor);
    setDonationData({
      quantity: 1,
      remarks: "",
      bloodGroup: donor.bloodGroup
    });
    setShowDonationForm(true);
  };

  const markDonation = async () => {
    if (!selectedDonor) return;

    try {
      const token = localStorage.getItem("token");
      // ✅ FIXED: Absolute URL pointing to Render backend
      await axios.post(
        `${API_URL}/donors/donate/${selectedDonor._id}`,
        donationData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Donation recorded successfully!");
      setShowDonationForm(false);
      setSelectedDonor(null);
      searchDonors();
      loadRecentDonations();
    } catch (err) {
      console.error("Donation error:", err);
      toast.error(err.response?.data?.message || "Failed to record donation");
    }
  };

  const canDonate = (lastDonationDate) => {
    if (!lastDonationDate) return true;
    const lastDonation = new Date(lastDonationDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return lastDonation < threeMonthsAgo;
  };

  const getTimeSinceLastDonation = (lastDonationDate) => {
    if (!lastDonationDate) return "Never donated";
    
    const lastDonation = new Date(lastDonationDate);
    const now = new Date();
    const diffTime = Math.abs(now - lastDonation);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Droplet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Donor Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Search and manage blood donors
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Droplet className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Donations Today</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.today}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">This Week</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.thisWeek}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <History className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Total Donations</span>
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.total}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Search Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Search Donors
              </h2>
              
              <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone number..."
                    className="input-minimal pl-10"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchDonors()}
                  />
                </div>
                <button
                  onClick={searchDonors}
                  disabled={loading}
                  className="btn-advanced flex items-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  Search
                </button>
              </div>

              {/* Results */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {results.map((donor) => (
                  <div key={donor._id} className="bg-muted/30 border border-border rounded-xl p-4 hover:shadow-sm transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <h3 className="font-semibold text-foreground text-base">{donor.fullName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getBloodGroupBadgeClass(donor.bloodGroup)}`}>
                            {donor.bloodGroup}
                          </span>
                          {!canDonate(donor.lastDonationDate) && (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium">
                              Recently Donated
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="shrink-0" />
                            <span className="truncate">{donor.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="shrink-0" />
                            <span>{donor.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="shrink-0" />
                            <span>Last: {getTimeSinceLastDonation(donor.lastDonationDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <History size={14} className="shrink-0" />
                            <span>Total: {donor.donationHistory?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => openDonationForm(donor)}
                          disabled={!canDonate(donor.lastDonationDate)}
                          className="btn-advanced flex-1 sm:flex-none justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} />
                          Donate
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {results.length === 0 && !loading && term && (
                  <div className="text-center py-12 text-muted-foreground">
                    <User size={48} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="font-medium">No donors found matching "{term}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Donations Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Recent Donations
              </h2>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {recentDonations.map((donation, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-foreground text-sm truncate pr-2">{donation.donorName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border shrink-0 ${getBloodGroupBadgeClass(donation.bloodGroup)}`}>
                        {donation.bloodGroup}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div className="flex justify-between items-center">
                        <span>{donation.quantity} unit{donation.quantity > 1 ? 's' : ''}</span>
                        <span>{new Date(donation.date).toLocaleDateString()}</span>
                      </div>
                      {donation.remarks && (
                        <p className="text-muted-foreground/70 mt-1.5 pt-1.5 border-t border-border">
                          Note: {donation.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {recentDonations.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <p className="text-sm">No recent donations</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Donation Modal */}
        {showDonationForm && selectedDonor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 relative">
              <button 
                onClick={() => setShowDonationForm(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-bold tracking-tight text-foreground mb-6 pr-6">
                Record Donation
              </h3>
              
              <div className="space-y-5">
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="font-semibold text-foreground">{selectedDonor.fullName}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedDonor.email} • {selectedDonor.phone}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Blood Group
                  </label>
                  <select
                    value={donationData.bloodGroup}
                    onChange={(e) => setDonationData({...donationData, bloodGroup: e.target.value})}
                    className="input-minimal"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Quantity (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="2"
                    value={donationData.quantity}
                    onChange={(e) => setDonationData({...donationData, quantity: parseInt(e.target.value) || 1})}
                    className="input-minimal"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={donationData.remarks}
                    onChange={(e) => setDonationData({...donationData, remarks: e.target.value})}
                    rows={3}
                    className="input-minimal resize-none"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowDonationForm(false)}
                  className="btn-ghost flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={markDonation}
                  className="btn-advanced flex-1 justify-center"
                >
                  Confirm Donation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodLabDonor;