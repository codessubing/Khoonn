// frontend/src/App.jsx (Updated with optional campId parameter)
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

const RoleSelection = lazy(() => import("./pages/RoleSelection"));

// --- Public Pages ---
const LandingPage = lazy(() => import("./pages/Landing"));
const About = lazy(() => import("./components/about/About"));
const Contact = lazy(() => import("./components/contact/Contact"));
const BloodAvailability = lazy(() => import("./pages/public/BloodAvailability"));

// --- Auth Pages ---
const Login = lazy(() => import("./pages/auth/Login"));
const FacilityForm = lazy(() => import("./pages/auth/FacultyRegister"));
const DonorRegister = lazy(() => import("./pages/auth/DonorRegister"));

// ✅ FIXED: Converted to lazy import for consistent code-splitting
const CampCheckInScanner = lazy(() => import("./pages/hospital/CampCheckInScanner"));
const CampTransitMap = lazy(() => import("./pages/hospital/CampTransitMap")); // ✅ Added Staff Transit Map

// ✅ NEW: Live Donor Map Component
const LiveDonorMap = lazy(() => import("./components/maps/LiveDonorMap"));

// --- Layouts & Guards ---
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layouts/DashboardLayout";

// --- Donor Routes ---
const DonorDashboard = lazy(() => import("./pages/donor/DonorDashboard"));
const DonorProfile = lazy(() => import("./pages/donor/DonorProfile"));
const DonorCampsList = lazy(() => import("./pages/donor/DonorCampsList"));
const DonorDonationHistory = lazy(() => import("./pages/donor/DonorDonationHistory"));
const CampRegistration = lazy(() => import("./pages/donor/CampRegistration"));
const TransitSharing = lazy(() => import("./pages/donor/TransitSharing")); // ✅ ADDED: Missing Import

// --- Hospital Routes ---
const HospitalDashboard = lazy(() => import("./pages/hospital/HospitalDashboard"));
const HospitalRequestBlood = lazy(() => import("./pages/hospital/HospitalRequestBlood"));
const HospitalRequestHistory = lazy(() => import("./pages/hospital/HospitalRequestHistory"));
const HospitalBloodStock = lazy(() => import("./pages/hospital/HospitalBloodStock"));
const DonorDirectory = lazy(() => import("./pages/hospital/DonorDirectory"));

// --- Blood Lab Routes ---
const BloodlabDashboard = lazy(() => import("./pages/bloodlab/BloodlabDashboard"));
const BloodStock = lazy(() => import("./pages/bloodlab/BloodStock"));
const BloodCamps = lazy(() => import("./pages/bloodlab/BloodCamps"));
const LabProfile = lazy(() => import("./pages/bloodlab/LabProfile"));
const LabManageRequests = lazy(() => import("./pages/bloodlab/LabManageRequests"));
const BloodLabDonor = lazy(() => import("./pages/bloodlab/BloodLabDonor"));

// --- Admin Routes ---
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminFacilities = lazy(() => import("./pages/admin/AdminFacilities"));
const GetAllFacilities = lazy(() => import("./pages/admin/GetAllFacilities"));
const GetAllDonors = lazy(() => import("./pages/admin/GetAllDonors"));

// Minimal Loading Fallback
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blood-availability" element={<BloodAvailability />} />

          {/* Register Routes */}
          <Route path="/role-selection" element={<RoleSelection />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register/donor" element={<DonorRegister />} />
          <Route path="/register/facility" element={<FacilityForm />} />

          {/* Donor Dashboard */}
          <Route 
            path="/donor" 
            element={<ProtectedRoute><DashboardLayout userRole="donor" /></ProtectedRoute>}
          >
            <Route index element={<DonorDashboard />} />
            <Route path="profile" element={<DonorProfile />} />
            <Route path="camps" element={<DonorCampsList />} />
            <Route path="history" element={<DonorDonationHistory />} />
            <Route path="camps/:campId/register" element={<CampRegistration />} />
            <Route path="transit/:campId" element={<TransitSharing />} /> {/* ✅ Donor Transit Sharing */}
            <Route path="live-map" element={<LiveDonorMap />} /> {/* ✅ NEW: Donor Live Map */}
          </Route>
        
          {/* Hospital Dashboard */}
          <Route 
            path="/hospital" 
            element={<ProtectedRoute><DashboardLayout userRole="hospital" /></ProtectedRoute>}
          >
            <Route index element={<HospitalDashboard />} />
            <Route path="request-blood" element={<HospitalRequestBlood />} />
            <Route path="blood-requests" element={<HospitalRequestHistory />} />
            <Route path="inventory" element={<HospitalBloodStock />} />
            <Route path="donors" element={<DonorDirectory />} />
            <Route path="camps/:campId/transit" element={<CampTransitMap />} /> {/* ✅ Staff Transit View */}
            {/* ✅ FIXED: Made campId optional with ? */}
            <Route path="live-donors" element={<LiveDonorMap />} />
            <Route path="live-donors/:campId" element={<LiveDonorMap />} />
          </Route>
        
          {/* Blood Lab Dashboard */}
          <Route 
            path="/lab" 
            element={<ProtectedRoute><DashboardLayout userRole="blood-lab" /></ProtectedRoute>}
          >
            <Route index element={<BloodlabDashboard />} />
            <Route path="inventory" element={<BloodStock />} />
            <Route path="camps" element={<BloodCamps />} />
            <Route path="camps/:campId/checkin" element={<CampCheckInScanner />} />
            <Route path="camps/:campId/transit" element={<CampTransitMap />} /> {/* ✅ Lab Transit View */}
            <Route path="profile" element={<LabProfile />} />
            <Route path="requests" element={<LabManageRequests />} />
            <Route path="donor" element={<BloodLabDonor />} />
            {/* ✅ FIXED: Made campId optional with ? */}
            <Route path="live-donors" element={<LiveDonorMap />} />
            <Route path="live-donors/:campId" element={<LiveDonorMap />} />
          </Route>
          
          {/* Admin Dashboard */}
          <Route 
            path="/admin" 
            element={<ProtectedRoute><DashboardLayout userRole="admin" /></ProtectedRoute>}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="verification" element={<AdminFacilities />} />
            <Route path="donors" element={<GetAllDonors />} />
            <Route path="facilities" element={<GetAllFacilities />} />
          </Route>

          {/* 404 / Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;