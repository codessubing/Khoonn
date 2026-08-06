// frontend/src/pages/donor/CampRegistration.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Calendar, MapPin, Clock, QrCode, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const API_BASE_URL = import.meta.env.PROD 
  ? "https://khoonn-backend.onrender.com" 
  : "http://localhost:5000";

export default function CampRegistration() {
  const { campId } = useParams();
  const navigate = useNavigate();
  
  const [camp, setCamp] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch camp details on mount
  useEffect(() => {
    const fetchCamp = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/camps/${campId}`);
        setCamp(res.data.camps || res.data.data);
      } catch {
        setError("Camp not found or unavailable");
      }
    };
    fetchCamp();
  }, [campId]);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in to register");

      const res = await axios.post(
        `${API_BASE_URL}/api/camps/${campId}/register`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setQrCode(res.data.data.qrCode);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Loading State
  if (!camp && !error && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  // 2. Error State
  if (error && !camp && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">Unable to Load Camp</h2>
          <p className="text-gray-600">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-advanced w-full">Go Back</button>
        </div>
      </div>
    );
  }

  // 3. SUCCESS STATE (QR Code Display)
  if (success && qrCode && camp) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-green-600 text-white p-6 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3" />
            <h1 className="text-2xl font-bold">You're Registered!</h1>
            <p className="text-green-100 mt-1">Show this QR code at check-in</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-300">
                <img src={qrCode} alt="Check-in QR Code" className="w-56 h-56" />
              </div>
              <p className="text-xs text-gray-500 text-center max-w-xs">
                Screenshot this code. It contains your unique registration token for contactless check-in.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{camp.title}</p>
                  <p className="text-gray-600">{new Date(camp.date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{camp.location.venue}</p>
                  <p className="text-gray-600">{camp.location.city}, {camp.location.state}</p>
                </div>
              </div>

              {camp.time && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Time</p>
                    <p className="text-gray-600">{camp.time.start} - {camp.time.end}</p>
                  </div>
                </div>
              )}
            </div>

            {/* ✅ FIXED: Navigate to /donor instead of / */}
            <button 
              onClick={() => navigate("/donor")}
              className="w-full btn-advanced py-3"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Registration Form State
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white p-6">
          <h1 className="text-2xl font-bold">{camp?.title || "Loading..."}</h1>
          <div className="flex items-center gap-2 mt-2 text-red-100 text-sm">
            <Calendar size={16} />
            <span>{camp?.date ? new Date(camp.date).toLocaleDateString() : "..."}</span>
            {camp?.time && (
              <>
                <span>•</span>
                <Clock size={16} />
                <span>{camp.time.start} - {camp.time.end}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-red-100 text-sm">
            <MapPin size={16} />
            <span>{camp?.location?.venue}, {camp?.location?.city}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>Expected Donors</span>
              <span className="font-medium text-gray-900">{camp?.expectedDonors || 0}</span>
            </div>
            
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span>Status</span>
              <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                camp?.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {camp?.status || "..."}
              </span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs leading-relaxed">
              <strong>Eligibility Reminder:</strong> You must be 18-65 years old, weigh ≥45kg, and have no donation in the last 90 days.
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5" />
                Register & Get QR Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}