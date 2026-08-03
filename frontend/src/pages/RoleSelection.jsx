import { Link } from "react-router-dom";
import { User, Building2, ArrowRight } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function RoleSelection() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      {/* ✅ FIXED: Added pt-24 sm:pt-32 to push content below sticky header */}
      <main className="flex-1 flex items-center justify-center px-4 py-16 pt-24 sm:pt-32">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
              Join Our Blood Bank Network
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Choose your role to get started. Each account type gives you access to different features.
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Donor Card */}
            <Link
              to="/register/donor"
              className="group bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-md transition-all duration-300 block"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <User className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Blood Donor</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Register as a donor to save lives. Track your donations, find nearby blood camps, and receive alerts when your blood type is needed.
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                Register as Donor
                <ArrowRight size={16} />
              </div>
            </Link>

            {/* Facility Card */}
            <Link
              to="/register/facility"
              className="group bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-md transition-all duration-300 block"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Hospital / Blood Lab</h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Register your healthcare facility to manage blood inventory, request units from labs, and connect with donors in your area.
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                Register Facility
                <ArrowRight size={16} />
              </div>
            </Link>
          </div>

          {/* Back to Login */}
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}