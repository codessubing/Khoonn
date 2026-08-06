// frontend/src/pages/donor/DonorDashboard.jsx (Updated with Live Map Quick Action)
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Droplet, Calendar, Users, Activity, Clock, MapPin, Phone, Mail,
  User, Shield, Award, Heart, TrendingUp, RefreshCw, AlertCircle,
  Download, Share2, Map,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const DonorDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [donor, setDonor] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ FIXED: Uses dynamic API_BASE_URL instead of VITE_API_URL
  const API_URL = `${API_BASE_URL}/api/donor`;

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const [profileRes, historyRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/history`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/stats`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} })),
      ]);

      // Extract donor data safely
      const donorData = profileRes.data.donor || profileRes.data.user || profileRes.data;
      setDonor(donorData);

      // Extract history data safely
      let historyData = [];
      if (historyRes.data.history) historyData = historyRes.data.history;
      else if (historyRes.data.donations) historyData = historyRes.data.donations;
      else if (Array.isArray(historyRes.data)) historyData = historyRes.data;
      setHistory(historyData);

      // Calculate metrics
      const totalDonations = historyData.length;
      const livesImpacted = totalDonations * 3;
      const achievementLevel = totalDonations >= 10 ? "Gold" : totalDonations >= 5 ? "Silver" : "Bronze";
      const nextMilestone = totalDonations < 5 ? 5 : totalDonations < 10 ? 10 : 15;
      const completionRate = Math.min(100, (totalDonations / nextMilestone) * 100);

      // Safely merge stats from the backend without nesting issues
      const backendStats = statsRes.data?.dashboard || statsRes.data || {};

      setDashboard({
        stats: {
          totalDonations,
          livesImpacted,
          achievementLevel,
          nextMilestone,
          completionRate,
          ...backendStats,
        },
        recentActivity: historyData.slice(0, 5),
      });
    } catch (error) {
      console.error("Donor Dashboard Error:", error);
      const message = error.response?.data?.message || "Failed to load donor dashboard data";
      toast.error(message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success("Dashboard updated");
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading Donor Dashboard...</p>
        </div>
      </div>
    );
  }

  const isEligible = donor?.eligibleToDonate || false;
  const nextDonationDate = donor?.nextEligibleDate ? new Date(donor.nextEligibleDate) : null;
  const daysUntilEligible = nextDonationDate ? Math.ceil((nextDonationDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;

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
                Donor Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your donation journey and impact
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Eligibility Banner */}
        {!isEligible && nextDonationDate && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-300">Next Donation Available</p>
              <p className="text-amber-700/80 dark:text-amber-400/80 text-sm">
                You can donate again in {daysUntilEligible} day{daysUntilEligible !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {isEligible && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300">Ready to Donate!</p>
              <p className="text-green-700/80 dark:text-green-400/80 text-sm">
                You are eligible to donate blood now
              </p>
            </div>
          </div>
        )}

        {/* Donor Profile Card */}
        {donor && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Donor Profile
              </h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                isEligible
                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
              }`}>
                {isEligible ? "Eligible" : "Not Eligible"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <ProfileInfo icon={<Mail className="w-4 h-4" />} label="Email" value={donor.email} />
              <ProfileInfo icon={<Phone className="w-4 h-4" />} label="Phone" value={donor.phone} />
              <ProfileInfo icon={<Droplet className="w-4 h-4" />} label="Blood Type" value={donor.bloodGroup} />
              <ProfileInfo 
                icon={<MapPin className="w-4 h-4" />} 
                label="Location" 
                value={`${donor.address?.city || "N/A"}, ${donor.address?.state || "N/A"}`} 
                truncate 
              />
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Droplet className="w-5 h-5" />}
            label="Total Donations"
            value={dashboard?.stats?.totalDonations || 0}
            subtitle={`${dashboard?.stats?.nextMilestone || 0} to next milestone`}
            color="red"
          />
          <MetricCard
            icon={<Users className="w-5 h-5" />}
            label="Lives Impacted"
            value={dashboard?.stats?.livesImpacted || 0}
            subtitle="3 lives per donation"
            color="green"
          />
          <MetricCard
            icon={<Award className="w-5 h-5" />}
            label="Achievement Level"
            value={dashboard?.stats?.achievementLevel || "Bronze"}
            subtitle="Keep donating to level up"
            color="purple"
          />
          <MetricCard
            icon={<Calendar className="w-5 h-5" />}
            label="Next Eligible"
            value={donor?.nextEligibleDate ? new Date(donor.nextEligibleDate).toLocaleDateString() : "Now"}
            subtitle={isEligible ? "Ready to donate" : `${daysUntilEligible} days left`}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donation History Section */}
          <Section title="Donation History" icon={<Activity className="w-5 h-5 text-primary" />} subtitle="Your blood donation journey">
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.slice(0, 5).map((donation, index) => (
                  <DonationHistoryItem key={donation._id || donation.id || index} donation={donation} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Droplet className="w-8 h-8" />}
                message="No donation history yet"
                actionText="Find nearby blood camps"
                onAction={() => toast.success("Find nearby blood donation camps to get started!")}
              />
            )}
          </Section>

          {/* Recent Activity Section */}
          <Section title="Recent Activity" icon={<Clock className="w-5 h-5 text-primary" />} subtitle="Latest updates and achievements">
            {dashboard?.recentActivity?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentActivity.map((activity, index) => (
                  <ActivityCard key={activity._id || activity.id || index} activity={activity} />
                ))}
              </div>
            ) : (
              <EmptyState icon={<Activity className="w-8 h-8" />} message="No recent activity" />
            )}
          </Section>
        </div>

        {/* Quick Actions Section */}
        <Section title="Quick Actions" icon={<Shield className="w-5 h-5 text-primary" />} subtitle="Manage your donor profile">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionCard
              icon={<Download className="w-5 h-5" />}
              title="Download Certificate"
              description="Get your donation certificate"
              onClick={() => toast.success("Certificate download started!")}
            />
            <ActionCard
              icon={<Share2 className="w-5 h-5" />}
              title="Share Achievement"
              description="Share your impact with others"
              onClick={() => toast.success("Share your life-saving journey!")}
            />
            {/* ✅ NEW: Live Map Quick Action */}
            <Link to="/donor/live-map" className="block">
              <ActionCard
                icon={<Map className="w-5 h-5" />}
                title="Live Map"
                description="Find nearby blood camps"
                onClick={() => {}} // Handled by Link wrapper
              />
            </Link>
            <ActionCard
              icon={<Users className="w-5 h-5" />}
              title="Invite Friends"
              description="Grow the donor community"
              onClick={() => toast.success("Invite friends to become donors!")}
            />
          </div>
        </Section>

        {/* Health Stats Section */}
        {donor && (
          <Section title="Health Overview" icon={<Heart className="w-5 h-5 text-primary" />} subtitle="Your health metrics">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <HealthStat label="Age" value={donor.age || "N/A"} icon={<User className="w-4 h-4" />} />
              <HealthStat label="Weight" value={donor.weight ? `${donor.weight} kg` : "N/A"} icon={<Activity className="w-4 h-4" />} />
              <HealthStat 
                label="Last Donation" 
                value={donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : "Never"} 
                icon={<Calendar className="w-4 h-4" />} 
              />
              <HealthStat 
                label="Donor Since" 
                value={donor.createdAt ? new Date(donor.createdAt).getFullYear() : new Date().getFullYear()} 
                icon={<Award className="w-4 h-4" />} 
              />
            </div>
          </Section>
        )}
      </div>
    </div>
  );
};

// --- Reusable Components ---

const MetricCard = ({ icon, label, value, subtitle, color, alert = false }) => {
  const colorClasses = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
    green: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" },
    red: { bg: "bg-destructive/10", text: "text-destructive" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  };

  const colors = colorClasses[color] || colorClasses.blue;
  const finalBg = alert ? "bg-destructive/10" : colors.bg;
  const finalText = alert ? "text-destructive" : colors.text;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1 ${alert ? "text-destructive" : "text-muted-foreground"}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${finalBg} ${finalText}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, icon, subtitle, children, className = "" }) => (
  <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          {icon} {title}
        </h3>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const ProfileInfo = ({ icon, label, value, truncate = false }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-primary/10 rounded-lg text-primary mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-medium text-foreground ${truncate ? "truncate" : ""}`}>
        {value || "—"}
      </p>
    </div>
  </div>
);

const DonationHistoryItem = ({ donation }) => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
        <Droplet className="w-4 h-4" />
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">
          {donation.facility || "Blood Donation Camp"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(donation.donationDate || donation.date).toLocaleDateString()} • {donation.bloodType || donation.bloodGroup}
        </p>
      </div>
    </div>
    <div className="text-right shrink-0">
      <span className="font-bold text-foreground text-sm">
        {donation.quantity || 1} unit
      </span>
      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Completed</p>
    </div>
  </div>
);

const ActivityCard = ({ activity }) => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border">
    <div className="flex-1 min-w-0 pr-4">
      <h4 className="font-medium text-foreground text-sm truncate">
        {activity.eventType || "Donation"}
      </h4>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">
        {activity.description || "Blood donation completed"}
      </p>
    </div>
    <div className="text-right shrink-0">
      <span className="text-xs text-muted-foreground">
        {new Date(activity.date || activity.createdAt).toLocaleDateString()}
      </span>
    </div>
  </div>
);

const ActionCard = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="p-4 rounded-xl border border-border bg-card hover:bg-muted text-left transition-colors group"
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h4 className="font-semibold text-foreground">{title}</h4>
    </div>
    <p className="text-sm text-muted-foreground">{description}</p>
  </button>
);

const HealthStat = ({ label, value, icon }) => (
  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tracking-tight text-foreground">{value}</p>
    </div>
    <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">{icon}</div>
  </div>
);

const EmptyState = ({ icon, message, actionText, onAction }) => (
  <div className="text-center py-10 text-muted-foreground">
    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground/50">
      {icon}
    </div>
    <p className="text-sm font-medium mb-4">{message}</p>
    {actionText && onAction && (
      <button onClick={onAction} className="btn-advanced">
        {actionText}
      </button>
    )}
  </div>
);

export default DonorDashboard;