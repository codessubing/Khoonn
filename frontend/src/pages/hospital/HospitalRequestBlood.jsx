import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  Droplet, MapPin, Phone, Clock, Send, Loader2, AlertCircle 
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const HospitalRequestBlood = () => {
  const [labs, setLabs] = useState([]);
  const [form, setForm] = useState({
    labId: "",
    bloodType: "",
    units: ""
  });
  const [loading, setLoading] = useState(false);
  const [labsLoading, setLabsLoading] = useState(true);

  // ✅ FIXED: Uses dynamic API_BASE_URL instead of relative paths
  const FACILITY_API = `${API_BASE_URL}/api/facility`;
  const HOSPITAL_API = `${API_BASE_URL}/api/hospital`;

  const bloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  useEffect(() => {
    const loadLabs = async () => {
      try {
        setLabsLoading(true);
        const token = localStorage.getItem("token");
        // ✅ FIXED: Absolute URL pointing to Render backend
        const res = await axios.get(`${FACILITY_API}/labs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLabs(res.data.labs || []);
      } catch (err) {
        console.error("Load labs error:", err);
        toast.error(err.response?.data?.message || "Failed to load blood labs");
      } finally {
        setLabsLoading(false);
      }
    };
    loadLabs();
  }, []);

  const submitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      // ✅ FIXED: Absolute URL pointing to Render backend
      await axios.post(
        `${HOSPITAL_API}/blood/request`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Blood request sent successfully!");
      setForm({ labId: "", bloodType: "", units: "" });
    } catch (err) {
      console.error("Submit request error:", err);
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-2">
            <Droplet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Request Blood
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Request blood units from approved blood laboratories in your network.
          </p>
        </div>

        {/* Request Form */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
          <form onSubmit={submitRequest} className="space-y-6">
            {/* Select Lab */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                Select Blood Lab
              </label>
              {labsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading labs...
                </div>
              ) : (
                <select
                  value={form.labId}
                  onChange={(e) => setForm({ ...form, labId: e.target.value })}
                  className="input-minimal w-full"
                  required
                  disabled={labs.length === 0}
                >
                  <option value="">-- Select Blood Lab --</option>
                  {labs.map((lab) => (
                    <option key={lab._id} value={lab._id}>
                      {lab.name} — {lab.address?.city}
                      {lab.operatingHours && ` (${lab.operatingHours.open} - ${lab.operatingHours.close})`}
                    </option>
                  ))}
                </select>
              )}
              {labs.length === 0 && !labsLoading && (
                <div className="flex items-center gap-2 text-destructive text-sm mt-2">
                  <AlertCircle size={14} />
                  No approved blood labs available
                </div>
              )}
            </div>

            {/* Blood Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <Droplet size={16} className="text-primary" />
                Blood Type
              </label>
              <select
                value={form.bloodType}
                onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                className="input-minimal w-full"
                required
              >
                <option value="">-- Select Blood Type --</option>
                {bloodTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Units */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Units Needed
              </label>
              <input
                type="number"
                className="input-minimal w-full"
                value={form.units}
                min="1"
                max="100"
                onChange={(e) => setForm({ ...form, units: e.target.value })}
                placeholder="Enter number of units"
                required
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Minimum 1 unit, maximum 100 units per request.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || labs.length === 0}
              className="btn-advanced w-full justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Blood Request
                </>
              )}
            </button>
          </form>
        </div>

        {/* Available Labs Info */}
        {labs.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              Available Blood Labs ({labs.length})
            </h3>
            <div className="space-y-3">
              {labs.map((lab) => (
                <div 
                  key={lab._id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{lab.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">
                        {lab.address?.street}, {lab.address?.city}, {lab.address?.state} - {lab.address?.pincode}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1.5 text-sm text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="shrink-0" />
                      {lab.operatingHours?.open || "N/A"} - {lab.operatingHours?.close || "N/A"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="shrink-0" />
                      {lab.phone || "N/A"}
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
};

export default HospitalRequestBlood;