import {
  ArrowRight,
  Heart,
  Users,
  MapPin,
  Clock,
  Droplets,
  Shield,
  Zap,
  Search,
  Bell,
  FileText,
  CheckCircle,
  Activity,
  RefreshCw,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const LandingPage = () => {
  const stats = [
    { icon: Users, label: "Lives Saved", value: "10,000+" },
    { icon: Heart, label: "Blood Units", value: "50,000+" },
    { icon: MapPin, label: "Partner Hospitals", value: "150+" },
    { icon: Clock, label: "Response Time", value: "< 30min" },
  ];

  const features = [
    {
      icon: Users,
      title: "Easy Donor Registration",
      description: "Simple and secure donor registration process with medical history tracking and eligibility verification.",
    },
    {
      icon: Droplets,
      title: "Real-time Inventory Tracking",
      description: "Monitor blood inventory levels, expiration dates, and distribution in real-time across all partner facilities.",
    },
    {
      icon: Zap,
      title: "Quick Response",
      description: "Emergency request system with automated matching and notification to ensure rapid response in critical situations.",
    },
  ];

  const processSteps = [
    { step: "01", icon: FileText, title: "Register & Screen", description: "Complete simple registration and health screening process" },
    { step: "02", icon: Search, title: "Find Match", description: "Our system matches blood needs with compatible donors" },
    { step: "03", icon: Bell, title: "Get Notified", description: "Receive instant alerts for urgent needs in your area" },
    { step: "04", icon: Heart, title: "Donate & Save Lives", description: "Visit approved centers and make your life-saving donation" },
  ];

  const bloodTypes = [
    { type: "A+", need: "High", donors: "32%" },
    { type: "A-", need: "Critical", donors: "8%" },
    { type: "B+", need: "Medium", donors: "12%" },
    { type: "B-", need: "High", donors: "3%" },
    { type: "O+", need: "High", donors: "35%" },
    { type: "O-", need: "Critical", donors: "5%" },
    { type: "AB+", need: "Low", donors: "4%" },
    { type: "AB-", need: "Medium", donors: "1%" },
  ];

  const getNeedBadgeClass = (need) => {
    switch (need) {
      case "Critical": return "bg-destructive/10 text-destructive border-destructive/20";
      case "High": return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "Medium": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "Low": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const donationFacts = [
    { icon: Heart, title: "One Donation, Multiple Lives", description: "A single blood donation can save up to 3 lives. Your one hour can give someone a lifetime.", stat: "3 Lives Saved" },
    { icon: RefreshCw, title: "Blood Regeneration", description: "Your body replaces the blood you donate within 24-48 hours. The red blood cells are completely replaced in 4-6 weeks.", stat: "48 Hours" },
    { icon: Users, title: "Constant Need", description: "Every 2 seconds, someone needs blood. Your regular donation ensures continuous supply for emergencies.", stat: "Every 2 Seconds" },
    { icon: AlertTriangle, title: "Short Shelf Life", description: "Red blood cells last only 42 days, platelets just 5 days. Regular donations are essential to maintain supply.", stat: "42 Days Shelf Life" },
  ];

  const eligibilityInfo = [
    { icon: CheckCircle, title: "Who Can Donate", items: ["Age 17-75 (16 with parental consent)", "Weight at least 110 lbs (50 kg)", "Good general health", "No flu or cold symptoms"] },
    { icon: Stethoscope, title: "Health Benefits", items: ["Free health screening", "Burns 650 calories per donation", "Reduces risk of heart disease", "Stimulates blood cell production"] },
    { icon: Shield, title: "Safety First", items: ["Sterile, disposable equipment", "Trained medical staff", "Comfortable environment", "Post-donation care"] },
  ];

  const emergencyNeeds = [
    { type: "Accident Victims", units: "Up to 100 units", icon: AlertTriangle },
    { type: "Cancer Patients", units: "8 units weekly", icon: Heart },
    { type: "Surgery Patients", units: "5-10 units", icon: Stethoscope },
    { type: "Burn Victims", units: "20+ units", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background border-b border-border">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 border border-primary/20">
              <Heart className="w-3.5 h-3.5" />
              Saving Lives Every Day
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4 leading-tight">
              Connect{" "}
              <span className="text-primary">
                Blood Donors
              </span>{" "}
              with Those in Need
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
              Our advanced blood bank management system ensures efficient
              donation, storage, and distribution of blood products to save
              lives when every second counts.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/role-selection" 
                className="btn-advanced text-sm px-6 py-2.5 inline-flex items-center justify-center"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
              <Link 
                to="#about" 
                className="btn-ghost text-sm px-6 py-2.5 inline-flex items-center justify-center"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-4 rounded-lg bg-card border border-border hover:shadow-sm transition-all duration-300">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-xl font-bold tracking-tight text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Blood Need Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
              Current Blood Needs
            </h2>
            <p className="text-base text-muted-foreground">
              Real-time blood type requirements across our network. Your donation matters now more than ever.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-3xl mx-auto">
            {bloodTypes.map((blood, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-4 text-center hover:shadow-sm transition-all duration-300">
                <div className="text-xl font-bold tracking-tight text-foreground mb-2">
                  {blood.type}
                </div>
                <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block ${getNeedBadgeClass(blood.need)}`}>
                  {blood.need} Need
                </div>
                <div className="text-[10px] text-muted-foreground mt-2">
                  {blood.donors} Donors
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Donate Blood Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
              Why Your Blood Donation Matters
            </h2>
            <p className="text-base text-muted-foreground">
              Every donation creates a ripple effect of hope and healing in our community.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {donationFacts.map((fact, index) => {
              const Icon = fact.icon;
              return (
                <div key={index} className="bg-card border border-border rounded-lg p-4 text-center hover:shadow-sm transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold mb-2 text-foreground">
                    {fact.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {fact.description}
                  </p>
                  <div className="text-primary font-bold text-sm">
                    {fact.stat}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Needs Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
              Who Needs Your Blood?
            </h2>
            <p className="text-base text-muted-foreground">
              Your donation directly impacts patients in critical situations
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {emergencyNeeds.map((need, index) => {
              const Icon = need.icon;
              return (
                <div key={index} className="bg-card border border-border rounded-lg p-4 text-center hover:shadow-sm transition-all duration-300">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="text-sm font-semibold mb-2 text-foreground">
                    {need.type}
                  </h3>
                  <p className="text-xs text-muted-foreground">{need.units}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <div className="bg-muted/50 border border-border rounded-lg p-4 max-w-xl mx-auto">
              <p className="text-base text-foreground mb-1">
                <strong>47% of the population</strong> is eligible to donate blood, but only <strong>5%</strong> actually do.
              </p>
              <p className="text-sm text-muted-foreground">
                Your single donation can make all the difference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
              How It Works
            </h2>
            <p className="text-base text-muted-foreground">
              Simple steps to become a life-saver. Join thousands of donors making a difference.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-all duration-300 h-full">
                    <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {step.step}
                    </div>
                    {Icon && (
                      <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                    )}
                    <h3 className="text-sm font-semibold mb-2 text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Eligibility & Benefits Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
              Donor Eligibility & Benefits
            </h2>
            <p className="text-base text-muted-foreground">
              Safe, simple, and rewarding - discover the benefits of blood donation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {eligibilityInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div key={index} className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-all duration-300">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground text-center">
                    {info.title}
                  </h3>
                  <ul className="space-y-2">
                    {info.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
              Why Choose Our Blood Bank System?
            </h2>
            <p className="text-base text-muted-foreground">
              We provide a comprehensive platform that connects donors, hospitals, and blood banks to ensure efficient blood collection and distribution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-card border border-border rounded-lg p-4 text-center hover:shadow-sm transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">
                Secure & Compliant
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Our system meets all healthcare data security standards with end-to-end encryption and strict compliance with medical regulations to protect donor and patient information.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-xs text-muted-foreground justify-center">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                  HIPAA compliant data handling
                </li>
                <li className="flex items-center text-xs text-muted-foreground justify-center">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                  End-to-end encryption
                </li>
                <li className="flex items-center text-xs text-muted-foreground justify-center">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                  Regular security audits
                </li>
              </ul>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="aspect-video bg-card border border-border rounded-lg flex items-center justify-center">
                <div className="text-center p-3">
                  <Shield className="w-10 h-10 text-primary/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Secure Blood Bank Management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto bg-primary rounded-xl p-8 text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Ready to Save Lives?
            </h2>
            <p className="text-sm md:text-base opacity-90 mb-6 max-w-xl mx-auto">
              Join our community of donors and healthcare professionals working together to ensure blood is available when and where it's needed most.
            </p>
            
            <Link 
              to="/role-selection" 
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded-lg bg-background text-primary hover:bg-muted transition-all duration-300 shadow-lg"
            >
              Join Today <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LandingPage;