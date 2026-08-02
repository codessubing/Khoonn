"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

// ✅ PRODUCTION FIX: Dynamic API base URL
const API_BASE_URL = import.meta.env.PROD
  ? "https://khoonn-backend.onrender.com"
  : "http://localhost:5000";

// Constants for better maintainability
const FACILITY_TYPES = ["Hospital", "Blood Lab"];
const FACILITY_CATEGORIES = ["Government", "Private", "Trust", "Charity", "Other"];

// Nepal Provinces and major cities/districts
const NEPAL_LOCATIONS = {
  "Koshi Province": ["Biratnagar", "Dharan", "Itahari", "Damak", "Birtamod"],
  "Madhesh Province": ["Janakpur", "Birgunj", "Kalaiya", "Lahan", "Rajbiraj"],
  "Bagmati Province": ["Kathmandu", "Lalitpur", "Bhaktapur", "Bharatpur", "Hetauda", "Dhulikhel"],
  "Gandaki Province": ["Pokhara", "Baglung", "Damauli", "Gorkha"],
  "Lumbini Province": ["Butwal", "Nepalgunj", "Tansen", "Siddharthanagar", "Kapilvastu"],
  "Karnali Province": ["Birendranagar", "Jumla", "Dailekh", "Kalikot"],
  "Sudurpashchim Province": ["Dhangadhi", "Mahendranagar", "Dipayal", "Tikapur"],
};

const WORKING_DAYS = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" },
];

// Validation functions
const validators = {
  name: (value) => (!value.trim() ? "Facility name is required" : ""),
  email: (value) => {
    if (!value.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(value)) return "Please enter a valid email address";
    return "";
  },
  password: (value) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return "";
  },
  phone: (value) => {
    if (!value) return "Phone number is required";
    if (value.length !== 10) return "Phone number must be exactly 10 digits";
    if (!/^[9][0-9]{9}$/.test(value)) return "Phone number must start with 9 (e.g., 98XXXXXXXX)";
    return "";
  },
  emergencyContact: (value) => {
    if (!value) return "Emergency contact is required";
    if (value.length !== 10) return "Emergency contact must be exactly 10 digits";
    if (!/^[9][0-9]{9}$/.test(value)) return "Emergency contact must start with 9";
    return "";
  },
  registrationNumber: (value) => (!value.trim() ? "Registration number is required" : ""),
  "address.street": (value) => (!value.trim() ? "Street address is required" : ""),
  "address.city": (value) => (!value.trim() ? "City is required" : ""),
  "address.state": (value) => (!value.trim() ? "Province is required" : ""),
  "address.pincode": (value) => {
    if (!value) return "Pincode is required";
    if (!/^[0-9]{5}$/.test(value)) return "Pincode must be exactly 5 digits (e.g., 32900)";
    return "";
  },
  "documents.registrationProof.url": (value) => (!value.trim() ? "Document URL is required" : ""),
};

export default function FacilityRegisterForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    emergencyContact: "",
    address: { street: "", city: "", state: "", pincode: "" },
    registrationNumber: "",
    facilityType: "Hospital",
    facilityCategory: "Private",
    documents: { registrationProof: { url: "", filename: "" } },
    operatingHours: {
      open: "09:00",
      close: "18:00",
      workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
    is24x7: false,
    emergencyServices: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  const getInputClass = (fieldName) => {
    const hasError = touched[fieldName] && errors[fieldName];
    return `w-full px-4 py-2.5 bg-background border rounded-[var(--radius)] text-foreground text-sm transition-all focus:outline-none focus:ring-[3px] ${
      hasError
        ? "border-destructive focus:border-destructive focus:ring-destructive/15"
        : "border-input focus:border-ring focus:ring-ring/15"
    }`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      if (name.startsWith("address.")) {
        const field = name.split(".")[1];
        return { ...prev, address: { ...prev.address, [field]: value } };
      } else if (name.startsWith("documents.registrationProof.")) {
        const field = name.split(".")[2];
        return {
          ...prev,
          documents: {
            registrationProof: { ...prev.documents.registrationProof, [field]: value },
          },
        };
      } else if (name.startsWith("operatingHours.")) {
        const field = name.split(".")[1];
        if (field === "workingDays") {
          const options = Array.from(e.target.selectedOptions).map((o) => o.value);
          return { ...prev, operatingHours: { ...prev.operatingHours, workingDays: options } };
        }
        return { ...prev, operatingHours: { ...prev.operatingHours, [field]: value } };
      }
      return { ...prev, [name]: type === "checkbox" ? checked : value };
    });

    setTouched((prev) => ({ ...prev, [name]: true }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name);
  };

  const validateField = (fieldName) => {
    let value;
    if (fieldName.includes(".")) {
      const [parent, child] = fieldName.split(".");
      if (parent === "address") {
        value = formData.address[child];
      } else if (fieldName.startsWith("documents.")) {
        value = formData.documents.registrationProof.url;
      }
    } else {
      value = formData[fieldName];
    }

    const error = validators[fieldName]?.(value);
    setErrors((prev) => {
      if (error) return { ...prev, [fieldName]: error };
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const validateStep = () => {
    const newErrors = {};
    const stepValidations = {
      1: ["name", "email"],
      2: ["password", "facilityType"],
      3: [
        "phone",
        "emergencyContact",
        "registrationNumber",
        "address.street",
        "address.city",
        "address.state",
        "address.pincode",
        "documents.registrationProof.url",
      ],
    };

    stepValidations[step].forEach((field) => {
      let value;
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        if (parent === "address") {
          value = formData.address[child];
        } else if (field.startsWith("documents.")) {
          value = formData.documents.registrationProof.url;
        }
      } else {
        value = formData[field];
      }
      const error = validators[field]?.(value);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    const newTouched = { ...touched };
    stepValidations[step].forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"], [id="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    if (!validateStep()) {
      console.log("Validation failed on step 3. Data not submitted.");
      return;
    }

    setIsSubmitting(true);

    const rawFacilityType = formData.facilityType;
    const roleSlug = rawFacilityType.toLowerCase().replace(" ", "-");

    const submissionPayload = {
      ...formData,
      facilityType: roleSlug,
      role: roleSlug,
    };

    // ✅ FIXED: Uses dynamic API_BASE_URL instead of VITE_API_URL
    const API_URL = `${API_BASE_URL}/api/auth/register`; 

    console.log("Submitting to:", API_URL);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Facility Data Registered Successfully:", result);
        toast.success("✅ Facility Registered Successfully!");
        navigate("/");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Registration failed:", response.status, errorData);
        toast.error(`Registration failed: ${errorData.message || "Check server logs."}`);
      }
    } catch (error) {
      console.error("Network or fetch error:", error);
      toast.error("Registration failed due to a network error. Ensure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShowError = (fieldName) => touched[fieldName] && errors[fieldName];
  const progressPercentage = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="p-6 sm:p-8 border-b border-border bg-muted/30">
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-center mb-2">
            Blood Facility Registration
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            Register your facility in 3 simple steps
          </p>

          {/* Progress Bar */}
          <div className="mb-2 flex justify-between items-center text-sm font-medium">
            <span className="text-foreground">Step {step} of 3</span>
            <span className="text-muted-foreground">{progressPercentage.toFixed(0)}% Complete</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span className={step >= 1 ? "text-primary font-semibold" : ""}>Basic Info</span>
            <span className={step >= 2 ? "text-primary font-semibold" : ""}>Account</span>
            <span className={step >= 3 ? "text-primary font-semibold" : ""}>Details</span>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                  Facility Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass("name")}
                  placeholder="Enter facility name"
                />
                {shouldShowError("name") && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass("email")}
                  placeholder="Enter email address"
                />
                {shouldShowError("email") && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Account Information */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass("password")}
                    placeholder="Enter password (min 6 characters)"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {shouldShowError("password") && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.password}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="facilityType" className="block text-sm font-medium text-foreground mb-1.5">
                    Facility Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="facilityType"
                    name="facilityType"
                    value={formData.facilityType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass("facilityType")}
                  >
                    {FACILITY_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="facilityCategory" className="block text-sm font-medium text-foreground mb-1.5">
                    Facility Category
                  </label>
                  <select
                    id="facilityCategory"
                    name="facilityCategory"
                    value={formData.facilityCategory}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass("facilityCategory")}
                  >
                    {FACILITY_CATEGORIES.map((fc) => (
                      <option key={fc} value={fc}>
                        {fc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Facility Details */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                    Phone <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass("phone")}
                    placeholder="98XXXXXXXX"
                    maxLength="10"
                  />
                  {shouldShowError("phone") && (
                    <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={14} /> {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="emergencyContact" className="block text-sm font-medium text-foreground mb-1.5">
                    Emergency Contact <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="emergencyContact"
                    type="tel"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass("emergencyContact")}
                    placeholder="98XXXXXXXX"
                    maxLength="10"
                  />
                  {shouldShowError("emergencyContact") && (
                    <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={14} /> {errors.emergencyContact}
                    </p>
                  )}
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Address <span className="text-destructive">*</span>
                </label>

                <input
                  type="text"
                  name="address.street"
                  placeholder="Street Address / Tole"
                  value={formData.address.street}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass("address.street")}
                />
                {shouldShowError("address.street") && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors["address.street"]}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <select
                      name="address.state"
                      value={formData.address.state}
                      onChange={(e) => {
                        handleChange(e);
                        setFormData((prev) => ({
                          ...prev,
                          address: { ...prev.address, city: "", pincode: "" },
                        }));
                      }}
                      onBlur={handleBlur}
                      className={getInputClass("address.state")}
                    >
                      <option value="">Select Province</option>
                      {Object.keys(NEPAL_LOCATIONS).map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {shouldShowError("address.state") && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors["address.state"]}
                      </p>
                    )}
                  </div>

                  <div>
                    <select
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClass("address.city")}
                      disabled={!formData.address.state}
                    >
                      <option value="">Select City</option>
                      {formData.address.state &&
                        NEPAL_LOCATIONS[formData.address.state].map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                    </select>
                    {shouldShowError("address.city") && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors["address.city"]}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      name="address.pincode"
                      placeholder="e.g., 32900"
                      value={formData.address.pincode}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={getInputClass("address.pincode")}
                      maxLength="5"
                    />
                    {shouldShowError("address.pincode") && (
                      <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} /> {errors["address.pincode"]}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-foreground mb-1.5">
                  Registration Number <span className="text-destructive">*</span>
                </label>
                <input
                  id="registrationNumber"
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass("registrationNumber")}
                  placeholder="Enter registration number"
                />
                {shouldShowError("registrationNumber") && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.registrationNumber}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="documentUrl" className="block text-sm font-medium text-foreground mb-1.5">
                  Registration Proof URL <span className="text-destructive">*</span>
                </label>
                <input
                  id="documentUrl"
                  type="url"
                  name="documents.registrationProof.url"
                  value={formData.documents.registrationProof.url}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass("documents.registrationProof.url")}
                  placeholder="https://example.com/document.pdf"
                />
                {shouldShowError("documents.registrationProof.url") && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors["documents.registrationProof.url"]}
                  </p>
                )}
              </div>

              {/* Operating Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="openTime" className="block text-sm font-medium text-foreground mb-1.5">
                    Opening Time
                  </label>
                  <input
                    id="openTime"
                    type="time"
                    name="operatingHours.open"
                    value={formData.operatingHours.open}
                    onChange={handleChange}
                    className={getInputClass("operatingHours.open")}
                  />
                </div>
                <div>
                  <label htmlFor="closeTime" className="block text-sm font-medium text-foreground mb-1.5">
                    Closing Time
                  </label>
                  <input
                    id="closeTime"
                    type="time"
                    name="operatingHours.close"
                    value={formData.operatingHours.close}
                    onChange={handleChange}
                    className={getInputClass("operatingHours.close")}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="workingDays" className="block text-sm font-medium text-foreground mb-1.5">
                  Working Days
                </label>
                <select
                  id="workingDays"
                  name="operatingHours.workingDays"
                  multiple
                  value={formData.operatingHours.workingDays}
                  onChange={handleChange}
                  className={`${getInputClass("operatingHours.workingDays")} h-32`}
                  size={5}
                >
                  {WORKING_DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Hold Ctrl/Cmd to select multiple days
                </p>
              </div>

              {/* Service Options */}
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is24x7"
                    checked={formData.is24x7}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-ring/15 focus:ring-2 accent-primary cursor-pointer"
                  />
                  <span className="text-sm font-medium text-foreground">24x7 Service</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="emergencyServices"
                    checked={formData.emergencyServices}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-ring/15 focus:ring-2 accent-primary cursor-pointer"
                  />
                  <span className="text-sm font-medium text-foreground">Emergency Services</span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={`flex ${step > 1 ? "justify-between" : "justify-end"} pt-6 border-t border-border`}>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="btn-ghost"
                disabled={isSubmitting}
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-advanced"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-advanced flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Facility"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}