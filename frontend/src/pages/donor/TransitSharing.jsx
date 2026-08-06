// frontend/src/pages/donor/TransitSharing.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTransitTracking } from "../../hooks/useTransitTracking";
import { MapPin, Battery, BatteryCharging, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export default function TransitSharing() {
  const { campId } = useParams();
  const navigate = useNavigate();
  const { isActive, error, batteryLevel, startTracking, stopTracking } = useTransitTracking(campId);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isActive) await stopTracking();
      else await startTracking();
    } finally {
      setLoading(false);
    }
  };

  // Get battery icon based on level
  const BatteryIcon = () => {
    if (batteryLevel === null) return <Battery className="w-5 h-5 text-gray-400" />;
    if (batteryLevel > 80) return <BatteryCharging className="w-5 h-5 text-green-500" />;
    if (batteryLevel > 20) return <Battery className="w-5 h-5 text-yellow-500" />;
    return <Battery className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-200">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Share Location</h1>
        </div>

        {/* Status Card */}
        <div className={`rounded-xl border p-6 transition-all ${
          isActive ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MapPin className={`w-6 h-6 ${isActive ? "text-green-600" : "text-gray-400"}`} />
              <span className="font-semibold text-lg">
                {isActive ? "Sharing Live Location" : "Location Sharing Off"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <BatteryIcon />
              {batteryLevel !== null && (
                <span className="text-sm font-medium">{Math.round(batteryLevel)}%</span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {isActive 
              ? "Camp staff can see your approximate location to prepare for your arrival. Updates are battery-optimized."
              : "Enable sharing to help camp staff anticipate your arrival time."}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleToggle}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              isActive 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-green-600 hover:bg-green-700 text-white"
            } disabled:opacity-50`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isActive ? (
              "Stop Sharing"
            ) : (
              "Start Sharing"
            )}
          </button>
        </div>

        {/* Privacy Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">Privacy & Safety</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Only verified camp staff can view your location</li>
            <li>Sharing stops automatically after 2 hours or when you arrive</li>
            <li>You can stop sharing at any time</li>
            <li>Battery usage is optimized based on your current charge level</li>
          </ul>
        </div>
      </div>
    </div>
  );
}