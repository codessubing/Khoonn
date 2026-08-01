import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Droplet,
  Calendar,
  Search,
  Filter,
  Download,
  MapPin,
  AlertCircle,
  Award,
  TrendingUp,
  Heart,
  Star,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

const API_URL = `${import.meta.env.VITE_API_URL || ""}/api/donor`;

const DonorDonationHistory = () => {
  const [history, setHistory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalUnits: 0,
    lifeImpact: 0,
    lastDonation: null,
    favoriteFacility: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login to view your donation history");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data =
        res.data.history ||
        res.data.donations ||
        (Array.isArray(res.data) ? res.data : []);

      data.sort(
        (a, b) =>
          new Date(b.donationDate || b.date) -
          new Date(a.donationDate || a.date)
      );

      setHistory(data);
      setFiltered(data);
      calculateStats(data);
    } catch (err) {
      console.error("Fetch history error:", err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error("Failed to load donation history");
      }
    }
    setLoading(false);
  };

  const calculateStats = (data) => {
    const totalDonations = data.length;
    const totalUnits = data.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const lifeImpact = totalUnits * 3;
    const lastDonation = data.length > 0 ? data[0].donationDate || data[0].date : null;

    const facilityCount = data.reduce((acc, item) => {
      const facility = item.facility || item.city || "Unknown";
      acc[facility] = (acc[facility] || 0) + 1;
      return acc;
    }, {});

    const favoriteFacility = Object.keys(facilityCount).reduce(
      (a, b) => (facilityCount[a] > facilityCount[b] ? a : b),
      "None"
    );

    setStats({ totalDonations, totalUnits, lifeImpact, lastDonation, favoriteFacility });
  };

  const getDonorLevel = (count) => {
    if (count >= 10)
      return {
        level: "Hero",
        iconBg: "bg-purple-500/10",
        iconText: "text-purple-600 dark:text-purple-400",
        icon: <Award className="w-5 h-5" />,
      };
    if (count >= 5)
      return {
        level: "Champion",
        iconBg: "bg-amber-500/10",
        iconText: "text-amber-600 dark:text-amber-400",
        icon: <Star className="w-5 h-5" />,
      };
    if (count >= 3)
      return {
        level: "Supporter",
        iconBg: "bg-green-500/10",
        iconText: "text-green-600 dark:text-green-400",
        icon: <TrendingUp className="w-5 h-5" />,
      };
    return {
      level: "Starter",
      iconBg: "bg-blue-500/10",
      iconText: "text-blue-600 dark:text-blue-400",
      icon: <Heart className="w-5 h-5" />,
    };
  };

  const applyFilter = () => {
    let filteredData = [...history];

    if (filterType !== "all") {
      const months = { last3: 3, last6: 6, last12: 12 }[filterType];
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);

      filteredData = filteredData.filter((item) => {
        const donationDate = new Date(item.donationDate || item.date);
        return donationDate >= cutoff;
      });
    }

    if (searchTerm.trim()) {
      filteredData = filteredData.filter(
        (item) =>
          item.facility?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filteredData.sort((a, b) => {
      const dateA = new Date(a.donationDate || a.date);
      const dateB = new Date(b.donationDate || b.date);

      switch (sortBy) {
        case "date-asc": return dateA - dateB;
        case "date-desc": return dateB - dateA;
        case "units-desc": return (b.quantity || 1) - (a.quantity || 1);
        default: return dateB - dateA;
      }
    });

    setFiltered(filteredData);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Facility", "City", "Blood Group", "Units", "Status"];
    const csvData = filtered.map((item) =>
      [
        new Date(item.donationDate || item.date).toLocaleDateString(),
        item.facility || "Blood Donation Camp",
        item.city || "N/A",
        item.bloodGroup || "N/A",
        item.quantity || 1,
        "Completed",
      ].join(",")
    );

    const csv = [headers.join(","), ...csvData].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donation-history.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Data exported successfully!");
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [searchTerm, filterType, sortBy, history]);

  const donorLevel = getDonorLevel(stats.totalDonations);

  const MetricCard = ({ icon, label, value, iconBg, iconText }) => (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconBg} ${iconText}`}>
          {icon}
        </div>
      </div>
    </div>
  );

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
                Donation Journey
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your life-saving contributions and see the impact you're making
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Droplet className="w-5 h-5" />}
            label="Total Donations"
            value={stats.totalDonations}
            iconBg="bg-destructive/10"
            iconText="text-destructive"
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Units Donated"
            value={stats.totalUnits}
            iconBg="bg-green-500/10"
            iconText="text-green-600 dark:text-green-400"
          />
          <MetricCard
            icon={<Heart className="w-5 h-5" />}
            label="Lives Impacted"
            value={`${stats.lifeImpact}+`}
            iconBg="bg-blue-500/10"
            iconText="text-blue-600 dark:text-blue-400"
          />
          <MetricCard
            icon={donorLevel.icon}
            label="Your Level"
            value={donorLevel.level}
            iconBg={donorLevel.iconBg}
            iconText={donorLevel.iconText}
          />
        </div>

        {/* Controls Section */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by facility, city, or blood group..."
                className="input-minimal pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-minimal w-full sm:w-auto min-w-[160px]"
                >
                  <option value="all">All Time</option>
                  <option value="last3">Last 3 Months</option>
                  <option value="last6">Last 6 Months</option>
                  <option value="last12">Last 12 Months</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-minimal w-full sm:w-auto min-w-[160px]"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="units-desc">Most Units</option>
              </select>

              <button onClick={exportToCSV} className="btn-ghost flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-foreground font-medium">Loading your heroic journey...</p>
            <p className="text-sm text-muted-foreground mt-1">Fetching your life-saving contributions</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground/50">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {history.length === 0 ? "No Donations Yet" : "No Matching Records"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {history.length === 0
                  ? "Start your life-saving journey by making your first blood donation."
                  : "Try adjusting your search or filters to find what you're looking for."}
              </p>
              {history.length === 0 && (
                <button className="btn-advanced">
                  Schedule Your First Donation
                </button>
              )}
            </div>
          </div>
        )}

        {/* Donation History Cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            <div className="px-1">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filtered.length}</span> donation{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid gap-4">
              {filtered.map((item, index) => {
                const date = new Date(item.donationDate || item.date);
                const isRecent = new Date() - date < 30 * 24 * 60 * 60 * 1000;

                return (
                  <div
                    key={item._id || index}
                    className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-lg shrink-0 ${
                          isRecent ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-primary/10 text-primary"
                        }`}>
                          <Droplet className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base font-semibold text-foreground">
                              {item.bloodGroup || "Blood"} Donation
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                              Completed
                            </span>
                            {isRecent && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                                Recent
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 shrink-0" />
                              <span>
                                {date.toLocaleDateString("en-IN", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            {item.city && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span className="truncate">
                                  {item.city}{item.state && `, ${item.state}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center sm:items-end gap-1 shrink-0">
                        <div className="text-xl font-bold tracking-tight text-foreground">
                          +{item.quantity || 1}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          Units
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDonationHistory;