// backend/models/bloodCampModel.js
import mongoose from "mongoose";

const bloodCampSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
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
    date: {
      type: Date,
      required: [true, "Camp date is required"],
      index: true,
    },
    time: {
      start: { type: String, required: [true, "Start time is required"] },
      end: { type: String, required: [true, "End time is required"] },
    },
    location: {
      venue: { type: String, required: [true, "Venue name is required"], trim: true },
      city: { type: String, required: [true, "City is required"], trim: true },
      state: { type: String, required: [true, "Province/State is required"], trim: true },
      pincode: {
        type: String,
        match: [/^[0-9]{5}$/, "Please enter a valid 5-digit postal code"],
        trim: true,
      },
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
    // ✅ UPDATED: Enhanced registeredDonors schema for donation tracking
    registeredDonors: [
      {
        donor: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Donor" 
        },
        registeredAt: { 
          type: Date, 
          default: Date.now 
        },
        qrToken: { type: String, required: true },       // Unique token for QR generation
        checkedIn: { type: Boolean, default: false },    // Tracks if donor has arrived
        checkInTime: { type: Date },                     // When donor checked in
        // ✅ NEW: Donation tracking fields
        donationRecorded: { type: Boolean, default: false },     // Whether donation was completed
        donationRecordedAt: { type: Date },                     // When donation was recorded
        unitsDonated: { type: Number, default: 0 }              // How many units were donated
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
        message: "{VALUE} is not a valid camp status"
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
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Validate time range
bloodCampSchema.pre("save", function(next) {
  if (this.time && this.time.start && this.time.end) {
    if (this.time.start >= this.time.end) {
      return next(new Error("End time must be strictly after start time"));
    }
  }
  next();
});

// Performance indexes
bloodCampSchema.index({ hospital: 1, date: -1 });
bloodCampSchema.index({ status: 1, date: 1 });

export default mongoose.model("BloodCamp", bloodCampSchema);