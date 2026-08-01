import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const facilitySchema = new mongoose.Schema(
  {
    // 🏥 Basic Info
    name: {
      type: String,
      required: [true, "Facility name is required"],
      trim: true,
      maxlength: [150, "Name cannot exceed 150 characters"],
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

    // 📞 Contact Info
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      // ✅ FIXED: Nepal phone numbers start with 9 (e.g., 98XXXXXXXX)
      match: [/^[9][0-9]{9}$/, "Please enter a valid 10-digit Nepal phone number"],
    },
    emergencyContact: {
      type: String,
      required: [true, "Emergency contact number is required"],
      match: [/^[9][0-9]{9}$/, "Please enter a valid 10-digit Nepal phone number"],
    },
    
    // ✅ ADDED: Fields referenced in your updateProfile controller
    contactPerson: { type: String, trim: true },
    services: { type: String, trim: true },
    description: { type: String, trim: true },
    website: { type: String, trim: true },

    // 📍 Location
    address: {
      street: { type: String, required: [true, "Street address is required"], trim: true },
      city: { type: String, required: [true, "City is required"], trim: true },
      state: { type: String, required: [true, "Province/State is required"], trim: true },
      pincode: {
        type: String,
        required: [true, "Pincode is required"],
        // ✅ FIXED: Updated to 5-digit regex for Nepal postal codes (e.g., 32900)
        match: [/^[0-9]{5}$/, "Please enter a valid 5-digit postal code"],
        trim: true,
      },
    },

    // 🧾 Facility Details
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    facilityType: {
      type: String,
      enum: {
        values: ["hospital", "blood-lab"],
        message: "{VALUE} is not a valid facility type"
      },
      required: [true, "Facility type is required"],
    },
    role: {
      type: String,
      enum: ["hospital", "blood-lab"],
    },
    facilityCategory: {
      type: String,
      enum: ["Government", "Private", "Trust", "Charity", "Other"],
      default: "Private",
    },

    // 📄 Documents & Verification
    documents: {
      registrationProof: {
        url: { type: String, required: [true, "Document URL is required"] },
        filename: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "{VALUE} is not a valid status"
      },
      default: "pending",
      index: true, // ✅ Index for fast admin filtering
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true },

    // 🕒 Operating Info
    operatingHours: {
      open: { type: String, default: "09:00" },
      close: { type: String, default: "18:00" },
      workingDays: {
        type: [String],
        enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        default: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      },
    },
    is24x7: { type: Boolean, default: false },
    emergencyServices: { type: Boolean, default: false },

    // 📜 History for Admin Dashboard
    history: {
      type: [
        {
          eventType: {
            type: String,
            enum: [
              "Login",
              "Verification",
              "Stock Update",
              "Blood Camp",
              "Request Approved",
              "Profile Update",
              "Donation",
              "Contact", // ✅ Added for contact logging
            ],
          },
          description: { type: String, trim: true },
          date: { type: Date, default: Date.now },
          referenceId: { type: mongoose.Schema.Types.ObjectId }, // ✅ Added to link to specific records (e.g., camp ID, request ID)
        },
      ],
      default: [],
    },

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

// 🧩 Auto-assign role from facilityType
facilitySchema.pre("save", function (next) {
  if (this.facilityType && !this.role) {
    this.role = this.facilityType;
  }
  next();
});

// 🔐 Hash password before save
facilitySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password.trim(), salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🧠 Compare password
facilitySchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword.trim(), this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// ✅ Performance Indexes
facilitySchema.index({ email: 1 });
facilitySchema.index({ registrationNumber: 1 });
facilitySchema.index({ facilityType: 1, status: 1 }); // Speeds up admin approval lists

export default mongoose.model("Facility", facilitySchema);