import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2, Save, Edit3, X, MapPin, Mail, FlaskConical, Phone,
  User, Shield, Heart, Droplet, Clock, Building, AlertCircle,
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const defaultOperatingHours = {
  weekdays: "",
  weekends: "",
  notes: "",
};

const LabProfile = () => {
  const [facility, setFacility] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    emergencyContact: "",
    facilityCategory: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
    contactPerson: "",
    operatingHours: defaultOperatingHours,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ FIXED: Uses dynamic API_BASE_URL instead of hardcoded '/api'
  const API_ENDPOINT = `${API_BASE_URL}/api`;

  const initializeOperatingHours = (hoursData) => {
    if (hoursData && typeof hoursData === "object" && !Array.isArray(hoursData)) {
      return {
        weekdays: hoursData.weekdays || "",
        weekends: hoursData.weekends || "",
        notes: hoursData.notes || "",
      };
    }
    return defaultOperatingHours;
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const path = name.includes(".") ? name : name;

    switch (path) {
      case "phone":
      case "emergencyContact":
        if (value && !/^\d{10}$/.test(value)) {
          newErrors[path] = "Must be a valid 10-digit phone number";
        } else {
          delete newErrors[path];
        }
        break;
      case "address.pincode":
        if (value && !/^\d{6}$/.test(value)) {
          newErrors["address.pincode"] = "Must be a valid 6-digit pincode";
        } else {
          delete newErrors["address.pincode"];
        }
        break;
      default:
        break;
    }

    if (value === "" && !["phone", "emergencyContact", "address.pincode"].includes(path)) {
      delete newErrors[path];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authorization token found.");
      }

      // ✅ FIXED: Absolute URL pointing to Render backend
      const { data } = await axios.get(`${API_ENDPOINT}/facility/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setFacility(data.facility);
        setFormData({
          name: data.facility.name || "",
          phone: data.facility.phone || "",
          emergencyContact: data.facility.emergencyContact || "",
          facilityCategory: data.facility.facilityCategory || "",
          address: {
            street: data.facility.address?.street || "",
            city: data.facility.address?.city || "",
            state: data.facility.address?.state || "",
            pincode: data.facility.address?.pincode || "",
          },
          contactPerson: data.facility.contactPerson || "",
          operatingHours: initializeOperatingHours(data.facility.operatingHours),
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Fetch Profile Error:", error);
      let message;

      if (error.message.includes("No authorization token found") || error.response?.status === 401) {
        message = "Session expired or unauthorized. Please log in.";
        localStorage.removeItem("token");
        setFacility(null);
        toast.error(message);
        return;
      }

      message = error.response?.data?.message || "Failed to load profile";
      toast.error(message);
      setFacility(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setFormData((prev) => {
        const updatedData = { ...prev, address: { ...prev.address, [key]: value } };
        validateField(name, value);
        return updatedData;
      });
    } else if (name.startsWith("operatingHours.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        operatingHours: { ...prev.operatingHours, [key]: value },
      }));
    } else {
      setFormData((prev) => {
        const updatedData = { ...prev, [name]: value };
        validateField(name, value);
        return updatedData;
      });
    }
  };

  const handleSave = async () => {
    const currentErrors = Object.values(errors).filter((e) => e).length > 0;

    if (currentErrors) {
      toast.error("Please fix validation errors before saving");
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required to save changes.");
        setSaving(false);
        return;
      }

      // ✅ FIXED: Absolute URL pointing to Render backend
      const { data } = await axios.put(`${API_ENDPOINT}/facility/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success("Profile updated successfully!");
        setFacility(data.facility);
        setIsEditing(false);
        setErrors({});
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Update Profile Error:", error);
      const message = error.response?.data?.message || "Update failed";
      toast.error(message);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    if (facility) {
      setFormData({
        name: facility.name || "",
        phone: facility.phone || "",
        emergencyContact: facility.emergencyContact || "",
        facilityCategory: facility.facilityCategory || "",
        address: {
          street: facility.address?.street || "",
          city: facility.address?.city || "",
          state: facility.address?.state || "",
          pincode: facility.address?.pincode || "",
        },
        contactPerson: facility.contactPerson || "",
        operatingHours: initializeOperatingHours(facility.operatingHours),
      });
    }
  };

  const getInputClass = (fieldName, isEditing) => {
    const hasError = errors[fieldName];
    return `w-full px-4 py-2.5 bg-background border rounded-[var(--radius)] text-foreground text-sm transition-all focus:outline-none focus:ring-[3px] disabled:opacity-50 disabled:cursor-not-allowed ${
      hasError
        ? "border-destructive focus:border-destructive focus:ring-destructive/15"
        : isEditing
        ? "border-input focus:border-ring focus:ring-ring/15"
        : "border-border bg-muted/50"
    }`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" },
      pending: { color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
      rejected: { color: "bg-destructive/10 text-destructive border-destructive/20" },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  if (loading && !facility) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading Laboratory Profile...</p>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center bg-card border border-border rounded-2xl p-8 max-w-sm w-full">
          <Droplet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Facility Profile Error</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Could not load profile. Please ensure you are authenticated.
          </p>
          <button onClick={fetchProfile} className="btn-advanced w-full justify-center">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Droplet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {facility.name || "Laboratory Profile"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <FlaskConical size={16} className="text-primary" />
                  {facility.facilityCategory?.toUpperCase() || "BLOOD LAB"} • 
                  <span className="font-mono text-xs">{facility.registrationNumber}</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button onClick={handleCancel} className="btn-ghost">
                    <X size={16} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || hasErrors}
                    className="btn-advanced disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="btn-advanced">
                  <Edit3 size={16} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Verification Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(facility.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="text-sm font-medium text-foreground">{facility.facilityCategory || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Registration</span>
                  <span className="text-sm font-mono text-foreground">{facility.registrationNumber}</span>
                </div>
                {facility.approvedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Approved On</span>
                    <span className="text-sm text-foreground">
                      {new Date(facility.approvedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Contact */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Quick Contact
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground truncate">{facility.email}</span>
                </div>
                {facility.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{facility.phone}</span>
                  </div>
                )}
                {facility.emergencyContact && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">Emergency: {facility.emergencyContact}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Editable Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6 space-y-8">
              
              {/* General Facility Details */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Facility Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Facility Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={getInputClass("name", isEditing)}
                      placeholder="e.g., Central Diagnostics Lab"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Facility Category</label>
                    <input
                      type="text"
                      name="facilityCategory"
                      value={formData.facilityCategory}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={getInputClass("facilityCategory", isEditing)}
                      placeholder="e.g., Blood Lab, Radiology Center"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={getInputClass("phone", isEditing)}
                      placeholder="10-digit phone number"
                    />
                    {errors.phone && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Emergency Contact</label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={getInputClass("emergencyContact", isEditing)}
                      placeholder="Emergency contact number"
                    />
                    {errors.emergencyContact && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors.emergencyContact}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Contact Person</label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={getInputClass("contactPerson", isEditing)}
                      placeholder="Primary contact person name"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Facility Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {["street", "city", "state", "pincode"].map((field) => {
                    const fieldName = field === "pincode" ? "address.pincode" : `address.${field}`;
                    return (
                      <div key={field} className={field === "street" ? "md:col-span-2" : ""}>
                        <label className="block text-sm font-medium text-foreground mb-1.5 capitalize">
                          {field === "pincode" ? "PIN Code" : field}
                        </label>
                        <input
                          type="text"
                          inputMode={field === "pincode" ? "numeric" : "text"}
                          name={`address.${field}`}
                          value={formData.address?.[field] || ""}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={getInputClass(fieldName, isEditing)}
                          placeholder={`Enter ${field === "pincode" ? "PIN code" : field}`}
                          maxLength={field === "pincode" ? 6 : undefined}
                        />
                        {field === "pincode" && errors["address.pincode"] && (
                          <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                            <AlertCircle size={14} /> {errors["address.pincode"]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Operating Hours */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Operating Hours
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Weekdays (e.g., Mon - Fri)</label>
                    <input
                      type="text"
                      name="operatingHours.weekdays"
                      value={formData.operatingHours.weekdays}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={getInputClass("operatingHours.weekdays", isEditing)}
                      placeholder="e.g., 9:00 AM to 5:00 PM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Weekends (e.g., Sat - Sun)</label>
                    <input
                      type="text"
                      name="operatingHours.weekends"
                      value={formData.operatingHours.weekends}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={getInputClass("operatingHours.weekends", isEditing)}
                      placeholder="e.g., 9:00 AM to 1:00 PM or Closed"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">Additional Notes</label>
                    <textarea
                      name="operatingHours.notes"
                      value={formData.operatingHours.notes}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={3}
                      className={`${getInputClass("operatingHours.notes", isEditing)} resize-none`}
                      placeholder="e.g., Emergency services available 24/7."
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabProfile;