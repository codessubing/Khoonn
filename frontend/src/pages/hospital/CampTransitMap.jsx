// frontend/src/pages/hospital/CampTransitMap.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
// ✅ FIXED: Consolidated imports to prevent duplicates
import { 
  MapPin, Users, ArrowLeft, Loader2, Navigation, Battery, Clock, 
  AlertTriangle, BatteryLow 
} from "lucide-react";

const API_BASE_URL = import.meta.env.PROD 
  ? "https://khoonn-backend.onrender.com" 
  : "http://localhost:5000";

export default function CampTransitMap() {
  const { campId } = useParams();
  const navigate = useNavigate();
  const [camp, setCamp] = useState(null);
  const [approachingDonors, setApproachingDonors] = useState([]);
  const [predictions, setPredictions] = useState(null); // ✅ NEW: Prediction state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // Fetch camp details & initial active donors
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        const campRes = await axios.get(`${API_BASE_URL}/api/camps/${campId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const donorsRes = await axios.get(
          `${API_BASE_URL}/api/transit/camp/${campId}/active`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (isMounted) {
          setCamp(campRes.data.camps || campRes.data.data);
          setApproachingDonors(donorsRes.data.data || []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load transit data");
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [campId]);

  // ✅ NEW: Fetch predictions every 30 seconds
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_BASE_URL}/api/transit/camp/${campId}/predictions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPredictions(res.data);
      } catch (err) {
        console.error("Failed to fetch predictions:", err);
      }
    };

    fetchPredictions();
    const interval = setInterval(fetchPredictions, 30000);
    return () => clearInterval(interval);
  }, [campId]);

  // Real-time Socket.IO updates for approaching donors
  useEffect(() => {
    if (!campId) return;

    let isMounted = true;
    
    const socket = io(API_BASE_URL, { 
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000
    });

    socket.emit("join-camp", campId);
    socketRef.current = socket;

    socket.on("donor-transit-update", (data) => {
      if (!isMounted) return;

      setApproachingDonors(prev => {
        const existingIndex = prev.findIndex(d => d.donor?._id === data.donorId);
        const updatedDonor = {
          ...prev[existingIndex],
          location: { coordinates: data.coordinates },
          batteryLevel: data.batteryLevel ?? prev[existingIndex]?.batteryLevel,
          updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
          const newArr = [...prev];
          newArr[existingIndex] = updatedDonor;
          return newArr.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          fetchDonorProfile(data.donorId).then(profile => {
            if (profile && isMounted) {
              setApproachingDonors(current => [
                ...current,
                { ...profile, location: { coordinates: data.coordinates }, batteryLevel: data.batteryLevel, updatedAt: new Date().toISOString() }
              ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
            }
          });
          return prev;
        }
      });
    });

    return () => {
      isMounted = false;
      const currentSocket = socket;
      const delay = import.meta.env.DEV ? 100 : 0;
      setTimeout(() => {
        if (socketRef.current === currentSocket) {
          currentSocket.disconnect();
          socketRef.current = null;
        }
      }, delay);
    };
  }, [campId]);

  const fetchDonorProfile = async (donorId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/donor/${donorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data || res.data.donor;
    } catch {
      return null;
    }
  };

  const getBatteryColor = (level) => {
    if (level === null || level === undefined) return "text-gray-400";
    if (level > 80) return "text-green-500";
    if (level > 20) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <Navigation className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">Unable to Load Transit Data</h2>
          <p className="text-gray-600">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-advanced w-full">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-200">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Live Transit View</h1>
            <p className="text-sm text-gray-600">{camp?.title}</p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-700">Approaching Donors</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{approachingDonors.length}</span>
        </div>

        {/* ✅ NEW: Prediction Summary Cards */}
        {predictions && predictions.predictions?.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Clock size={12} /> Arriving in 15 min
              </p>
              <p className="text-2xl font-bold text-green-600">{predictions.summary.arrivingIn15Min}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Navigation size={12} /> Avg Distance
              </p>
              <p className="text-2xl font-bold text-blue-600">{Math.round(predictions.summary.avgDistanceKm)} km</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <BatteryLow size={12} /> Low Battery
              </p>
              <p className={`text-2xl font-bold ${predictions.summary.lowBatteryCount > 0 ? "text-red-600" : "text-gray-400"}`}>
                {predictions.summary.lowBatteryCount}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Confidence</p>
              <p className="text-2xl font-bold text-purple-600">
                {predictions.predictions[0]?.confidence === "high" ? "High" : 
                 predictions.predictions[0]?.confidence === "medium" ? "Med" : "Low"}
              </p>
            </div>
          </div>
        )}

        {/* Donors List */}
        {approachingDonors.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Donors En Route</h3>
            <p className="text-sm text-gray-500">Donors who enable location sharing will appear here in real-time.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approachingDonors.map((donor) => (
              <div key={donor.donor?._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{donor.donor?.fullName}</h3>
                    <p className="text-sm text-gray-500">{donor.donor?.phone}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {donor.donor?.bloodGroup}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {/* ✅ UPDATED: Show ETA with distance and confidence warning */}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={14} />
                    <span>
                      {donor.etaMinutes !== null 
                        ? `~${donor.etaMinutes} min away (${donor.distanceKm}km)` 
                        : "En route"}
                    </span>
                    {donor.confidence === "low" && (
                      <AlertTriangle size={12} className="text-yellow-500" title="Low confidence ETA" />
                    )}
                  </div>
                  
                  {donor.batteryLevel !== undefined && (
                    <div className={`flex items-center gap-2 ${getBatteryColor(donor.batteryLevel)}`}>
                      <Battery size={14} />
                      <span>{Math.round(donor.batteryLevel)}% battery</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Navigation size={12} />
                    <span>Last update: {new Date(donor.updatedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}