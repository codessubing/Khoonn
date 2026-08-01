import mongoose from "mongoose";

const bloodCampSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility", // ✅ Fixed: References Facility, not User
      required: [true, "Organizing facility is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Camp title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    location: {
      venue: { type: String, required: [true, "Venue name is required"], trim: true },
      city: { type: String, required: [true, "City is required"], trim: true },
      state: { type: String, required: [true, "Province/State is required"], trim: true },
      pincode: {
        type: String,
        match: [/^[0-9]{5}$/, "Please enter a valid 5-digit postal code"], // ✅ Nepal format
        trim: true,
      },
    },
    date: {
      type: Date,
      required: [true, "Camp start date is required"],
      index: true,
    },
    enddate: {
      type: Date,
      // Optional, but if provided, must be after start date (handled in pre-save)
    },
    expectedDonors: { 
      type: Number, 
      default: 0,
      min: [0, "Expected donors cannot be negative"] 
    },
    actualDonors: { 
      type: Number, 
      default: 0,
      min: [0, "Actual donors cannot be negative"] 
    },
    registeredDonors: [
      {
        donor: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Donor" // ✅ Fixed: References Donor, not User
        },
        registeredAt: { 
          type: Date, 
          default: Date.now 
        },
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
        message: "{VALUE} is not a valid camp status",
      },
      default: "Upcoming",
      index: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { 
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// ✅ FIXED PRE-SAVE HOOK: Validates camp dates instead of blood expiration
bloodCampSchema.pre("save", function (next) {
  // Ensure end date is after start date if both are provided
  if (this.date && this.enddate) {
    if (new Date(this.enddate) <= new Date(this.date)) {
      return next(new Error("End date must be strictly after the start date"));
    }
  }
  next();
});

// ✅ Compound indexes for blazing-fast query performance
bloodCampSchema.index({ hospital: 1, date: -1 });
bloodCampSchema.index({ status: 1, date: 1 });

export default mongoose.model("BloodCamp", bloodCampSchema);