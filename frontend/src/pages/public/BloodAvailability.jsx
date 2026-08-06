// frontend/src/pages/public/BloodAvailability.jsx
import { useState } from "react";
import axios from "axios";
import { Droplet, MapPin, Phone, AlertCircle, Loader2 } from "lucide-react";

const API_BASE_URL = import.meta.env.PROD 
  ? "https://khoonn-backend.onrender.com" 
  : "http://localhost:5000";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function BloodAvailability() {
  const [bloodType, setBloodType] = useState("");
  const [city, setCity] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!bloodType) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const params = { bloodType };
      if (city.trim()) params.city = city.trim();

      const res = await axios.get(`${API_BASE_URL}/api/blood/availability`, { params });
      setResults(res.data.data || []);
      
      if (res.data.count === 0) {
        setError(`No ${bloodType} blood currently available${city ? ` in ${city}` : ""}.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Well-Stocked": return "bg-green-100 text-green-800 border-green-200";
      case "Available": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Limited": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Droplet className="w-8 h-8 text-red-600" />
            Find Available Blood
          </h1>
          <p className="text-gray-600">Search for blood units at hospitals near you. No login required.</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type *</label>
              <select 
                value={bloodType} 
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Select type</option>
                {BLOOD_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City (Optional)</label>
              <input 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Kathmandu"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button 
                type="submit" 
                disabled={loading || !bloodType}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </button>
            </div>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">{error}</p>
              <p className="text-sm text-amber-700 mt-1">Try expanding your search or contact emergency services at 108.</p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Found {results.length} facility(ies) with {bloodType} blood
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((facility, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{facility.facilityName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(facility.status)}`}>
                      {facility.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span>{facility.address.street}, {facility.address.city}, {facility.address.state}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <a href={`tel:${facility.phone}`} className="text-red-600 hover:text-red-700 font-medium">
                        {facility.phone}
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Nearest expiry: {new Date(facility.nearestExpiry).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}