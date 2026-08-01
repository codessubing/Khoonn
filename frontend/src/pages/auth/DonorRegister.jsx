"use client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

// Constants for better maintainability
const GENDERS = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Nepal Provinces and Major Cities/Districts
const NEPAL_LOCATIONS = {
  "Koshi Province": ["Biratnagar", "Dharan", "Itahari", "Damak", "Birtamod"],
  "Madhesh Province": ["Janakpur", "Birgunj", "Kalaiya", "Lahan", "Rajbiraj"],
  "Bagmati Province": ["Kathmandu", "Lalitpur", "Bhaktapur", "Bharatpur", "Hetauda", "Dhulikhel"],
  "Gandaki Province": ["Pokhara", "Baglung", "Damauli", "Gorkha"],
  "Lumbini Province": ["Butwal", "Nepalgunj", "Tansen", "Siddharthanagar", "Kapilvastu"],
  "Karnali Province": ["Birendranagar", "Jumla", "Dailekh", "Kalikot"],
  "Sudurpashchim Province": ["Dhangadhi", "Mahendranagar", "Dipayal", "Tikapur"],
};

// Validation functions
const validators = {
  fullName: (value) => (!value.trim() ? "Full name is required" : ""),
  email: (value) => {
    if (!value.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(value)) return "Please enter a valid email address";
    return "";
  },
  password: (value) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  },
  phone: (value) => {
    if (!value) return "Phone number is required";
    if (value.length !== 10) return "Phone number must be exactly 10 digits";
    if (!/^[9][0-9]{9}$/.test(value)) return "Phone number must start with 9 (Nepal)";
    return "";
  },
  emergencyContact: (value) => {
    if (!value) return "Emergency contact is required";
    if (value.length !== 10) return "Emergency contact must be exactly 10 digits";
    if (!/^[9][0-9]{9}$/.test(value)) return "Phone number must start with 9 (Nepal)";
    return "";
  },
  dob: (value) => {
    if (!value) return "Date of birth is required";
    const age = calculateAge(value);
    if (age < 18 || age > 65) return "Donor must be between 18 and 65 years old";
    return "";
  },
  gender: (value) => (!value ? "Gender is required" : ""),
  bloodGroup: (value) => (!value ? "Blood group is required" : ""),
  "healthInfo.weight": (value) => {
    if (!value) return "Weight is required";
    if (parseFloat(value) < 45) return "Minimum weight is 45kg";
    return "";
  },
  "healthInfo.height": (value) => (!value ? "Height is required" : ""),
  "address.street": (value) => (!value.trim() ? "Street address / Tole is required" : ""),
  "address.city": (value) => (!value.trim() ? "City / District is required" : ""),
  "address.state": (value) => (!value.trim() ? "Province is required" : ""),
  "address.pincode": (value) => {
    if (!value) return "Postal code is required";
    if (!/^[0-9]{5}$/.test(value)) return "Postal code must be 5 digits (e.g., 32900)";
    return "";
  },
};

// Helper function to calculate age
const calculateAge = (dobString) => {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function DonorRegisterForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    emergencyContact: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    healthInfo: {
      weight: "",
      height: "",
      hasDiseases: false,
      diseaseDetails: "",
    },
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
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
      if (name.startsWith("healthInfo.")) {
        const field = name.split(".")[1];
        return {
          ...prev,
          healthInfo: {
            ...prev.healthInfo,
            [field]: type === "checkbox" ? checked : value,
          },
        };
      } else if (name.startsWith("address.")) {
        const field = name.split(".")[1];
        return {
          ...prev,
          address: { ...prev.address, [field]: value },
        };
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
      value = parent === "healthInfo" ? formData.healthInfo[child] : formData.address[child];
    } else {
      value = formData[fieldName];
    }

    const error = validators[fieldName]?.(value, formData);
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
      1: ["fullName", "email", "password", "phone", "emergencyContact"],
      2: ["dob", "gender", "bloodGroup", "healthInfo.weight", "healthInfo.height"],
      3: ["address.street", "address.city", "address.state", "address.pincode"],
    };

    stepValidations[step].forEach((field) => {
      let value;
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        value = parent === "healthInfo" ? formData.healthInfo[child] : formData.address[child];
      } else {
        value = formData[field];
      }
      const error = validators[field]?.(value, formData);
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
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    if (!validateStep()) return;

    setIsSubmitting(true);

    // ✅ FIX: Construct payload to EXACTLY match your Mongoose schema
    const submissionPayload = {
      fullName: formData.fullName,       // Schema expects 'fullName'
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: "donor",
      bloodGroup: formData.bloodGroup,   // Schema expects 'bloodGroup'
      age: calculateAge(formData.dob),   // Calculate age from DOB
      gender: formData.gender,           // Schema expects 'gender'
      healthInfo: {
        weight: parseFloat(formData.healthInfo.weight) || 0,
        height: parseFloat(formData.healthInfo.height) || 0,
        hasDiseases: formData.healthInfo.hasDiseases,
        diseaseDetails: formData.healthInfo.diseaseDetails || ""
      },
      address: {                         // Schema expects nested address object
        street: formData.address.street,
        city: formData.address.city,
        state: formData.address.state,
        pincode: formData.address.pincode
      }
    };

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const API_URL = `${baseURL}/auth/register`;

    console.log("Submitting Donor Payload:", submissionPayload);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload),
      });

      const result = await response.json().catch(() => ({ message: "Server returned an invalid response" }));

      if (response.ok) {
        toast.success("🎉 Donor Registered Successfully!");
        navigate("/login");
      } else {
        toast.error(`Registration failed: ${result.message || "Please try again."}`);
      }
    } catch (error) {
      console.error("Network or fetch error:", error);
      toast.error("❌ Registration failed due to a network error. Is the backend running?");
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
            Blood Donor Registration
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            Join our life-saving mission in 3 simple steps
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
            <span className={step >= 1 ? "text-primary font-semibold" : ""}>Personal Info</span>
            <span className={step >= 2 ? "text-primary font-semibold" : ""}>Health Details</span>
            <span className={step >= 3 ? "text-primary font-semibold" : ""}>Address</span>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1.5">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass("fullName")}
                  placeholder="Enter your full name"
                />
                {shouldShowError("fullName") && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.fullName}
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
                    placeholder="Enter password (min 8 characters)"
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
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1.5">
                    Phone Number <span className="text-destructive">*</span>
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
            </div>
          )}

          {/* Step 2: Health Information */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-foreground mb-1.5">
                    Date of Birth <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="dob"
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass("dob")}
                  />
                  {shouldShowError("dob") && (
                    <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={14} /> {errors.dob}
                    </p>
                  )}
                  {formData.dob && !errors.dob && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Age: {calculateAge(formData.dob)} years
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-foreground mb-1.5">
                    Gender <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass("gender")}
                  >
                    <option value="">Select Gender</option>
                    {GENDERS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                  {shouldShowError("gender") && (
                    <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={14} /> {errors.gender}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="bloodGroup" className="block text-sm font-medium text-foreground mb-1.5">
                  Blood Group <span className="text-destructive">*</span>
                </label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass("bloodGroup")}
                >
                  <option value="">Select Blood Group</option>
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                {shouldShowError("bloodGroup") && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors.bloodGroup}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-foreground mb-1.5">
                    Weight (kg) <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="weight"
                    type="number"
                    name="healthInfo.weight"
                    value={formData.healthInfo.weight}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass("healthInfo.weight")}
                    placeholder="Minimum 45kg"
                    min="45"
                    step="0.1"
                  />
                  {shouldShowError("healthInfo.weight") && (
                    <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={14} /> {errors["healthInfo.weight"]}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-foreground mb-1.5">
                    Height (cm) <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="height"
                    type="number"
                    name="healthInfo.height"
                    value={formData.healthInfo.height}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass("healthInfo.height")}
                    placeholder="Height in cm"
                    min="100"
                    step="0.1"
                  />
                  {shouldShowError("healthInfo.height") && (
                    <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                      <AlertCircle size={14} /> {errors["healthInfo.height"]}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="hasDiseases"
                  name="healthInfo.hasDiseases"
                  checked={formData.healthInfo.hasDiseases}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-ring/15 focus:ring-2 accent-primary cursor-pointer"
                />
                <label htmlFor="hasDiseases" className="text-sm font-medium text-foreground cursor-pointer">
                  I have existing medical conditions
                </label>
              </div>

              {formData.healthInfo.hasDiseases && (
                <div>
                  <label htmlFor="diseaseDetails" className="block text-sm font-medium text-foreground mb-1.5">
                    Medical Conditions Details
                  </label>
                  <textarea
                    id="diseaseDetails"
                    name="healthInfo.diseaseDetails"
                    value={formData.healthInfo.diseaseDetails}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-background border border-input rounded-[var(--radius)] text-foreground text-sm transition-colors focus:outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/15 resize-none"
                    placeholder="Please describe any medical conditions, allergies, or medications..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Address Information (Nepal Specific) */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-foreground mb-1.5">
                  Street Address / Tole <span className="text-destructive">*</span>
                </label>
                <input
                  id="street"
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass("address.street")}
                  placeholder="e.g., Devinagar, Butwal-11"
                />
                {shouldShowError("address.street") && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {errors["address.street"]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-foreground mb-1.5">
                    Province <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="state"
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
                  <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1.5">
                    City / District <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="city"
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
                  <label htmlFor="pincode" className="block text-sm font-medium text-foreground mb-1.5">
                    Postal Code <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    name="address.pincode"
                    value={formData.address.pincode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={getInputClass("address.pincode")}
                    placeholder="e.g., 32900"
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
                  "Register as Donor"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}