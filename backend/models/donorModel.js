import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const donorSchema = new mongoose.Schema(
  {
    // 👤 Basic Info
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // 🔑 IMPORTANT: Prevents password from being returned in queries
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      // ✅ FIXED: Nepal phone numbers start with 9 (e.g., 98XXXXXXXX)
      match: [/^[9][0-9]{9}$/, "Please enter a valid 10-digit Nepal phone number"],
    },
    role: {
      type: String,
      default: "donor",
      enum: ["donor"],
    },

    // 📍 Location & Address
    address: {
      street: { type: String, required: [true, "Street address is required"], trim: true },
      city: { type: String, required: [true, "City is required"], trim: true },
      state: { type: String, required: [true, "Province/State is required"], trim: true },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        match: [/^[0-9]{5}$/, "Please enter a valid 5-digit postal code"],
        trim: true,
      },
    },

    // ✅ FIXED: Geospatial location for emergency matching
    // ❌ REMOVED defaults to prevent incomplete GeoJSON objects from breaking the 2dsphere index
    location: {
      type: { 
        type: String, 
        enum: ["Point"]
      },
      coordinates: { 
        type: [Number]
      },
    },
    lastLocationUpdate: { type: Date, default: Date.now },

    // 🩸 Medical / Blood Info
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: {
        values: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
        message: "{VALUE} is not a valid blood group"
      },
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [18, "Must be at least 18 years old to donate blood"],
      max: [65, "Age limit for blood donation is 65 years"],
    },
    gender: {
      type: String,
      enum: {
        values: ["Male", "Female", "Other"],
        message: "{VALUE} is not a valid gender"
      },
      required: [true, "Gender is required"],
    },
    
    healthInfo: {
      weight: { 
        type: Number, 
        min: [45, "Minimum weight should be 45kg to donate blood"] 
      },
      height: { type: Number },
      hasDiseases: { type: Boolean, default: false },
      diseaseDetails: { type: String, trim: true }
    },

    lastDonationDate: { type: Date },

    eligibleToDonate: { type: Boolean, default: true },

    // 📜 Donation History
    donationHistory: [
      {
        donationDate: { type: Date, default: Date.now },
        facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility" },
        bloodGroup: {
          type: String,
          enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
        },
        quantity: { type: Number, default: 1, min: 1 },
        remarks: { type: String, trim: true },
        verified: { type: Boolean, default: false },
      },
    ],

    contactHistory: [
      {
        contactedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Facility" },
        contactDate: { type: Date, default: Date.now },
        contactType: { type: String, enum: ["hospital", "blood-lab"], default: "hospital" }
      }
    ],

    // 🔐 Security & Access
    lastLogin: { type: Date, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 🧹 Safety Hook: Prevent saving incomplete GeoJSON objects via .save()
donorSchema.pre("save", function (next) {
  if (this.location && this.location.type === "Point") {
    // If coordinates are missing or don't have exactly 2 numbers, delete the location
    if (!this.location.coordinates || this.location.coordinates.length !== 2) {
      this.location = undefined;
      this.lastLocationUpdate = undefined;
    }
  }
  next();
});

// 🔐 Pre-save hook: Hash password before saving if it's new or modified
donorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password.trim(), salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🧠 Instance Method: Compare password
donorSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword.trim(), this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// 🧩 Virtual: Calculate 90-day donation eligibility based on last donation date
donorSchema.virtual("isEligible").get(function () {
  if (!this.lastDonationDate) return true;
  const last = new Date(this.lastDonationDate);
  const now = new Date();
  const diff = (now - last) / (1000 * 60 * 60 * 24); // Difference in days
  return diff >= 90; // Standard 90-day gap rule
});

// Optional: Add indexes for faster queries
donorSchema.index({ email: 1 });
donorSchema.index({ phone: 1 });
donorSchema.index({ bloodGroup: 1, lastDonationDate: 1 }); // Speeds up donor search

// ✅ NEW: 2dsphere index for geospatial radius queries
donorSchema.index({ location: "2dsphere" });

const Donor = mongoose.model("Donor", donorSchema);
export default Donor;