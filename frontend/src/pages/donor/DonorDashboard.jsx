import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Droplet, Calendar, Users, Activity, Clock, MapPin, Phone, Mail,
  User, Shield, Award, Heart, TrendingUp, RefreshCw, AlertCircle,
  Download, Share2, Map,
} from "lucide-react";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const DonorDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [donor, setDonor] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

      const donorData = profileRes.data.donor || profileRes.data.user || profileRes.data;
      setDonor(donorData);

      let historyData = [];
      if (historyRes.data.history) historyData = historyRes.data.history;
      else if (historyRes.data.donations) historyData = historyRes.data.donations;
      else if (Array.isArray(historyRes.data)) historyData = historyRes.data;
      setHistory(historyData);

      const totalDonations = historyData.length;
      const livesImpacted = totalDonations * 3;
      const achievementLevel = totalDonations >= 10 ? "Gold" : totalDonations >= 5 ? "Silver" : "Bronze";
      const nextMilestone = totalDonations < 5 ? 5 : totalDonations < 10 ? 10 : 15;
      const completionRate = Math.min(100, (totalDonations / nextMilestone) * 100);

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const isEligible = donor?.eligibleToDonate || false;
  const nextDonationDate = donor?.nextEligibleDate ? new Date(donor.nextEligibleDate) : null;
  const daysUntilEligible = nextDonationDate ? Math.ceil((nextDonationDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Donor Dashboard
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track your donation journey and impact
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-ghost flex items-center gap-1.5 py-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Eligibility Banner */}
        {!isEligible && nextDonationDate && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-300 text-xs">Next Donation Available</p>
              <p className="text-amber-700/80 dark:text-amber-400/80 text-xs">
                You can donate again in {daysUntilEligible} day{daysUntilEligible !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {isEligible && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300 text-xs">Ready to Donate!</p>
              <p className="text-green-700/80 dark:text-green-400/80 text-xs">
                You are eligible to donate blood now
              </p>
            </div>
          </div>
        )}

        {/* Donor Profile Card */}
        {donor && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" />
                Donor Profile
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                isEligible
                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
              }`}>
                {isEligible ? "Eligible" : "Not Eligible"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <ProfileInfo icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={donor.email} />
              <ProfileInfo icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={donor.phone} />
              <ProfileInfo icon={<Droplet className="w-3.5 h-3.5" />} label="Blood Type" value={donor.bloodGroup} />
              <ProfileInfo 
                icon={<MapPin className="w-3.5 h-3.5" />} 
                label="Location" 
                value={`${donor.address?.city || "N/A"}, ${donor.address?.state || "N/A"}`} 
                truncate 
              />
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MetricCard
            icon={<Droplet className="w-4 h-4" />}
            label="Total Donations"
            value={dashboard?.stats?.totalDonations || 0}
            subtitle={`${dashboard?.stats?.nextMilestone || 0} to next milestone`}
            color="red"
          />
          <MetricCard
            icon={<Users className="w-4 h-4" />}
            label="Lives Impacted"
            value={dashboard?.stats?.livesImpacted || 0}
            subtitle="3 lives per donation"
            color="green"
          />
          <MetricCard
            icon={<Award className="w-4 h-4" />}
            label="Achievement Level"
            value={dashboard?.stats?.achievementLevel || "Bronze"}
            subtitle="Keep donating"
            color="purple"
          />
          <MetricCard
            icon={<Calendar className="w-4 h-4" />}
            label="Next Eligible"
            value={donor?.nextEligibleDate ? new Date(donor.nextEligibleDate).toLocaleDateString() : "Now"}
            subtitle={isEligible ? "Ready to donate" : `${daysUntilEligible} days left`}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Donation History Section */}
          <Section title="Donation History" icon={<Activity className="w-4 h-4 text-primary" />} subtitle="Your blood donation journey">
            {history.length > 0 ? (
              <div className="space-y-2">
                {history.slice(0, 5).map((donation, index) => (
                  <DonationHistoryItem key={donation._id || donation.id || index} donation={donation} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Droplet className="w-6 h-6" />}
                message="No donation history yet"
                actionText="Find nearby camps"
                onAction={() => toast.success("Find nearby blood donation camps to get started!")}
              />
            )}
          </Section>

          {/* Recent Activity Section */}
          <Section title="Recent Activity" icon={<Clock className="w-4 h-4 text-primary" />} subtitle="Latest updates">
            {dashboard?.recentActivity?.length > 0 ? (
              <div className="space-y-2">
                {dashboard.recentActivity.map((activity, index) => (
                  <ActivityCard key={activity._id || activity.id || index} activity={activity} />
                ))}
              </div>
            ) : (
              <EmptyState icon={<Activity className="w-6 h-6" />} message="No recent activity" />
            )}
          </Section>
        </div>

        {/* Quick Actions Section */}
        <Section title="Quick Actions" icon={<Shield className="w-4 h-4 text-primary" />} subtitle="Manage your profile">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ActionCard
              icon={<Download className="w-4 h-4" />}
              title="Download Certificate"
              description="Get your donation certificate"
              onClick={() => toast.success("Certificate download started!")}
            />
            <ActionCard
              icon={<Share2 className="w-4 h-4" />}
              title="Share Achievement"
              description="Share your impact"
              onClick={() => toast.success("Share your life-saving journey!")}
            />
            <Link to="/donor/live-map" className="block">
              <ActionCard
                icon={<Map className="w-4 h-4" />}
                title="Live Map"
                description="Find nearby camps"
                onClick={() => {}} // Handled by Link wrapper
              />
            </Link>
            <ActionCard
              icon={<Users className="w-4 h-4" />}
              title="Invite Friends"
              description="Grow the donor community"
              onClick={() => toast.success("Invite friends to become donors!")}
            />
          </div>
        </Section>

        {/* Health Stats Section */}
        {donor && (
          <Section title="Health Overview" icon={<Heart className="w-4 h-4 text-primary" />} subtitle="Your health metrics">
            <div className="grid grid-cols-1 gap-3">
              <HealthStat label="Age" value={donor.age || "N/A"} icon={<User className="w-3.5 h-3.5" />} />
              <HealthStat label="Weight" value={donor.weight ? `${donor.weight} kg` : "N/A"} icon={<Activity className="w-3.5 h-3.5" />} />
              <HealthStat 
                label="Last Donation" 
                value={donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : "Never"} 
                icon={<Calendar className="w-3.5 h-3.5" />} 
              />
              <HealthStat 
                label="Donor Since" 
                value={donor.createdAt ? new Date(donor.createdAt).getFullYear() : new Date().getFullYear()} 
                icon={<Award className="w-3.5 h-3.5" />} 
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
    <div className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className={`text-[10px] mt-1 ${alert ? "text-destructive" : "text-muted-foreground"}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${finalBg} ${finalText}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, icon, subtitle, children, className = "" }) => (
  <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          {icon} {title}
        </h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const ProfileInfo = ({ icon, label, value, truncate = false }) => (
  <div className="flex items-start gap-2.5">
    <div className="p-1.5 bg-primary/10 rounded-lg text-primary mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-xs font-medium text-foreground ${truncate ? "truncate" : ""}`}>
        {value || "—"}
      </p>
    </div>
  </div>
);

const DonationHistoryItem = ({ donation }) => (
  <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border">
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">
        <Droplet className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="font-medium text-foreground text-xs">
          {donation.facility || "Blood Donation Camp"}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {new Date(donation.donationDate || donation.date).toLocaleDateString()} • {donation.bloodType || donation.bloodGroup}
        </p>
      </div>
    </div>
    <div className="text-right shrink-0">
      <span className="font-bold text-foreground text-xs">
        {donation.quantity || 1} unit
      </span>
      <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">Completed</p>
    </div>
  </div>
);

const ActivityCard = ({ activity }) => (
  <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border">
    <div className="flex-1 min-w-0 pr-3">
      <h4 className="font-medium text-foreground text-xs truncate">
        {activity.eventType || "Donation"}
      </h4>
      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
        {activity.description || "Blood donation completed"}
      </p>
    </div>
    <div className="text-right shrink-0">
      <span className="text-[10px] text-muted-foreground">
        {new Date(activity.date || activity.createdAt).toLocaleDateString()}
      </span>
    </div>
  </div>
);

const ActionCard = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="p-3 rounded-lg border border-border bg-card hover:bg-muted text-left transition-colors group"
  >
    <div className="flex items-center gap-2.5 mb-1.5">
      <div className="p-1.5 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h4 className="font-semibold text-foreground text-sm">{title}</h4>
    </div>
    <p className="text-xs text-muted-foreground">{description}</p>
  </button>
);

const HealthStat = ({ label, value, icon }) => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tracking-tight text-foreground">{value}</p>
    </div>
    <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0">{icon}</div>
  </div>
);

const EmptyState = ({ icon, message, actionText, onAction }) => (
  <div className="text-center py-6 text-muted-foreground">
    <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground/50">
      {icon}
    </div>
    <p className="text-xs font-medium mb-3">{message}</p>
    {actionText && onAction && (
      <button onClick={onAction} className="btn-advanced text-xs">
        {actionText}
      </button>
    )}
  </div>
);

export default DonorDashboard;