import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2, Save, Edit3, X, MapPin, Mail, Phone, User,
  Shield, Heart, Droplet, Calendar, Scale, Award, AlertCircle,
} from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" }
];

const DonorProfile = () => {
  const [donor, setDonor] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    age: "",
    gender: "",
    weight: "",
    bloodGroup: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
    password: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ FIXED: Uses dynamic API_BASE_URL instead of VITE_API_URL
  const API_ENDPOINT = `${API_BASE_URL}/api/donor`;

  const validationRules = {
    fullName: { required: true, minLength: 2, maxLength: 50 },
    phone: { required: true, pattern: /^[9][0-9]{9}$/ },
    age: { required: true, min: 18, max: 65 },
    gender: { required: true },
    weight: { required: true, min: 45, max: 200 },
    bloodGroup: { required: true },
    "address.street": { required: true, minLength: 2 },
    "address.city": { required: true, minLength: 2 },
    "address.state": { required: true, minLength: 2 },
    "address.pincode": { required: true, pattern: /^[0-9]{5}$/ },
    password: { minLength: 6 }
  };

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    if (rules.required && !value) return "This field is required";
    if (rules.minLength && value.length < rules.minLength) return `Minimum ${rules.minLength} characters required`;
    if (rules.maxLength && value.length > rules.maxLength) return `Maximum ${rules.maxLength} characters allowed`;
    if (rules.min && Number(value) < rules.min) return `Minimum value is ${rules.min}`;
    if (rules.max && Number(value) > rules.max) return `Maximum value is ${rules.max}`;
    if (rules.pattern && !rules.pattern.test(value)) {
      return name === "phone" ? "Must be a valid 10-digit Nepal number (e.g., 98XXXXXXXX)" : "Invalid format";
    }

    return null;
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authorization token found.");

      // ✅ FIXED: Absolute URL pointing to Render backend
      const { data } = await axios.get(`${API_ENDPOINT}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = data.user || data.donor || data;

      if (userData) {
        const lastDonationDate = userData.lastDonationDate || userData.lastDonation;
        setDonor({
          ...userData,
          lastDonation: lastDonationDate,
          status: userData.status || "active",
          donorId: userData._id || userData.id,
        });
        setFormData({
          fullName: userData.fullName || "",
          phone: userData.phone || "",
          age: userData.age || "",
          gender: userData.gender || "",
          weight: userData.weight || userData.healthInfo?.weight || "",
          bloodGroup: userData.bloodGroup || "",
          address: {
            street: userData.address?.street || "",
            city: userData.address?.city || "",
            state: userData.address?.state || "",
            pincode: userData.address?.pincode || "",
          },
          password: ""
        });
      } else {
        throw new Error(data.message || "User data not found");
      }
    } catch (error) {
      console.error("Fetch Donor Profile Error:", error);
      let message;

      if (error.message.includes("No authorization token found") || error.response?.status === 401) {
        message = "Session expired or unauthorized. Please log in.";
        localStorage.removeItem("token");
        setDonor(null);
        toast.error(message);
        return;
      }

      message = error.response?.data?.message || "Failed to load profile";
      toast.error(message);
      setDonor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (name.startsWith("address.")) {
        const key = name.split(".")[1];
        return { ...prev, address: { ...prev.address, [key]: value } };
      }
      return { ...prev, [name]: value };
    });

    const error = validateField(name, value);
    setErrors((prev) => {
      if (error) {
        return { ...prev, [name]: error };
      }
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSave = async () => {
    const newErrors = {};
    Object.keys(validationRules).forEach(key => {
      if (key === "password" && !formData.password) return;
      
      let value;
      if (key.startsWith("address.")) {
        const addressKey = key.split(".")[1];
        value = formData.address[addressKey];
      } else {
        value = formData[key];
      }
      
      const error = validateField(key, value);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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

      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        weight: Number(formData.weight),
        bloodGroup: formData.bloodGroup,
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          pincode: formData.address.pincode.trim(),
        },
      };

      if (formData.password && formData.password.length >= 6) {
        payload.password = formData.password;
      }

      // ✅ FIXED: Absolute URL pointing to Render backend
      const { data } = await axios.put(`${API_ENDPOINT}/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success("Profile updated successfully! 🎉");
        await fetchProfile();
        setIsEditing(false);
        setErrors({});
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Update Profile Error:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        toast.error(error.response?.data?.message || "Update failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    if (donor) {
      setFormData({
        fullName: donor.fullName || "",
        phone: donor.phone || "",
        age: donor.age || "",
        gender: donor.gender || "",
        weight: donor.weight || "",
        bloodGroup: donor.bloodGroup || "",
        address: {
          street: donor.address?.street || "",
          city: donor.address?.city || "",
          state: donor.address?.state || "",
          pincode: donor.address?.pincode || "",
        },
        password: ""
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
      active: { color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" },
      pending: { color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
      inactive: { color: "bg-destructive/10 text-destructive border-destructive/20" },
    };
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  if (loading && !donor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading Donor Profile...</p>
        </div>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center bg-card border border-border rounded-2xl p-8 max-w-sm w-full">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Donor Profile Error</h3>
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
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {donor.fullName || "Donor Profile"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Droplet size={16} className="text-primary" />
                  {donor.bloodGroup || "Blood Donor"} • 
                  <span className="font-mono text-xs">ID: {donor.donorId}</span>
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
            {/* Donor Status Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Donor Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(donor.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Blood Group</span>
                  <span className="text-sm font-bold text-primary">{donor.bloodGroup || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Donor ID</span>
                  <span className="text-sm font-mono text-foreground">{donor.donorId}</span>
                </div>
                {donor.lastDonation && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Donation</span>
                    <span className="text-sm text-foreground">
                      {new Date(donor.lastDonation).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Quick Info
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground truncate">{donor.email}</span>
                </div>
                {donor.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{donor.phone}</span>
                  </div>
                )}
                {donor.age && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{donor.age} years old</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Editable Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6 space-y-8">
              
              {/* Personal Details */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={getInputClass("fullName", isEditing)}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={getInputClass("phone", isEditing)}
                      placeholder="98XXXXXXXX"
                      maxLength={10}
                    />
                    {errors.phone && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      disabled={!isEditing}
                      min="18"
                      max="65"
                      className={getInputClass("age", isEditing)}
                      placeholder="Your age"
                    />
                    {errors.age && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors.age}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={getInputClass("gender", isEditing)}
                    >
                      <option value="">Select Gender</option>
                      {GENDER_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.gender && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors.gender}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      disabled={!isEditing}
                      min="45"
                      max="200"
                      step="0.1"
                      className={getInputClass("weight", isEditing)}
                      placeholder="Weight in kg"
                    />
                    {errors.weight && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors.weight}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={getInputClass("bloodGroup", isEditing)}
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map(group => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                    {errors.bloodGroup && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors.bloodGroup}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {["street", "city", "state", "pincode"].map((field) => {
                    const fieldName = `address.${field}`;
                    return (
                      <div key={field} className={field === "street" ? "md:col-span-2" : ""}>
                        <label className="block text-sm font-medium text-foreground mb-1.5 capitalize">
                          {field === "pincode" ? "Postal Code" : field === "state" ? "Province" : field}
                        </label>
                        <input
                          type="text"
                          inputMode={field === "pincode" ? "numeric" : "text"}
                          name={`address.${field}`}
                          value={formData.address?.[field] || ""}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={getInputClass(fieldName, isEditing)}
                          placeholder={`Enter ${field === "pincode" ? "5-digit postal code" : field}`}
                          maxLength={field === "pincode" ? 5 : undefined}
                        />
                        {errors[fieldName] && (
                          <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                            <AlertCircle size={14} /> {errors[fieldName]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Email Address
                </h3>
                <input
                  type="email"
                  value={donor.email}
                  disabled
                  className={getInputClass("email", false)}
                />
                <p className="text-xs text-muted-foreground mt-1.5">Email cannot be changed</p>
              </div>

              {/* Password Update */}
              {isEditing && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Change Password
                  </h3>
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={getInputClass("password", isEditing)}
                      placeholder="Enter new password (min. 6 characters)"
                    />
                    {errors.password && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors.password}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Leave blank to keep current password
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorProfile;